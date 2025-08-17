'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { 
  Edit, 
  Save, 
  X, 
  Mail, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  Brain,
  User,
  Send,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Summary {
  id: string
  title: string
  summary: string
  prompt: string
  ai_model: string
  token_count: number
  processing_time: number
  created_at: string
  transcript_id: string
}

interface SummaryEditorProps {
  summary: Summary
  onSummaryUpdated?: (updatedSummary: Summary) => void
  className?: string
}

export function SummaryEditor({ summary, onSummaryUpdated, className }: SummaryEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(summary.title)
  const [editedSummary, setEditedSummary] = useState(summary.summary)
  const [isSaving, setIsSaving] = useState(false)
  
  // Email sharing state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState<string[]>([''])
  const [emailSubject, setEmailSubject] = useState(`Meeting Summary: ${summary.title}`)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedSummary.trim()) {
      toast.error('Title and summary cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/summary/${summary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle.trim(),
          summary: editedSummary.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update summary')
      }

      const result = await response.json()
      
      // Create updated summary object
      const updatedSummary: Summary = {
        ...summary,
        title: editedTitle,
        summary: editedSummary,
      }
      
      toast.success('Summary updated successfully')
      setIsEditing(false)
      onSummaryUpdated?.(updatedSummary)
      
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update summary')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedTitle(summary.title)
    setEditedSummary(summary.summary)
    setIsEditing(false)
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
          summary_id: summary.id,
          recipients: validEmails.map(email => email.trim()),
          subject: emailSubject.trim() || `Meeting Summary: ${summary.title}`
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Summary Title</Label>
                    <Input
                      id="edit-title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Enter summary title"
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-xl">{summary.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(summary.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {summary.processing_time}ms
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      {summary.ai_model}
                    </Badge>
                  </CardDescription>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isSaving}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Mail className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </AlertDialogTrigger>
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
                        <div>
                          <Label>Summary Preview</Label>
                          <div className="mt-1 p-3 border rounded-md bg-muted/50 max-h-32 overflow-y-auto text-sm">
                            {summary.summary.length > 200 
                              ? `${summary.summary.substring(0, 200)}...` 
                              : summary.summary
                            }
                          </div>
                        </div>
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
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Prompt Section */}
          {summary.prompt && (
            <div>
              <h4 className="font-medium text-sm mb-2">Custom Instructions Used</h4>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                {summary.prompt}
              </div>
            </div>
          )}

          <Separator />

          {/* Summary Content */}
          <div>
            <h4 className="font-medium text-sm mb-2">AI Generated Summary</h4>
            {isEditing ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="Edit your summary..."
                className="min-h-[300px] resize-y"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 border rounded-lg bg-background">
                  {summary.summary}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          {!isEditing && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
              <span>Tokens: {summary.token_count}</span>
              <span>Processing: {summary.processing_time}ms</span>
              <span>Model: {summary.ai_model}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
