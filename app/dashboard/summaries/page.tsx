'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Search,
  Share,
  Download,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Clock,
  Loader2,
  Eye,
  Brain,
  MoreHorizontal,
  Mail,
  Send,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Summary {
  id: string
  transcript_id: string
  title: string
  summary: string
  prompt: string
  created_at: string
  filename?: string
  word_count?: number
}

function SummariesPageContent() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [filteredSummaries, setFilteredSummaries] = useState<Summary[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null)
  
  // Email sharing state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailSummary, setEmailSummary] = useState<Summary | null>(null)
  const [emailRecipients, setEmailRecipients] = useState<string[]>([''])
  const [emailSubject, setEmailSubject] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      // Auto-sync user first, then fetch summaries
      autoSyncUser().then(() => {
        fetchSummaries()
      })
    }
  }, [isLoaded, user])

  // Automatically sync user when they visit summaries (no webhooks needed)
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

  useEffect(() => {
    // Filter summaries based on search term
    const filtered = summaries.filter(summary =>
      summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (summary.filename && summary.filename.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredSummaries(filtered)
  }, [summaries, searchTerm])

  const fetchSummaries = async () => {
    try {
      const response = await fetch('/api/summaries')
      if (response.ok) {
        const data = await response.json()
        setSummaries(data)
        
        // Highlight specific summary if requested
        if (highlightId) {
          const highlighted = data.find((s: Summary) => s.id === highlightId)
          if (highlighted) {
            setSelectedSummary(highlighted)
          }
        }
      } else {
        toast.error('Failed to load summaries')
      }
    } catch (error) {
      console.error('Failed to fetch summaries:', error)
      toast.error('Failed to load summaries')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (summaryId: string) => {
    const summary = summaries.find(s => s.id === summaryId)
    const summaryName = summary?.title || 'this summary'
    
    if (!confirm(`Are you sure you want to delete "${summaryName}"?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/summary/${summaryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSummaries(prev => prev.filter(s => s.id !== summaryId))
        toast.success(`"${summaryName}" deleted successfully`)
        
        if (selectedSummary?.id === summaryId) {
          setSelectedSummary(null)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to delete summary')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete summary. Please try again.')
    }
  }

  const handleShare = (summary: Summary) => {
    setEmailSummary(summary)
    setEmailSubject(`Meeting Summary: ${summary.title}`)
    setEmailRecipients([''])
    setIsEmailDialogOpen(true)
  }
  
  const addEmailRecipient = () => {
    setEmailRecipients([...emailRecipients, ''])
  }

  const removeEmailRecipient = (index: number) => {
    if (emailRecipients.length > 1) {
      setEmailRecipients(emailRecipients.filter((_, i) => i !== index))
    }
  }

  const updateEmailRecipient = (index: number, value: string) => {
    const newRecipients = [...emailRecipients]
    newRecipients[index] = value
    setEmailRecipients(newRecipients)
  }

  const handleSendEmail = async () => {
    if (!emailSummary) return
    
    const validEmails = emailRecipients.filter(email => email.trim())
    
    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email.trim()))
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/share-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary_id: emailSummary.id,
          recipients: validEmails.map(email => email.trim()),
          subject: emailSubject.trim() || `Meeting Summary: ${emailSummary.title}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send email')
      }

      const result = await response.json()
      toast.success(`Summary shared successfully with ${validEmails.length} recipient(s)`)
      setIsEmailDialogOpen(false)
      setEmailRecipients([''])
      
    } catch (error) {
      console.error('Email sharing error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleDownload = async (summary: Summary) => {
    // Create and download a text file
    const content = `Meeting Summary: ${summary.title}\n\nGenerated: ${new Date(summary.created_at).toLocaleDateString()}\n\nPrompt: ${summary.prompt}\n\n--- Summary ---\n\n${summary.summary}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Summary downloaded')
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substr(0, maxLength) + '...'
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading summaries...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meeting Summaries</h1>
          <p className="text-muted-foreground mt-2">
            View, edit, and manage your AI-generated meeting summaries
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Upload
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search by title, content, or filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {filteredSummaries.length} summaries
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summaries Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Summaries List */}
        <div className="space-y-4">
          {filteredSummaries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No summaries found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload your first meeting to get started'}
                </p>
                <Link href="/dashboard/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Meeting
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredSummaries.map((summary) => (
              <Card 
                key={summary.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSummary?.id === summary.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSummary(summary)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {summary.title || summary.filename || 'Untitled Meeting'}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(summary.created_at)}
                        </div>
                        {summary.word_count && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {summary.word_count} words
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSummary(summary)
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to summarize page with transcript_id for editing
                          window.location.href = `/dashboard/summarize?transcript_id=${summary.transcript_id}&edit_summary=${summary.id}`
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleShare(summary)
                        }}>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(summary)
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(summary.id)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {truncateText(summary.summary, 150)}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Detail View */}
        <div className="lg:sticky lg:top-4">
          {selectedSummary ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedSummary.title || selectedSummary.filename || 'Untitled Meeting'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(selectedSummary.created_at)}
                      </span>
                      {selectedSummary.word_count && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {selectedSummary.word_count} words
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Used */}
                {selectedSummary.prompt && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Summary Instructions</h4>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      {selectedSummary.prompt}
                    </div>
                  </div>
                )}

                {/* Summary Content */}
                <div>
                  <h4 className="font-medium text-sm mb-2">AI Summary</h4>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedSummary.summary}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => handleShare(selectedSummary)}
                    variant="outline"
                    size="sm"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    onClick={() => handleDownload(selectedSummary)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    onClick={() => handleDelete(selectedSummary.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Summary</h3>
                <p className="text-muted-foreground">
                  Click on any summary from the list to view its details here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Email Sharing Dialog */}
      <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Share Summary via Email</AlertDialogTitle>
            <AlertDialogDescription>
              Send this summary to team members or stakeholders via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>
            
            {/* Recipients */}
            <div>
              <Label>Recipients</Label>
              <div className="space-y-2 mt-1">
                {emailRecipients.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={email}
                      onChange={(e) => updateEmailRecipient(index, e.target.value)}
                      placeholder="Enter email address"
                      type="email"
                    />
                    {emailRecipients.length > 1 && (
                      <Button
                        onClick={() => removeEmailRecipient(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={addEmailRecipient}
                  variant="outline"
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
            </div>
            
            {/* Preview */}
            {emailSummary && (
              <div>
                <Label>Summary Preview</Label>
                <div className="mt-1 p-3 border rounded-md bg-muted/50 max-h-32 overflow-y-auto text-sm">
                  {emailSummary.summary.length > 200 
                    ? `${emailSummary.summary.substring(0, 200)}...` 
                    : emailSummary.summary
                  }
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SummariesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading summaries...</span>
      </div>
    }>
      <SummariesPageContent />
    </Suspense>
  )
}
