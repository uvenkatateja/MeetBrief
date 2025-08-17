'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Brain, 
  Clock, 
  BarChart3,
  TrendingUp,
  Upload,
  Plus,
  ArrowRight,
  Loader2
} from "lucide-react"
import { toast } from 'sonner'

interface DashboardStats {
  totalMeetings: number
  readyMeetings: number
  processingMeetings: number
  totalWords: number
  avgProcessingTime: number
}

interface RecentActivity {
  id: string
  title: string
  status: 'completed' | 'processing' | 'error'
  createdAt: string
  type: 'summary' | 'upload'
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      // Auto-sync user first, then fetch dashboard data
      autoSyncUser().then(() => {
        fetchDashboardData()
      })
    }
  }, [isLoaded, user])

  // Automatically sync user when they log in (no webhooks needed)
  const autoSyncUser = async () => {
    try {
      const response = await fetch('/api/sync-user', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        console.log('✅ User auto-synced:', result.message)
      }
    } catch (error) {
      console.log('ℹ️ User sync skipped:', error)
      // Don't show error to user, just log it
    }
  }

  const fetchDashboardData = async () => {
    try {
      // Try to fetch dashboard stats, but don't fail if it doesn't work
      try {
        const statsResponse = await fetch('/api/dashboard/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          throw new Error('Stats API failed')
        }
      } catch (statsError) {
        console.log('Stats API not available, using defaults')
        // Always provide fallback stats
        setStats({
          totalMeetings: 0,
          readyMeetings: 0,
          processingMeetings: 0,
          totalWords: 0,
          avgProcessingTime: 0
        })
      }

      // Try to fetch recent activity, but don't fail if it doesn't work
      try {
        const activityResponse = await fetch('/api/dashboard/recent-activity')
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setRecentActivity(activityData)
        }
      } catch (activityError) {
        console.log('Recent activity API not available')
        // Activity is optional, so we don't need to set anything
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      // Always provide fallback data so the page doesn't break
      setStats({
        totalMeetings: 0,
        readyMeetings: 0,
        processingMeetings: 0,
        totalWords: 0,
        avgProcessingTime: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Welcome to MeetBrief</h1>
          <p className="text-muted-foreground mb-6">
            Failed to load dashboard data. Please refresh the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to MeetBrief</h1>
        <p className="text-muted-foreground mt-2">
          Transform your meeting recordings into actionable insights with AI-powered summaries
        </p>
        
        {/* Sync Account Notice */}
        {stats && stats.totalMeetings === 0 && stats.readyMeetings === 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Get Started with Test Summaries
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  No summaries found? Sync your account to create demo summaries and test all features.
                </p>
                <Link href="/sync">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Sync Account & Create Test Data
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Summaries</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyMeetings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.processingMeetings} processing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Words Processed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all meetings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Process Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{stats.avgProcessingTime}min</div>
            <p className="text-xs text-muted-foreground">
              Per transcript
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Upload New Meeting</CardTitle>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Upload audio files, videos, or text transcripts to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/upload">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Start Upload
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">View Summaries</CardTitle>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Browse and manage your existing meeting summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/summaries">
              <Button variant="outline" className="w-full">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Analytics</CardTitle>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Track your meeting insights and usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Activity</CardTitle>
          <CardDescription>
            Your latest meetings and summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="font-medium">Weekly Team Standup</p>
                <p className="text-sm text-muted-foreground">Summary completed • 2 hours ago</p>
              </div>
              <Button size="sm" variant="ghost">View</Button>
            </div>
            
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <div className="flex-1">
                <p className="font-medium">Client Strategy Meeting</p>
                <p className="text-sm text-muted-foreground">Processing • 5 minutes ago</p>
              </div>
              <Button size="sm" variant="ghost">View</Button>
            </div>
            
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="font-medium">Product Planning Session</p>
                <p className="text-sm text-muted-foreground">Summary completed • 1 day ago</p>
              </div>
              <Button size="sm" variant="ghost">View</Button>
            </div>
          </div>
          
          <div className="mt-6">
            <Link href="/dashboard/summaries">
              <Button variant="outline" className="w-full">
                View All Meetings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
