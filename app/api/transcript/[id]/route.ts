import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { transcriptDb, userDb } from '@/lib/database';

/**
 * GET /api/transcript/:id - Get a specific transcript by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: transcriptId } = await params;

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
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

    // Get transcript and verify ownership
    const transcript = await transcriptDb.findById(transcriptId);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Verify user owns this transcript
    if (transcript.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this transcript' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript.id,
        title: transcript.title,
        file_name: transcript.file_name,
        file_url: transcript.file_url,
        file_size: transcript.file_size,
        file_type: transcript.file_type,
        extracted_text: transcript.extracted_text,
        word_count: transcript.word_count,
        status: transcript.status,
        error_message: transcript.error_message,
        created_at: transcript.created_at,
        updated_at: transcript.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/transcript/:id:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
