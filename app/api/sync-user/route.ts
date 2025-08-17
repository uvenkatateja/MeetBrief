import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { userDb, transcriptDb, summaryDb } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Syncing user with test data...')
    
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        message: 'Please log in to sync your account'
      }, { status: 401 })
    }

    console.log('👤 Current Clerk User ID:', userId)
    console.log('📧 User Email:', user.emailAddresses[0]?.emailAddress)

    // Check if user exists in database
    let dbUser = await userDb.findByClerkId(userId)
    
    if (!dbUser) {
      console.log('🆕 Creating new user in database...')
      // Create user in database
      dbUser = await userDb.create({
        clerk_user_id: userId,
        email: user.emailAddresses[0]?.emailAddress || 'user@meetbrief.app',
        first_name: user.firstName || 'User',
        last_name: user.lastName || 'Demo',
        image_url: user.imageUrl
      })
      console.log('✅ User created with ID:', dbUser.id)
    } else {
      console.log('👤 User already exists with ID:', dbUser.id)
    }

    // Just return success - no automatic dummy data creation
    const existingSummaries = await summaryDb.findByUserId(dbUser.id, 5)
    
    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: dbUser.id,
        clerk_user_id: userId,
        email: dbUser.email,
        name: `${dbUser.first_name} ${dbUser.last_name}`
      },
      existing_summaries: existingSummaries.length
    })


  } catch (error) {
    console.error('❌ Sync user error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'User Sync API',
    instructions: 'POST to this endpoint to sync your current user with test summaries',
    status: 'ready'
  })
}
