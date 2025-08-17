import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { dashboardDb, userDb } from '@/lib/database'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    let user = await userDb.findByClerkId(userId)
    
    if (!user) {
      // Return empty stats for new users
      return NextResponse.json({
        totalMeetings: 0,
        readyMeetings: 0,
        processingMeetings: 0,
        totalWords: 0,
        avgProcessingTime: 0
      })
    }

    // Get dashboard statistics using our dashboard service
    const stats = await dashboardDb.getUserStats(user.id)
    
    // Transform to expected format
    const dashboardStats = {
      totalMeetings: stats.total_transcripts || 0,
      readyMeetings: stats.total_summaries || 0,
      processingMeetings: Math.max(0, (stats.total_transcripts || 0) - (stats.total_summaries || 0)),
      totalWords: stats.total_words_processed || 0,
      avgProcessingTime: 2 // Static for now, could be calculated from processing_time in summaries
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
