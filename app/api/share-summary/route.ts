import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { summaryDb, sendDb, userDb } from '@/lib/database';
import { sendSummaryEmail } from '@/lib/email-service';

/**
 * POST /api/share-summary - Share a summary via email
 * 
 * Body: {
 *   summary_id: string,
 *   recipients: string[],
 *   subject?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { summary_id, recipients, subject } = body;

    if (!summary_id || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'summary_id and recipients array are required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await userDb.findByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get summary and verify ownership
    const summary = await summaryDb.findById(summary_id);
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    if (summary.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to share this summary' },
        { status: 403 }
      );
    }

    // Get current user details for email
    const clerkUser = await currentUser();
    const senderName = clerkUser?.firstName && clerkUser?.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}` 
      : clerkUser?.firstName || 'MeetBrief User';

    // Create send record in database
    const emailSubject = subject || `Meeting Summary: ${summary.title}`;
    const sendRecord = await sendDb.create({
      summary_id: summary.id,
      user_id: user.id,
      recipients,
      subject: emailSubject
    });

    console.log(`📧 Preparing to send summary ${summary.id} to ${recipients.length} recipients`);

    // Send email using Resend
    try {
      const emailResult = await sendSummaryEmail({
        summary: {
          title: summary.title,
          content: summary.summary,
          ai_model: summary.ai_model,
          created_at: summary.created_at.toISOString(),
        },
        sender: {
          name: senderName,
          email: clerkUser?.emailAddresses[0]?.emailAddress || user.email,
        },
        recipients
      });

      if (emailResult.success && emailResult.id) {
        // Mark as sent in database
        await sendDb.markSent(sendRecord.id, emailResult.id);
        
        console.log(`✅ Summary shared successfully with email ID: ${emailResult.id}`);

        return NextResponse.json({
          success: true,
          message: `Summary shared successfully with ${recipients.length} recipients`,
          send_id: sendRecord.id,
          email_id: emailResult.id,
          recipients
        });

      } else {
        // Mark as failed in database
        await sendDb.markFailed(sendRecord.id, emailResult.error || 'Email sending failed');
        
        return NextResponse.json(
          {
            error: 'Failed to send email',
            message: emailResult.error || 'Unknown email error',
            send_id: sendRecord.id
          },
          { status: 500 }
        );
      }

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // Mark as failed in database
      await sendDb.markFailed(
        sendRecord.id, 
        emailError instanceof Error ? emailError.message : 'Email service error'
      );

      return NextResponse.json(
        {
          error: 'Email service error',
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          send_id: sendRecord.id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in /api/share-summary:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share-summary - Get user's email send history
 * Query params: ?limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user from database
    const user = await userDb.findByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's send history
    const sends = await sendDb.findByUserId(user.id, limit);

    return NextResponse.json({
      success: true,
      sends: sends.map(send => ({
        id: send.id,
        summary_id: send.summary_id,
        recipients: send.recipients,
        subject: send.subject,
        status: send.status,
        sent_at: send.sent_at,
        email_id: send.email_id,
        // @ts-ignore - summary_title comes from JOIN
        summary_title: send.summary_title
      }))
    });

  } catch (error) {
    console.error('❌ Error getting send history:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch send history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
