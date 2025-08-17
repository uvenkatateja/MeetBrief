'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  Brain,
  Users,
  Calendar,
  Activity,
  Download,
  Filter
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

// Mock data for charts
const monthlyUsageData = [
  { month: 'Jan', meetings: 12, summaries: 10, words: 15420 },
  { month: 'Feb', meetings: 18, summaries: 16, words: 22380 },
  { month: 'Mar', meetings: 25, summaries: 23, words: 31250 },
  { month: 'Apr', meetings: 22, summaries: 20, words: 28900 },
  { month: 'May', meetings: 30, summaries: 28, words: 38500 },
  { month: 'Jun', meetings: 35, summaries: 33, words: 42150 }
]

const weeklyActivityData = [
  { day: 'Mon', uploads: 5, summaries: 4 },
  { day: 'Tue', uploads: 8, summaries: 7 },
  { day: 'Wed', uploads: 12, summaries: 11 },
  { day: 'Thu', uploads: 6, summaries: 5 },
  { day: 'Fri', uploads: 10, summaries: 9 },
  { day: 'Sat', uploads: 3, summaries: 3 },
  { day: 'Sun', uploads: 2, summaries: 2 }
]

const processingTimeData = [
  { timeRange: '0-1 min', count: 45 },
  { timeRange: '1-2 min', count: 32 },
  { timeRange: '2-3 min', count: 18 },
  { timeRange: '3-4 min', count: 12 },
  { timeRange: '4-5 min', count: 8 },
  { timeRange: '5+ min', count: 5 }
]

const meetingTypesData = [
  { name: 'Team Standup', value: 35, color: '#0088FE' },
  { name: 'Client Meeting', value: 25, color: '#00C49F' },
  { name: 'Project Review', value: 20, color: '#FFBB28' },
  { name: 'Planning', value: 12, color: '#FF8042' },
  { name: 'Other', value: 8, color: '#8884D8' }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

interface AnalyticsStats {
  totalMeetings: number
  totalSummaries: number
  totalWords: number
  avgProcessingTime: number
  successRate: number
  thisMonthMeetings: number
  lastMonthMeetings: number
  thisMonthWords: number
  lastMonthWords: number
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [stats, setStats] = useState<AnalyticsStats>({
    totalMeetings: 147,
    totalSummaries: 135,
    totalWords: 245780,
    avgProcessingTime: 2.3,
    successRate: 91.8,
    thisMonthMeetings: 35,
    lastMonthMeetings: 30,
    thisMonthWords: 42150,
    lastMonthWords: 38500
  })

  useEffect(() => {
    if (isLoaded && user) {
      fetchAnalytics()
    }
  }, [isLoaded, user, timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100)
  }

  const meetingsGrowth = calculateGrowth(stats.thisMonthMeetings, stats.lastMonthMeetings)
  const wordsGrowth = calculateGrowth(stats.thisMonthWords, stats.lastMonthWords)

  const exportReport = () => {
    // Create a simple CSV report
    const reportData = [
      ['Analytics Report - MeetBrief'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Summary Statistics'],
      ['Total Meetings', stats.totalMeetings.toString()],
      ['Total Summaries', stats.totalSummaries.toString()],
      ['Total Words Processed', stats.totalWords.toLocaleString()],
      ['Average Processing Time', `${stats.avgProcessingTime} minutes`],
      ['Success Rate', `${stats.successRate}%`],
      [''],
      ['Growth Metrics'],
      ['Monthly Meetings Growth', `${meetingsGrowth.toFixed(1)}%`],
      ['Monthly Words Growth', `${wordsGrowth.toFixed(1)}%`]
    ]

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meetbrief-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-2">
            Track your meeting analysis usage and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {meetingsGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              <span className={meetingsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(meetingsGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                <div 
                  className="bg-green-600 h-1.5 rounded-full" 
                  style={{ width: `${stats.successRate}%` }}
                ></div>
              </div>
              {stats.totalSummaries}/{stats.totalMeetings} successful
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Words Processed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {wordsGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              <span className={wordsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(wordsGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}min</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Fast
              </Badge>
              <span className="ml-2">per summary</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>
              Monthly meetings and summaries over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="meetings" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Meetings"
                />
                <Line 
                  type="monotone" 
                  dataKey="summaries" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Summaries"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              Uploads and summaries by day of week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uploads" fill="#8884d8" name="Uploads" />
                <Bar dataKey="summaries" fill="#82ca9d" name="Summaries" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processing Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Time Distribution</CardTitle>
            <CardDescription>
              How long it takes to generate summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processingTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeRange" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Meeting Types */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Types</CardTitle>
            <CardDescription>
              Distribution of meeting categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={meetingTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {meetingTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Words Processed Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Words Processed Over Time</CardTitle>
          <CardDescription>
            Total volume of text processed monthly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Words']} />
              <Area 
                type="monotone" 
                dataKey="words" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <div className="font-medium">Peak Usage Days</div>
                <div className="text-sm text-muted-foreground">
                  Wednesday shows highest meeting activity with 12 uploads
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <div className="font-medium">Fast Processing</div>
                <div className="text-sm text-muted-foreground">
                  75% of summaries are generated in under 2 minutes
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div>
                <div className="font-medium">Growing Usage</div>
                <div className="text-sm text-muted-foreground">
                  {meetingsGrowth > 0 ? 'Steady growth' : 'Usage stabilizing'} in monthly meetings
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
              <div>
                <div className="font-medium">Optimize Upload Schedule</div>
                <div className="text-sm text-muted-foreground">
                  Consider batch uploads on lower-activity days (weekends)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <div className="font-medium">Template Usage</div>
                <div className="text-sm text-muted-foreground">
                  Create custom templates for your most common meeting types
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <div className="font-medium">Share Summaries</div>
                <div className="text-sm text-muted-foreground">
                  Increase team adoption by sharing summaries directly from the app
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
