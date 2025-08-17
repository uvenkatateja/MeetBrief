'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  Database, 
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface SyncResult {
  success: boolean
  message: string
  user?: {
    id: string
    clerk_user_id: string
    email: string
    name: string
  }
  summaries_created?: number
  existing_summaries?: number
}

export default function SyncPage() {
  const { user, isLoaded } = useUser()
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    setIsLoading(true)
    setError(null)
    setSyncResult(null)

    try {
      console.log('🔄 Starting user sync...')
      
      const response = await fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Sync successful:', data)
        setSyncResult(data)
      } else {
        console.error('❌ Sync failed:', data)
        setError(data.message || data.error || 'Sync failed')
      }
    } catch (err) {
      console.error('💥 Sync error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-sync on page load if user is signed in
  useEffect(() => {
    if (isLoaded && user && !syncResult && !isLoading) {
      // Automatically try to sync when page loads
      handleSync()
    }
  }, [isLoaded, user])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to sync your account with the database
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/sign-in">
              <Button className="w-full">
                Sign In to Continue
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Account Sync</h1>
          <p className="text-muted-foreground">
            Sync your Clerk account with the MeetBrief database
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{user.fullName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Clerk ID:</span>
                <span className="text-sm font-mono text-xs">{user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Sync
            </CardTitle>
            <CardDescription>
              Connect your account to the MeetBrief database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Syncing your account...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Sync Failed</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
                <Button 
                  onClick={handleSync} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Success State */}
            {syncResult && !isLoading && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Sync Successful!</span>
                </div>
                
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>Message:</strong> {syncResult.message}</p>
                  
                  {syncResult.user && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">Account Details:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Database ID: {syncResult.user.id}</li>
                        <li>• Email: {syncResult.user.email}</li>
                        <li>• Name: {syncResult.user.name}</li>
                      </ul>
                    </div>
                  )}

                  {(syncResult.summaries_created || syncResult.existing_summaries) && (
                    <div className="mt-3 flex gap-2">
                      {syncResult.summaries_created > 0 && (
                        <Badge variant="default">
                          <FileText className="h-3 w-3 mr-1" />
                          {syncResult.summaries_created} New Summaries
                        </Badge>
                      )}
                      {syncResult.existing_summaries > 0 && (
                        <Badge variant="secondary">
                          {syncResult.existing_summaries} Existing Summaries
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Link href="/dashboard/summaries">
                    <Button size="sm">
                      View Summaries
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Initial State - No sync attempted yet */}
            {!syncResult && !isLoading && !error && (
              <div className="text-center py-6">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to sync your account and create test summaries
                </p>
                <Button onClick={handleSync}>
                  Sync Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What does this do?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Creates your user account in the MeetBrief database</p>
            <p>• Generates demo meeting summaries for testing</p>
            <p>• Enables access to all application features</p>
            <p>• Fixes the "No summaries found" issue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
