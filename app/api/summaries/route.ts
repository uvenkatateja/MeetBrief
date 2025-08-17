import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { summaryDb, userDb } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user from database
    const user = await userDb.findByClerkId(userId)
    
    if (!user) {
      return NextResponse.json([]) // Return empty array if user doesn't exist yet
    }

    // Get all summaries for the user
    const summaries = await summaryDb.findByUserId(user.id, limit)

    // Return summaries in the format expected by the frontend
    const formattedSummaries = summaries.map(summary => ({
      id: summary.id,
      title: summary.title,
      transcript_id: summary.transcript_id,
      summary: summary.summary,
      prompt: summary.prompt,
      ai_model: summary.ai_model,
      token_count: summary.token_count,
      processing_time: summary.processing_time,
      status: summary.status,
      created_at: summary.created_at,
      // @ts-ignore - transcript_title comes from JOIN in database
      filename: summary.transcript_title || 'Unknown File',
      word_count: summary.token_count // Approximate
    }));

    return NextResponse.json(formattedSummaries)
  } catch (error) {
    console.error('Get summaries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    )
  }
}
