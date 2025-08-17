import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

interface DirectEmailRequest {
  summary: {
    title: string;
    content: string;
    ai_model: string;
    created_at: string;
  };
  recipients: string[];
  subject: string;
  sender_name: string;
  sender_email: string;
}

function generateSummaryEmailHTML(data: DirectEmailRequest): string {
  const { summary, sender_name, sender_email } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Summary - ${summary.title}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
        }
        .container { 
            background: white; 
            border-radius: 12px; 
            padding: 32px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 20px; 
            margin-bottom: 24px; 
            text-align: center; 
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #3b82f6; 
            margin-bottom: 8px; 
        }
        .title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #1f2937; 
            margin: 16px 0; 
        }
        .meta { 
            background: #f1f5f9; 
            padding: 16px; 
            border-radius: 8px; 
            margin: 16px 0; 
            font-size: 14px; 
            color: #64748b; 
        }
        .content { 
            font-size: 16px; 
            line-height: 1.8; 
            color: #374151; 
            white-space: pre-wrap; 
        }
        .content h1, .content h2, .content h3 { 
            color: #1f2937; 
            margin-top: 24px; 
            margin-bottom: 12px; 
        }
        .content ul, .content ol { 
            margin: 12px 0; 
            padding-left: 24px; 
        }
        .content li { 
            margin: 4px 0; 
        }
        .footer { 
            margin-top: 32px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            font-size: 14px; 
            color: #6b7280; 
        }
        .ai-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📝 Meetbrief</div>
            <p>AI-Powered Meeting Summary</p>
        </div>
        
        <div class="title">${summary.title}</div>
        
        <div class="meta">
            <strong>📤 Shared by:</strong> ${sender_name} (${sender_email})<br>
            <strong>📅 Generated:</strong> ${new Date(summary.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}<br>
            <strong>🤖 AI Model:</strong> <span class="ai-badge">${summary.ai_model}</span>
        </div>
        
        <div class="content">${summary.content.replace(/\n/g, '<br>')}</div>
        
        <div class="footer">
            <p>This summary was generated using AI and shared via <strong>Meetbrief</strong></p>
            <p style="margin-top: 16px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://meetbrief.vercel.app'}" style="color: #3b82f6; text-decoration: none;">Try Meetbrief</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

function generateSummaryEmailText(data: DirectEmailRequest): string {
  const { summary, sender_name, sender_email } = data;
  
  return `
MEETING SUMMARY - ${summary.title}

Shared by: ${sender_name} (${sender_email})
Generated: ${new Date(summary.created_at).toLocaleDateString()}
AI Model: ${summary.ai_model}

---

${summary.content}

---

This summary was generated using AI and shared via Meetbrief.
Try Meetbrief: ${process.env.NEXT_PUBLIC_APP_URL || 'https://meetbrief.vercel.app'}
  `.trim();
}

/**
 * Sanitize tag values to only contain ASCII letters, numbers, underscores, or dashes
 */
function sanitizeTagValue(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace invalid chars with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase() // Convert to lowercase
    .substring(0, 50); // Limit length
}

export async function POST(req: NextRequest) {
  try {
    console.log('📧 Direct Email API called');

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const body: DirectEmailRequest = await req.json();
    const { summary, recipients, subject, sender_name, sender_email } = body;

    if (!summary || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Summary and recipients are required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email.trim()));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`📬 Sending summary to ${recipients.length} recipients`);
    console.log(`📑 Subject: ${subject}`);

    const htmlContent = generateSummaryEmailHTML(body);
    const textContent = generateSummaryEmailText(body);

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Meetbrief <onboarding@resend.dev>',
      to: recipients,
      subject: subject || `Meeting Summary: ${summary.title}`,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Meetbrief-Summary': 'true',
        'X-Meetbrief-Sender': sender_email,
      },
      tags: [
        {
          name: 'category',
          value: sanitizeTagValue('summary-share')
        },
        {
          name: 'ai-model',
          value: sanitizeTagValue(summary.ai_model)
        }
      ]
    });

    console.log('✅ Email sent successfully:', response.data?.id);
    
    return NextResponse.json({
      success: true,
      message: `Summary shared successfully with ${recipients.length} recipient(s)`,
      email_id: response.data?.id || 'unknown',
      recipients
    });

  } catch (error) {
    console.error('❌ Direct email error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to send email',
        message: error instanceof Error ? error.message : 'Unknown email error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct Email API',
    status: 'ready',
    resend_configured: !!process.env.RESEND_API_KEY,
    timestamp: new Date().toISOString()
  });
}
