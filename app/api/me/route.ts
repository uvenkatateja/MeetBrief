import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/database';

/**
 * GET /api/me - Get current user information
 * Protected route that returns user data from database
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get detailed user info from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user exists in our database
    let dbUser = await userDb.findByClerkId(userId);

    // If user doesn't exist in our DB, create them
    if (!dbUser) {
      console.log('Creating new user in database:', userId);
      
      dbUser = await userDb.create({
        clerk_user_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        image_url: clerkUser.imageUrl || '',
      });
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        clerk_user_id: dbUser.clerk_user_id,
        email: dbUser.email,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        image_url: dbUser.image_url,
        plan: dbUser.plan,
        created_at: dbUser.created_at,
      }
    });

  } catch (error) {
    console.error('Error in /api/me:', error);
    
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
 * PUT /api/me - Update user information
 * Protected route to update user profile
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { first_name, last_name } = body;

    // Find user in database
    const dbUser = await userDb.findByClerkId(userId);
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await userDb.update(dbUser.id, {
      first_name,
      last_name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        clerk_user_id: updatedUser.clerk_user_id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        image_url: updatedUser.image_url,
        plan: updatedUser.plan,
        created_at: updatedUser.created_at,
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
