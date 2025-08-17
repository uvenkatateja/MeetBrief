import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { transcriptDb, userDb } from '@/lib/database'

// GET /api/transcripts/search?fileName=...
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
    }

    const user = await userDb.findByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const transcript = await transcriptDb.findRecentByFileName(user.id, fileName)
    if (!transcript) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      transcript: {
        id: transcript.id,
        title: transcript.title,
        status: transcript.status,
        word_count: transcript.word_count,
        created_at: transcript.created_at,
      }
    })
  } catch (error) {
    console.error('transcripts/search error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
