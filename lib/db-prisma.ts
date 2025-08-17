import { prisma } from './prisma'
import type { 
  User, 
  Transcript, 
  Summary, 
  Send, 
  UserUsage, 
  Plan, 
  TranscriptStatus, 
  SummaryStatus, 
  SendStatus, 
  UsageType 
} from '@prisma/client'

// ===================================
// USER OPERATIONS
// ===================================
export const userService = {
  async create(data: {
    clerkUserId: string
    email: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        clerkUserId: data.clerkUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        imageUrl: data.imageUrl,
      },
    })
  },

  async findByClerkId(clerkUserId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { clerkUserId },
    })
  },

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    })
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    })
  },

  async delete(id: string): Promise<User> {
    return await prisma.user.delete({
      where: { id },
    })
  },
}

// ===================================
// TRANSCRIPT OPERATIONS
// ===================================
export const transcriptService = {
  async create(data: {
    userId: string
    title: string
    fileName: string
    fileUrl: string
    fileSize: bigint
    fileType: string
  }): Promise<Transcript> {
    return await prisma.transcript.create({
      data,
    })
  },

  async findById(id: string): Promise<Transcript | null> {
    return await prisma.transcript.findUnique({
      where: { id },
      include: {
        user: true,
        summaries: true,
      },
    })
  },

  async findByUserId(userId: string, limit = 50): Promise<Transcript[]> {
    return await prisma.transcript.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        summaries: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })
  },

  async update(id: string, data: Partial<Transcript>): Promise<Transcript> {
    return await prisma.transcript.update({
      where: { id },
      data,
    })
  },

  async updateText(
    id: string, 
    extractedText: string, 
    wordCount: number
  ): Promise<Transcript> {
    return await prisma.transcript.update({
      where: { id },
      data: {
        extractedText,
        wordCount,
        status: 'COMPLETED' as TranscriptStatus,
      },
    })
  },

  async markFailed(id: string, errorMessage: string): Promise<Transcript> {
    return await prisma.transcript.update({
      where: { id },
      data: {
        status: 'FAILED' as TranscriptStatus,
        errorMessage,
      },
    })
  },

  async delete(id: string): Promise<Transcript> {
    return await prisma.transcript.delete({
      where: { id },
    })
  },
}

// ===================================
// SUMMARY OPERATIONS
// ===================================
export const summaryService = {
  async create(data: {
    transcriptId: string
    userId: string
    title: string
    prompt: string
  }): Promise<Summary> {
    return await prisma.summary.create({
      data: {
        ...data,
        summary: '',
        aiModel: '',
      },
    })
  },

  async findById(id: string): Promise<Summary | null> {
    return await prisma.summary.findUnique({
      where: { id },
      include: {
        transcript: true,
        user: true,
        sends: true,
      },
    })
  },

  async findByTranscriptId(transcriptId: string): Promise<Summary[]> {
    return await prisma.summary.findMany({
      where: { transcriptId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async findByUserId(userId: string, limit = 50): Promise<Summary[]> {
    return await prisma.summary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        transcript: {
          select: {
            title: true,
            fileName: true,
          },
        },
      },
    })
  },

  async update(id: string, data: Partial<Summary>): Promise<Summary> {
    return await prisma.summary.update({
      where: { id },
      data,
    })
  },

  async complete(
    id: string,
    summary: string,
    aiModel: string,
    tokenCount: number,
    processingTime: number
  ): Promise<Summary> {
    return await prisma.summary.update({
      where: { id },
      data: {
        summary,
        aiModel,
        tokenCount,
        processingTime,
        status: 'COMPLETED' as SummaryStatus,
      },
    })
  },

  async markFailed(id: string, errorMessage: string): Promise<Summary> {
    return await prisma.summary.update({
      where: { id },
      data: {
        status: 'FAILED' as SummaryStatus,
        errorMessage,
      },
    })
  },

  async delete(id: string): Promise<Summary> {
    return await prisma.summary.delete({
      where: { id },
    })
  },
}

// ===================================
// SEND OPERATIONS
// ===================================
export const sendService = {
  async create(data: {
    summaryId: string
    userId: string
    recipients: string[]
    subject: string
  }): Promise<Send> {
    return await prisma.send.create({
      data: {
        ...data,
        recipients: data.recipients,
      },
    })
  },

  async findById(id: string): Promise<Send | null> {
    return await prisma.send.findUnique({
      where: { id },
      include: {
        summary: true,
        user: true,
      },
    })
  },

  async findByUserId(userId: string, limit = 50): Promise<Send[]> {
    return await prisma.send.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        summary: {
          select: {
            title: true,
          },
        },
      },
    })
  },

  async markSent(id: string, emailId: string): Promise<Send> {
    return await prisma.send.update({
      where: { id },
      data: {
        status: 'SENT' as SendStatus,
        emailId,
      },
    })
  },

  async markFailed(id: string, errorMessage: string): Promise<Send> {
    return await prisma.send.update({
      where: { id },
      data: {
        status: 'FAILED' as SendStatus,
        errorMessage,
      },
    })
  },

  async delete(id: string): Promise<Send> {
    return await prisma.send.delete({
      where: { id },
    })
  },
}

// ===================================
// USAGE TRACKING
// ===================================
export const usageService = {
  async track(
    userId: string, 
    usageType: UsageType, 
    count = 1
  ): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.userUsage.upsert({
      where: {
        idx_user_usage_unique: {
          userId,
          usageType,
          usageDate: today,
        },
      },
      update: {
        usageCount: {
          increment: count,
        },
      },
      create: {
        userId,
        usageType,
        usageCount: count,
        usageDate: today,
      },
    })
  },

  async getUsage(
    userId: string, 
    usageType: UsageType, 
    date?: Date
  ): Promise<number> {
    const targetDate = date || new Date()
    targetDate.setHours(0, 0, 0, 0)

    const usage = await prisma.userUsage.findUnique({
      where: {
        idx_user_usage_unique: {
          userId,
          usageType,
          usageDate: targetDate,
        },
      },
    })

    return usage?.usageCount || 0
  },

  async getMonthlyUsage(
    userId: string, 
    usageType: UsageType
  ): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usages = await prisma.userUsage.findMany({
      where: {
        userId,
        usageType,
        usageDate: {
          gte: startOfMonth,
        },
      },
    })

    return usages.reduce((total, usage) => total + usage.usageCount, 0)
  },
}

// ===================================
// DASHBOARD STATS
// ===================================
export const dashboardService = {
  async getUserStats(userId: string) {
    const [transcriptsCount, summariesCount, sendsCount, wordCount] = await Promise.all([
      // Total transcripts
      prisma.transcript.count({
        where: { 
          userId,
          status: 'COMPLETED',
        },
      }),
      
      // Total summaries
      prisma.summary.count({
        where: { 
          userId,
          status: 'COMPLETED',
        },
      }),
      
      // Total sends
      prisma.send.count({
        where: { 
          userId,
          status: 'SENT',
        },
      }),
      
      // Total word count
      prisma.transcript.aggregate({
        where: { 
          userId,
          status: 'COMPLETED',
        },
        _sum: {
          wordCount: true,
        },
      }),
    ])

    return {
      total_transcripts: transcriptsCount,
      total_summaries: summariesCount,
      total_sends: sendsCount,
      total_words_processed: wordCount._sum.wordCount || 0,
      last_transcript_upload: null, // Could add this later
      last_summary_generated: null, // Could add this later
    }
  },

  async getRecentActivity(userId: string, limit = 10) {
    const [transcripts, summaries] = await Promise.all([
      // Recent transcripts
      prisma.transcript.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          status: true,
        },
      }),
      
      // Recent summaries
      prisma.summary.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          status: true,
        },
      }),
    ])

    // Combine and sort by date
    const combined = [
      ...transcripts.map(t => ({
        ...t,
        activity_type: 'transcript' as const,
        item_id: t.id,
      })),
      ...summaries.map(s => ({
        ...s,
        activity_type: 'summary' as const,
        item_id: s.id,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)

    return combined
  },
}

// Export everything as default
export const db = {
  user: userService,
  transcript: transcriptService,
  summary: summaryService,
  send: sendService,
  usage: usageService,
  dashboard: dashboardService,
}

export default db
