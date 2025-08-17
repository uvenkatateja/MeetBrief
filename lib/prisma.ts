import { PrismaClient } from '@prisma/client'

// Global type for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export Prisma types for type safety
export type { User, Transcript, Summary, Send, UserUsage, Plan, TranscriptStatus, SummaryStatus, SendStatus, UsageType } from '@prisma/client'

export default prisma
