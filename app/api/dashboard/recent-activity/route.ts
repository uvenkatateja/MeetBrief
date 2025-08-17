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
    const user = await userDb.findByClerkId(userId)
    
    if (!user) {
      return NextResponse.json([]) // Return empty array if user doesn't exist yet
    }

    // Get recent activity using dashboard service
    const recentActivity = await dashboardDb.getRecentActivity(user.id, 10)

    return NextResponse.json(recentActivity)
  } catch (error) {
    console.error('Recent activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
