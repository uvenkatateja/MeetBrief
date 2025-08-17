import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { userDb, transcriptDb, summaryDb, usageDb } from '@/lib/database';
import { summarizeTranscript } from '@/lib/ai-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/summarize - Generate AI summary of transcript
 * 
 * Body: {
 *   transcript_id: string,
 *   prompt?: string,
 *   title?: string
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
    const { transcript_id, prompt, title } = body;

    if (!transcript_id) {
      return NextResponse.json(
        { error: 'transcript_id is required' },
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

    // Check rate limits based on user plan
    const monthlyUsage = await usageDb.getMonthlyUsage(user.id, 'summary_generation');
    const limit = user.plan === 'free' ? 50 : user.plan === 'pro' ? 100 : 1000; // Increased free limit for testing

    // Temporarily disabled for testing
    // if (monthlyUsage >= limit) {
    //   return NextResponse.json(
    //     { 
    //       error: 'Rate limit exceeded',
    //       message: `You've reached your monthly limit of ${limit} summaries. Please upgrade your plan.`,
    //       current_usage: monthlyUsage,
    //       limit
    //     },
    //     { status: 429 }
    //   );
    // }

    // Get transcript from database
    const transcript = await transcriptDb.findById(transcript_id);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Verify transcript belongs to user
    if (transcript.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this transcript' },
        { status: 403 }
      );
    }

    // Check if transcript is ready
    if (transcript.status !== 'completed' || !transcript.extracted_text) {
      return NextResponse.json(
        { error: 'Transcript is not ready for summarization' },
        { status: 400 }
      );
    }

    // Create summary record in database
    const summaryTitle = title || `Summary of ${transcript.title}`;
    const summary = await summaryDb.create({
      transcript_id: transcript.id,
      user_id: user.id,
      title: summaryTitle,
      prompt: prompt || 'Default summary prompt',
    });

    console.log(`🚀 Starting summarization for user ${user.id}, transcript ${transcript.id}`);

    // Generate summary using AI service (async)
    const startTime = Date.now();
    
    try {
      const aiResult = await summarizeTranscript({
        transcript: transcript.extracted_text,
        customPrompt: prompt,
        maxTokens: 4000
      });

      const processingTime = Date.now() - startTime;

      // Update summary with results
      const completedSummary = await summaryDb.complete(
        summary.id,
        aiResult.summary,
        aiResult.model,
        aiResult.tokenCount,
        processingTime
      );

      // Track usage
      await usageDb.track(user.id, 'summary_generation');

      console.log(`✅ Summary completed for user ${user.id} in ${processingTime}ms using ${aiResult.model}`);

      return NextResponse.json({
        success: true,
        summary: {
          id: completedSummary.id,
          title: completedSummary.title,
          summary: completedSummary.summary,
          ai_model: completedSummary.ai_model,
          token_count: completedSummary.token_count,
          processing_time: completedSummary.processing_time,
          chunks: aiResult.chunks,
          created_at: completedSummary.created_at,
        },
        usage: {
          current_usage: monthlyUsage + 1,
          limit,
          remaining: limit - (monthlyUsage + 1)
        }
      });

    } catch (aiError) {
      console.error('❌ AI summarization failed:', aiError);
      
      // Mark summary as failed in database
      await summaryDb.markFailed(
        summary.id,
        aiError instanceof Error ? aiError.message : 'AI summarization failed'
      );

      return NextResponse.json(
        {
          error: 'Summarization failed',
          message: aiError instanceof Error ? aiError.message : 'Unknown AI error',
          summary_id: summary.id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in /api/summarize:', error);
    
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
 * GET /api/summarize - Get user's summaries
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

    // Get user's summaries
    const summaries = await summaryDb.findByUserId(user.id, limit);

    return NextResponse.json({
      success: true,
      summaries: summaries.map(summary => ({
        id: summary.id,
        title: summary.title,
        transcript_id: summary.transcript_id,
        summary: summary.summary,
        ai_model: summary.ai_model,
        token_count: summary.token_count,
        processing_time: summary.processing_time,
        status: summary.status,
        created_at: summary.created_at,
        // @ts-ignore - transcript_title comes from JOIN
        transcript_title: summary.transcript_title
      }))
    });

  } catch (error) {
    console.error('❌ Error getting summaries:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch summaries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
