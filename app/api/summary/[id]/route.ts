import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { summaryDb, userDb } from '@/lib/database';

/**
 * GET /api/summary/:id - Get a specific summary by ID
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

    const { id: summaryId } = await params;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
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
    const summary = await summaryDb.findById(summaryId);
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    // Verify user owns this summary
    if (summary.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this summary' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: {
        id: summary.id,
        title: summary.title,
        summary: summary.summary,
        prompt: summary.prompt,
        ai_model: summary.ai_model,
        token_count: summary.token_count,
        processing_time: summary.processing_time,
        status: summary.status,
        transcript_id: summary.transcript_id,
        created_at: summary.created_at,
        updated_at: summary.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/summary/:id:', error);
    
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
 * PUT /api/summary/:id - Update a summary
 * 
 * Body: {
 *   title?: string,
 *   summary?: string
 * }
 */
export async function PUT(
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

    const { id: summaryId } = await params;
    const body = await req.json();
    const { title, summary: summaryContent } = body;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    if (!title && !summaryContent) {
      return NextResponse.json(
        { error: 'At least one field (title or summary) is required' },
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
    const existingSummary = await summaryDb.findById(summaryId);
    
    if (!existingSummary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    // Verify user owns this summary
    if (existingSummary.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this summary' },
        { status: 403 }
      );
    }

    // Update summary
    const updates: any = {};
    if (title) updates.title = title;
    if (summaryContent) updates.summary = summaryContent;

    const updatedSummary = await summaryDb.update(summaryId, updates);

    console.log(`✅ Summary updated: ${summaryId}`);

    return NextResponse.json({
      success: true,
      message: 'Summary updated successfully',
      summary: {
        id: updatedSummary.id,
        title: updatedSummary.title,
        summary: updatedSummary.summary,
        updated_at: updatedSummary.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating summary:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/summary/:id - Delete a summary
 */
export async function DELETE(
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

    const { id: summaryId } = await params;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
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
    const existingSummary = await summaryDb.findById(summaryId);
    
    if (!existingSummary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    // Verify user owns this summary
    if (existingSummary.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this summary' },
        { status: 403 }
      );
    }

    // Delete summary from database
    await summaryDb.delete(summaryId);

    console.log(`✅ Summary deleted: ${summaryId}`);

    return NextResponse.json({
      success: true,
      message: 'Summary deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting summary:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to delete summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
