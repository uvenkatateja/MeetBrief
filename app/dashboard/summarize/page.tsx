'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  Edit,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { SummaryEditor } from '@/components/ui/summary-editor'

interface Transcript {
  id: string
  title: string
  file_name: string
  extracted_text: string
  word_count: number
  status: 'processing' | 'completed' | 'failed'
  created_at: string
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
  transcript_id: string
}

interface SummarizationStatus {
  stage: 'idle' | 'generating' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

function SummarizePageContent() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const transcriptId = searchParams.get('transcript_id')
  const editSummaryId = searchParams.get('edit_summary')
  
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [summarizationStatus, setSummarizationStatus] = useState<SummarizationStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  })

  // Default prompts for quick selection
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
      prompt: 'Provide comprehensive meeting notes including all discussion points, decisions made, participant contributions, and follow-up actions. Maintain chronological order where possible.'
    },
    {
      name: 'Technical Discussion',
      prompt: 'Summarize the technical aspects discussed, including solutions proposed, technical decisions made, implementation details, and any technical challenges or blockers identified.'
    }
  ]

  useEffect(() => {
    if (isLoaded && user && transcriptId) {
      fetchTranscript()
    }
  }, [isLoaded, user, transcriptId])

  useEffect(() => {
    // If edit_summary parameter is provided, we're in edit mode
    if (editSummaryId) {
      setIsEditMode(true)
      fetchExistingSummary(editSummaryId)
    }
  }, [editSummaryId])

  const fetchTranscript = async () => {
    try {
      // In a real app, you'd have an API endpoint to get transcript by ID
      // For now, let's simulate this or create the endpoint
      const response = await fetch(`/api/transcript/${transcriptId}`)
      
      if (!response.ok) {
        throw new Error('Transcript not found')
      }
      
      const result = await response.json()
      setTranscript(result.transcript || result)
      
      // Check if a summary already exists (only if not in edit mode)
      if (!isEditMode) {
        const summaryResponse = await fetch(`/api/summaries?transcript_id=${transcriptId}`)
        if (summaryResponse.ok) {
          const summaries = await summaryResponse.json()
          if (summaries.length > 0) {
            setSummary(summaries[0])
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch transcript:', error)
      toast.error('Failed to load transcript')
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingSummary = async (summaryId: string) => {
    try {
      const response = await fetch(`/api/summary/${summaryId}`)
      
      if (!response.ok) {
        throw new Error('Summary not found')
      }
      
      const result = await response.json()
      const summaryData = result.summary || result
      setSummary(summaryData)
      setCustomPrompt(summaryData.prompt || '')
      toast.success('Existing summary loaded for editing')
      
    } catch (error) {
      console.error('Failed to fetch existing summary:', error)
      toast.error('Failed to load summary for editing')
    }
  }

  const handleGenerateSummary = async () => {
    if (!transcript) {
      toast.error('No transcript available')
      return
    }

    setSummarizationStatus({
      stage: 'generating',
      progress: 10,
      message: 'Initializing AI summarization...'
    })

    try {
      // Create the summary request
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_id: transcript.id,
          prompt: customPrompt.trim() || 'Provide a comprehensive summary of this meeting transcript, highlighting key points, decisions made, and action items.',
          title: `Summary of ${transcript.title}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate summary')
      }

      setSummarizationStatus({
        stage: 'generating',
        progress: 80,
        message: 'Processing with AI...'
      })

      const result = await response.json()
      
      setSummarizationStatus({
        stage: 'complete',
        progress: 100,
        message: 'Summary generated successfully!'
      })

      // Set the generated summary
      setSummary(result.summary)
      toast.success('AI summary generated successfully!')
      
    } catch (error) {
      console.error('Summarization error:', error)
      setSummarizationStatus({
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

  const resetSummarization = () => {
    setSummarizationStatus({
      stage: 'idle',
      progress: 0,
      message: ''
    })
    setSummary(null)
  }

  const getStatusIcon = () => {
    switch (summarizationStatus.stage) {
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

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transcript...</span>
      </div>
    )
  }

  if (!transcript) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Transcript Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The transcript you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generate AI Summary</h1>
        <p className="text-muted-foreground mt-2">
          Create an intelligent summary of your meeting transcript using AI
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcript: {transcript.title}
              </CardTitle>
              <CardDescription>
                {transcript.file_name} • {transcript.word_count?.toLocaleString() || 0} words • 
                Uploaded {new Date(transcript.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-sm leading-relaxed">
                  {transcript.extracted_text.length > 500 
                    ? `${transcript.extracted_text.substring(0, 500)}...`
                    : transcript.extracted_text
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Custom Instructions
              </CardTitle>
              <CardDescription>
                Provide specific instructions for how you want the AI to summarize your meeting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom-prompt">
                  Summarization Instructions
                </Label>
                <Textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Focus on action items and decisions. Include participant names and deadlines. Format as bullet points for executive review."
                  className="mt-2 min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use default summarization format
                </p>
              </div>

              {/* Generate Button */}
              {summarizationStatus.stage === 'idle' ? (
                <Button 
                  onClick={handleGenerateSummary}
                  className="w-full"
                  size="lg"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Generate AI Summary
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    {getStatusIcon()}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {summarizationStatus.stage === 'generating' ? 'Generating' : summarizationStatus.stage}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {summarizationStatus.progress}%
                        </span>
                      </div>
                      <Progress 
                        value={summarizationStatus.progress} 
                        className="h-2"
                      />
                      {summarizationStatus.message && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {summarizationStatus.message}
                        </p>
                      )}
                      {summarizationStatus.error && (
                        <p className="text-sm text-red-600 mt-2">
                          {summarizationStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {(summarizationStatus.stage === 'complete' || summarizationStatus.stage === 'error') && (
                    <Button 
                      onClick={resetSummarization}
                      variant="outline"
                      className="w-full"
                    >
                      Generate New Summary
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Summary */}
          {summary && (
            <SummaryEditor 
              summary={summary}
              onSummaryUpdated={(updated) => setSummary(updated)}
            />
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

export default function SummarizePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading...</span>
      </div>
    }>
      <SummarizePageContent />
    </Suspense>
  )
}
