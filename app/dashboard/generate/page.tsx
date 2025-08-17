'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Brain,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wand2,
  Mail,
  Edit,
  Save,
  X,
  Send,
  Plus,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
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

interface GenerationStatus {
  stage: 'idle' | 'generating' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

interface Summary {
  id: string
  title: string
  summary: string
  prompt: string
  ai_model: string
  token_count: number
  processing_time: number
  created_at: string
}

export default function GeneratePage() {
  const { user, isLoaded } = useUser()
  const [inputText, setInputText] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [summaryTitle, setSummaryTitle] = useState('')
  const [generatedSummary, setGeneratedSummary] = useState<Summary | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  
  // Email sharing state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState<string[]>([''])
  const [emailSubject, setEmailSubject] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Prompt templates
  const promptTemplates = [
    {
      name: 'Executive Summary',
      prompt: 'Create an executive summary with key decisions, action items, and next steps. Focus on business impact and deliverables. Format with bullet points for executives.'
    },
    {
      name: 'Action Items Only',
      prompt: 'Extract only the action items, tasks, and assignments from this meeting. Include who is responsible and any mentioned deadlines. Format as a numbered list.'
    },
    {
      name: 'Detailed Meeting Notes',
      prompt: 'Provide comprehensive meeting notes including all discussion points, decisions made, participant contributions, and follow-up actions.'
    },
    {
      name: 'Key Decisions',
      prompt: 'Focus on the key decisions made during this meeting. Include the reasoning behind each decision and who made them.'
    }
  ]

  const handleGenerateSummary = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to summarize')
      return
    }

    setGenerationStatus({
      stage: 'generating',
      progress: 10,
      message: 'Initializing AI summarization...'
    })

    try {
      // Use Groq API directly through our summarization service
      setGenerationStatus({
        stage: 'generating',
        progress: 30,
        message: 'Calling Groq AI...'
      })

      const response = await fetch('/api/direct-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          prompt: customPrompt.trim() || 'Please provide a comprehensive summary of this meeting transcript, highlighting key points, decisions made, and action items.',
          title: summaryTitle.trim() || 'AI Generated Summary'
        })
      })

      setGenerationStatus({
        stage: 'generating',
        progress: 80,
        message: 'Processing with AI...'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate summary')
      }

      const result = await response.json()
      
      setGenerationStatus({
        stage: 'complete',
        progress: 100,
        message: 'Summary generated successfully!'
      })

      // Create summary object
      const summary: Summary = {
        id: result.id || 'temp-' + Date.now(),
        title: result.title || summaryTitle || 'AI Generated Summary',
        summary: result.summary,
        prompt: customPrompt || 'Default prompt',
        ai_model: result.model || 'groq-llama-3.3-70b',
        token_count: result.token_count || 0,
        processing_time: result.processing_time || 0,
        created_at: new Date().toISOString()
      }

      setGeneratedSummary(summary)
      setEditedTitle(summary.title)
      setEditedSummary(summary.summary)
      setEmailSubject(`Meeting Summary: ${summary.title}`)
      
      toast.success('AI summary generated successfully!')
      
    } catch (error) {
      console.error('Summarization error:', error)
      setGenerationStatus({
        stage: 'error',
        progress: 0,
        message: 'Failed to generate summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast.error('Failed to generate summary')
    }
  }

  const handleUseTemplate = (template: any) => {
    setCustomPrompt(template.prompt)
    toast.success(`Applied ${template.name} template`)
  }

  const resetGeneration = () => {
    setGenerationStatus({ stage: 'idle', progress: 0, message: '' })
    setGeneratedSummary(null)
    setInputText('')
    setCustomPrompt('')
    setSummaryTitle('')
  }

  const getStatusIcon = () => {
    switch (generationStatus.stage) {
      case 'generating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Brain className="h-5 w-5 text-muted-foreground" />
    }
  }

  // Email functions
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
    if (!generatedSummary) return

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
      const response = await fetch('/api/direct-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: {
            title: generatedSummary.title,
            content: generatedSummary.summary,
            ai_model: generatedSummary.ai_model,
            created_at: generatedSummary.created_at
          },
          recipients: validEmails.map(email => email.trim()),
          subject: emailSubject.trim() || `Meeting Summary: ${generatedSummary.title}`,
          sender_name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'MeetBrief User',
          sender_email: user?.emailAddresses?.[0]?.emailAddress || 'user@meetbrief.com'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send email')
      }

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

  // Edit functions
  const handleStartEdit = () => {
    if (!generatedSummary) return
    setIsEditing(true)
    setEditedTitle(generatedSummary.title)
    setEditedSummary(generatedSummary.summary)
  }

  const handleSaveEdit = () => {
    if (!generatedSummary) return
    
    const updatedSummary = {
      ...generatedSummary,
      title: editedTitle.trim(),
      summary: editedSummary.trim()
    }
    
    setGeneratedSummary(updatedSummary)
    setIsEditing(false)
    toast.success('Summary updated successfully!')
  }

  const handleCancelEdit = () => {
    if (!generatedSummary) return
    setIsEditing(false)
    setEditedTitle(generatedSummary.title)
    setEditedSummary(generatedSummary.summary)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generate AI Summary</h1>
        <p className="text-muted-foreground mt-2">
          Enter your meeting transcript and get an AI-powered summary with custom instructions
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Section */}
          {generationStatus.stage === 'idle' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Meeting Transcript
                  </CardTitle>
                  <CardDescription>
                    Paste your meeting transcript, notes, or any text you want to summarize
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="input-text">Text to Summarize</Label>
                    <Textarea
                      id="input-text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your meeting transcript here...&#10;&#10;Example:&#10;John: Let's discuss the Q1 budget. We have $100k allocated.&#10;Sarah: I think we should spend 60% on marketing.&#10;John: That sounds reasonable. What about development?&#10;Mike: We need at least 25% for new features..."
                      className="min-h-[200px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 50 characters required
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="summary-title">Summary Title (Optional)</Label>
                    <Input
                      id="summary-title"
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      placeholder="e.g., Q1 Budget Meeting Summary"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Custom Instructions
                  </CardTitle>
                  <CardDescription>
                    Tell the AI how you want the summary to be formatted and what to focus on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-prompt">Summarization Instructions</Label>
                    <Textarea
                      id="custom-prompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g., Focus on action items and decisions. Include participant names and deadlines. Format as bullet points for executive review."
                      className="mt-2 min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to use default comprehensive summary format
                    </p>
                  </div>

                  <Button 
                    onClick={handleGenerateSummary}
                    className="w-full"
                    size="lg"
                    disabled={!inputText.trim() || inputText.trim().length < 50}
                  >
                    <Brain className="h-5 w-5 mr-2" />
                    Generate AI Summary
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Generation Status */}
          {generationStatus.stage !== 'idle' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {generationStatus.stage === 'generating' ? 'Generating' : generationStatus.stage}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {generationStatus.progress}%
                      </span>
                    </div>
                    <Progress 
                      value={generationStatus.progress} 
                      className="h-2"
                    />
                    {generationStatus.message && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {generationStatus.message}
                      </p>
                    )}
                    {generationStatus.error && (
                      <p className="text-sm text-red-600 mt-2">
                        {generationStatus.error}
                      </p>
                    )}
                  </div>
                </div>
                
                {(generationStatus.stage === 'complete' || generationStatus.stage === 'error') && (
                  <Button 
                    onClick={resetGeneration}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Generate New Summary
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Summary */}
          {generatedSummary && (
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
                        <CardTitle className="text-xl">{generatedSummary.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            {generatedSummary.ai_model}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            AI Generated
                          </Badge>
                        </CardDescription>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          size="sm"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleStartEdit}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Share via Email
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
                        {generatedSummary.summary}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {!isEditing && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
                    <span>Tokens: {generatedSummary.token_count}</span>
                    <span>Processing: {generatedSummary.processing_time}ms</span>
                    <span>Model: {generatedSummary.ai_model}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prompt Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
              <CardDescription>
                Choose from pre-made prompts for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {promptTemplates.map((template, index) => (
                  <div 
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.prompt.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Better Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Be Specific</h4>
                  <p className="text-muted-foreground">
                    Tell the AI exactly what you want: action items, decisions, specific participants, etc.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Format Requests</h4>
                  <p className="text-muted-foreground">
                    Ask for bullet points, numbered lists, or specific sections to organize the output.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Context Matters</h4>
                  <p className="text-muted-foreground">
                    Mention if this is for executives, team members, or external stakeholders.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
