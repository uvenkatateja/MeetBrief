import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { userDb, summaryDb } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    console.log('🔍 Debug User Info - Clerk User ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'No user logged in',
        debug: {
          authenticated: false,
          clerk_user_id: null
        }
      }, { status: 401 })
    }

    // Get user from database
    const dbUser = await userDb.findByClerkId(userId)
    console.log('👤 Database User:', dbUser)
    
    // Get summaries for this user
    let summaries = []
    let summaryCount = 0
    
    if (dbUser) {
      summaries = await summaryDb.findByUserId(dbUser.id, 10)
      summaryCount = summaries.length
      console.log(`📝 Summaries found: ${summaryCount}`)
    }

    // Get all users in database (for debugging)
    const allUsersResult = await userDb.findByClerkId('debug_all_users')
    
    // Let's get database stats
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    const client = await pool.connect()
    
    try {
      const allUsers = await client.query('SELECT clerk_user_id, email, first_name, created_at FROM users ORDER BY created_at DESC')
      const totalSummaries = await client.query('SELECT COUNT(*) as count FROM summaries')
      const userSummaries = dbUser ? 
        await client.query('SELECT COUNT(*) as count FROM summaries WHERE user_id = $1', [dbUser.id]) : 
        { rows: [{ count: 0 }] }
      
      const debugInfo = {
        authenticated: true,
        clerk_user_id: userId,
        database_user: dbUser,
        user_exists_in_db: !!dbUser,
        summaries_for_user: userSummaries.rows[0].count,
        total_summaries_in_db: totalSummaries.rows[0].count,
        all_users_in_db: allUsers.rows,
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 Debug Info:', JSON.stringify(debugInfo, null, 2))
      
      return NextResponse.json({
        success: true,
        debug: debugInfo,
        recommendations: [
          summaryCount === 0 && totalSummaries.rows[0].count > 0 ? 
            'Summaries exist in database but not for your user - user ID mismatch' : 
            null,
          !dbUser ? 
            'User not found in database - need to create user entry' : 
            null,
          totalSummaries.rows[0].count === 0 ? 
            'No summaries in database at all - need to create test data' : 
            null
        ].filter(Boolean)
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Debug user error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          authenticated: false,
          error_details: String(error)
        }
      },
      { status: 500 }
    )
  }
}
