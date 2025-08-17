'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface UploadedFile {
  url: string
  name: string
  size: number
  key: string
  uploadedBy: string
}

interface UploadStatus {
  stage: 'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error'
  progress: number
  message: string
  fileId?: string
  transcriptId?: string
}

export default function UploadPage() {
  const { user } = useUser()
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  const [customPrompt, setCustomPrompt] = useState('')
  const [autoSummarize, setAutoSummarize] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleUploadComplete = async (files: UploadedFile[]) => {
    try {
      setUploadedFiles(files)
      setUploadStatus({
        stage: 'processing',
        progress: 30,
        message: 'Processing uploaded files...'
      })

      // Process each file
      for (const file of files) {
        setUploadStatus(prev => ({
          ...prev,
          stage: 'extracting',
          progress: 60,
          message: `Processing ${file.name}...`
        }))

        // File is automatically processed by UploadThing webhook
        // Wait for processing to complete and get transcript ID
        let transcriptId = null
        let attempts = 0
        const maxAttempts = 10
        
        // Poll for transcript processing completion
        while (attempts < maxAttempts && !transcriptId) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
          
          // Check if transcript was created and processed
          try {
            const response = await fetch('/api/summaries?limit=1')
            if (response.ok) {
              const summaries = await response.json()
              // Look for recent transcripts
              const recentSummary = summaries.find((s: any) => 
                s.filename === file.name || s.title.includes(file.name.replace(/\.[^/.]+$/, ""))
              )
              if (recentSummary?.transcript_id) {
                transcriptId = recentSummary.transcript_id
              }
            }
          } catch (err) {
            console.log('Checking for transcript...', attempts)
          }
        }
        
        setUploadStatus(prev => ({
          ...prev,
          stage: 'complete',
          progress: 90,
          message: `Successfully processed ${file.name}`,
          transcriptId
        }))

        // If auto-summarize is enabled, generate summary
        if (autoSummarize) {
          if (transcriptId) {
            // Use the found transcript ID
            await handleAutoSummarize(transcriptId, file.name)
          } else {
            // Create a simple text-based summary for immediate processing
            await handleDirectSummarization(file.name)
          }
        }
        
        setUploadStatus(prev => ({
          ...prev,
          progress: 100
        }))
      }

      toast.success(`Successfully uploaded and processed ${files.length} file(s)`)
    } catch (error) {
      console.error('Upload processing error:', error)
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to process upload'
      })
      toast.error('Failed to process upload')
    }
  }

  const handleAutoSummarize = async (transcriptId: string, fileName: string) => {
    try {
      setUploadStatus(prev => ({
        ...prev,
        stage: 'processing',
        progress: 80,
        message: `Generating AI summary for ${fileName}...`
      }))

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_id: transcriptId,
          prompt: customPrompt || 'Please provide a comprehensive summary of this meeting transcript, highlighting key points, decisions made, and action items.'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const result = await response.json()
      
      setUploadStatus(prev => ({
        ...prev,
        stage: 'complete',
        progress: 100,
        message: `Summary generated for ${fileName}!`
      }))

      toast.success('AI summary generated successfully!')
      
      // Redirect to summary view after a moment
      setTimeout(() => {
        window.location.href = `/dashboard/summaries?highlight=${result.summary.id}`
      }, 2000)
      
    } catch (error) {
      console.error('Auto-summarize error:', error)
      toast.error('Upload successful, but summary generation failed')
    }
  }

  const handleDirectSummarization = async (fileName: string) => {
    try {
      setUploadStatus(prev => ({
        ...prev,
        stage: 'processing',
        progress: 85,
        message: `Generating AI summary for ${fileName}...`
      }))

      // For direct summarization without transcript ID, we'll show a message
      // that processing is complete and user should manually generate summary
      setUploadStatus(prev => ({
        ...prev,
        stage: 'complete',
        progress: 100,
        message: `${fileName} uploaded successfully! Visit Summaries to generate AI summary.`
      }))

      toast.success('File uploaded! Go to Summaries page to generate AI summary.')
      
      // Redirect to summaries page
      setTimeout(() => {
        window.location.href = `/dashboard/summaries`
      }, 2000)
      
    } catch (error) {
      console.error('Direct summarization error:', error)
      toast.error('Upload successful, visit Summaries page to generate summary')
    }
  }

  const resetUpload = () => {
    setUploadStatus({ stage: 'idle', progress: 0, message: '' })
    setUploadedFiles([])
  }

  const getStatusIcon = () => {
    switch (uploadStatus.stage) {
      case 'uploading':
      case 'processing':
      case 'extracting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = () => {
    switch (uploadStatus.stage) {
      case 'uploading':
      case 'processing':
      case 'extracting':
        return 'bg-blue-600'
      case 'complete':
        return 'bg-green-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-gray-300'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Meeting Transcript</h1>
        <p className="text-muted-foreground mt-2">
          Upload your meeting transcript as a text file to get AI-powered summaries
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Supported format: .txt files only
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadStatus.stage === 'idle' ? (
                <FileUpload 
                  onUploadComplete={handleUploadComplete}
                  maxFiles={5}
                  acceptedFileTypes={[
                    'text/plain'
                  ]}
                />
              ) : (
                <div className="space-y-4">
                  {/* Upload Status */}
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    {getStatusIcon()}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{uploadStatus.stage}</span>
                        <span className="text-sm text-muted-foreground">
                          {uploadStatus.progress}%
                        </span>
                      </div>
                      <Progress 
                        value={uploadStatus.progress} 
                        className={`h-2 ${getStatusColor()}`}
                      />
                      {uploadStatus.message && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {uploadStatus.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Uploaded Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <span className="flex-1">{file.name}</span>
                          <span className="text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {uploadStatus.stage === 'complete' && (
                      <Button onClick={resetUpload} variant="outline">
                        Upload Another File
                      </Button>
                    )}
                    {uploadStatus.stage === 'error' && (
                      <Button onClick={resetUpload} variant="outline">
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processing Options
              </CardTitle>
              <CardDescription>
                Configure how your files should be processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-summarize"
                  checked={autoSummarize}
                  onChange={(e) => setAutoSummarize(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="auto-summarize">
                  Automatically generate AI summary after upload
                </Label>
              </div>

              {autoSummarize && (
                <div>
                  <Label htmlFor="custom-prompt">
                    Custom Summary Instructions (Optional)
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    placeholder="e.g., Focus on action items and decisions made. Include participant names and deadlines."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use the default summary format
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Upload Your Transcript</h4>
                  <p className="text-sm text-muted-foreground">
                    Select and upload your meeting transcript as a text file
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Text Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    We process your text transcript and prepare it for AI analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">AI Summarization</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI generates intelligent summaries with key points and action items
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Review & Share</h4>
                  <p className="text-sm text-muted-foreground">
                    Edit your summaries and share them with your team via email
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">Text Files</h4>
                  <p className="text-xs text-muted-foreground">.txt only - Plain text meeting transcripts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
