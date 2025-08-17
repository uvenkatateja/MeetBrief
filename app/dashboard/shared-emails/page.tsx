'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

interface SharedEmail {
  id: string
  summary_id: string
  summary_title: string
  recipients: string[]
  subject: string
  status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  created_at: string
  email_id: string | null
}

export default function SharedEmailsPage() {
  const { user, isLoaded } = useUser()
  const [emails, setEmails] = useState<SharedEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchSharedEmails()
    }
  }, [isLoaded, user])

  const fetchSharedEmails = async () => {
    try {
      const response = await fetch('/api/share-summary?limit=100')
      if (response.ok) {
        const data = await response.json()
        setEmails(data.sends || [])
      } else {
        toast.error('Failed to load shared emails')
      }
    } catch (error) {
      console.error('Failed to fetch shared emails:', error)
      toast.error('Failed to load shared emails')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading shared emails...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shared Emails</h1>
          <p className="text-muted-foreground mt-2">
            View all summaries you've shared via email
          </p>
        </div>
        <Button onClick={fetchSharedEmails} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shared</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emails.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successfully Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {emails.filter(e => e.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {emails.filter(e => e.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.reduce((total, email) => total + email.recipients.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email History */}
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>
            All summaries shared via email with delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No emails shared yet</h3>
              <p className="text-muted-foreground">
                Start sharing summaries via email to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(email.status)}
                        <h4 className="font-medium">{email.subject}</h4>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(email.status)}`}>
                          {email.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        Summary: <span className="font-medium text-foreground">{email.summary_title}</span>
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {email.recipients.length} recipient{email.recipients.length > 1 ? 's' : ''}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Shared: {formatDate(email.created_at)}
                        </div>
                        
                        {email.sent_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Delivered: {formatDate(email.sent_at)}
                          </div>
                        )}
                        
                        {email.email_id && email.email_id !== 'unknown' && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            ID: {email.email_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                      
                      {/* Recipients */}
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">Recipients:</div>
                        <div className="flex flex-wrap gap-1">
                          {email.recipients.map((recipient, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {recipient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
