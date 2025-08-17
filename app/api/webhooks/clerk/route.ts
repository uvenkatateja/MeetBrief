import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { userDb } from '@/lib/database'

export async function POST(req: NextRequest) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook -> Signing Secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.warn('⚠️ CLERK_WEBHOOK_SECRET not configured. Proceeding without webhook verification for development.')
    // In development, we can proceed without strict verification
    const payload = await req.json()
    return await handleWebhookPayload(payload)
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type
  
  console.log('🔔 Clerk Webhook received:', eventType)

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    
    console.log('👤 Processing user:', {
      id,
      email: email_addresses[0]?.email_address,
      name: `${first_name} ${last_name}`
    })

    try {
      if (eventType === 'user.created') {
        // Create new user in database
        const user = await userDb.create({
          clerk_user_id: id,
          email: email_addresses[0]?.email_address || 'unknown@example.com',
          first_name: first_name || null,
          last_name: last_name || null,
          image_url: image_url || null
        })
        
        console.log('✅ User created in database:', user.id)
        
        // Optionally, create welcome/demo summaries for new users
        await createWelcomeSummaries(user.id)
        
      } else if (eventType === 'user.updated') {
        // Update existing user
        const existingUser = await userDb.findByClerkId(id)
        if (existingUser) {
          await userDb.update(existingUser.id, {
            email: email_addresses[0]?.email_address || existingUser.email,
            first_name: first_name || existingUser.first_name,
            last_name: last_name || existingUser.last_name,
            image_url: image_url || existingUser.image_url
          })
          console.log('✅ User updated in database')
        }
      }
    } catch (error) {
      console.error('❌ Database error:', error)
      // Don't return error response, as this might cause Clerk to retry
      // Just log the error and continue
    }
  }

  return new Response('Webhook processed successfully', { status: 200 })
}

// Handle webhook payload without verification (for development)
async function handleWebhookPayload(evt: any) {
  const eventType = evt.type
  
  console.log('🔔 Clerk Webhook received (unverified):', eventType)

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    
    console.log('👤 Processing user:', {
      id,
      email: email_addresses[0]?.email_address,
      name: `${first_name} ${last_name}`
    })

    try {
      if (eventType === 'user.created') {
        // Create new user in database
        const user = await userDb.create({
          clerk_user_id: id,
          email: email_addresses[0]?.email_address || 'unknown@example.com',
          first_name: first_name || null,
          last_name: last_name || null,
          image_url: image_url || null
        })
        
        console.log('✅ User created in database:', user.id)
        
        // Optionally, create welcome/demo summaries for new users
        await createWelcomeSummaries(user.id)
        
      } else if (eventType === 'user.updated') {
        // Update existing user
        const existingUser = await userDb.findByClerkId(id)
        if (existingUser) {
          await userDb.update(existingUser.id, {
            email: email_addresses[0]?.email_address || existingUser.email,
            first_name: first_name || existingUser.first_name,
            last_name: last_name || existingUser.last_name,
            image_url: image_url || existingUser.image_url
          })
          console.log('✅ User updated in database')
        }
      }
    } catch (error) {
      console.error('❌ Database error:', error)
      // Don't return error response, as this might cause Clerk to retry
      // Just log the error and continue
    }
  }

  return new Response('Webhook processed successfully', { status: 200 })
}

// Create welcome summaries for new users
async function createWelcomeSummaries(userId: string) {
  try {
    const { transcriptDb, summaryDb } = require('@/lib/database')
    
    console.log('🎉 Creating welcome summaries for new user:', userId)
    
    // Create a welcome transcript
    const transcript = await transcriptDb.create({
      user_id: userId,
      title: 'Welcome to MeetBrief - Demo Meeting',
      file_name: 'welcome-demo.txt',
      file_url: 'https://meetbrief.app/demo/welcome.txt',
      file_size: 1500,
      file_type: 'txt'
    })

    await transcriptDb.updateText(
      transcript.id,
      `Welcome to MeetBrief Demo Meeting

Participants: Sarah (Team Lead), Alex (Developer), Jordan (Designer)

Sarah: Welcome to MeetBrief! This is a demo meeting to show you how our AI summarization works.

Alex: Great to see the new team member! I've been working on improving our API response times. We've achieved a 40% performance boost this quarter.

Jordan: From the design perspective, user engagement has increased by 25% since we implemented the new dashboard interface. The feedback has been overwhelmingly positive.

Sarah: Excellent progress from both teams. For the upcoming sprint, let's focus on:
1. Finalizing the mobile app features
2. Implementing the new notification system
3. Preparing for the client demo next week

Alex: I'll handle the mobile app backend integration. Should be ready by Thursday.

Jordan: I'll finish the notification UI designs and coordinate with Alex for the frontend implementation.

Sarah: Perfect! Any blockers or questions?

Alex: Just need clarification on the push notification frequency settings.

Sarah: Let's default to smart notifications - not too frequent, but timely for important updates.

Jordan: Sounds good. No other questions from my side.

Sarah: Great meeting everyone! Let's reconvene next Tuesday to review progress.

Meeting concluded at 2:45 PM.`,
      75
    )

    // Create welcome summaries
    const summaryData = [
      {
        title: 'Welcome Demo - Team Meeting Summary',
        prompt: 'Provide a comprehensive summary of this welcome meeting, highlighting key achievements and upcoming tasks.',
        summary: `# Welcome to MeetBrief! 🎉

## Meeting Overview
- **Purpose**: Welcome demo and team update
- **Attendees**: Sarah (Team Lead), Alex (Developer), Jordan (Designer)
- **Duration**: 45 minutes

## Key Achievements This Quarter 🏆

### 🚀 **Performance Improvements**
- **API Speed**: 40% performance boost achieved
- **User Engagement**: 25% increase since new dashboard
- **User Feedback**: Overwhelmingly positive responses

### 🎨 **Design Success**
- New dashboard interface implemented successfully
- Improved user experience metrics
- Positive user adoption rates

## Upcoming Sprint Goals 🎯

### Priority Tasks
1. **Mobile App Features** (Alex) - Due Thursday
   - Backend integration
   - Performance optimization
   - Cross-platform compatibility

2. **Notification System** (Jordan + Alex)
   - UI design completion
   - Frontend implementation
   - Smart notification settings

3. **Client Demo Preparation**
   - Feature showcase preparation
   - Demo environment setup
   - Presentation materials

## Key Decisions Made 📋
- **Notification Frequency**: Smart notifications (balanced, not overwhelming)
- **Mobile Priority**: Focus on core features first
- **Team Coordination**: Weekly Tuesday check-ins

## Next Steps
- **Next Meeting**: Tuesday for progress review
- **Immediate Actions**: Mobile backend + notification UI
- **Milestone**: Client demo next week

---
*Welcome to MeetBrief! This summary demonstrates how our AI transforms your meetings into actionable insights.*`,
        ai_model: 'llama-3.3-70b-versatile'
      }
    ]

    for (const summaryInfo of summaryData) {
      const summary = await summaryDb.create({
        transcript_id: transcript.id,
        user_id: userId,
        title: summaryInfo.title,
        prompt: summaryInfo.prompt
      })

      await summaryDb.complete(
        summary.id,
        summaryInfo.summary,
        summaryInfo.ai_model,
        summaryInfo.summary.length,
        1800
      )

      console.log(`✅ Created welcome summary: ${summaryInfo.title}`)
    }

    console.log('🎊 Welcome summaries created successfully!')
    
  } catch (error) {
    console.error('❌ Failed to create welcome summaries:', error)
    // Don't throw - this shouldn't break the webhook
  }
}
