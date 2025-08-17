'use client'

import { useState } from "react"
import { UploadButton } from "@uploadthing/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OurFileRouter } from "@/lib/uploadthing"
import { toast } from "sonner"

interface UploadedFile {
  url: string
  name: string
  size: number
  key: string
  uploadedBy: string
}

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  className?: string
  maxFiles?: number
  acceptedFileTypes?: string[]
}

export function FileUpload({ onUploadComplete, className }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (fileKey: string) => {
    setUploadedFiles(prev => prev.filter(file => file.key !== fileKey))
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Meeting Transcript
        </CardTitle>
        <CardDescription>
          Upload your meeting transcript as a text file. We'll prepare it for AI summarization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Button */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 transition-colors hover:border-muted-foreground/50">
          <UploadButton<OurFileRouter, "transcriptUploader">
            endpoint="transcriptUploader"
            onClientUploadComplete={(res) => {
              console.log("Files: ", res)
              if (res) {
                const newFiles = res.map(file => ({
                  url: file.url,
                  name: file.name,
                  size: file.size,
                  key: file.key,
                  uploadedBy: file.serverData?.uploadedBy || 'unknown'
                }))
                setUploadedFiles(prev => [...prev, ...newFiles])
                onUploadComplete?.(newFiles)
                toast.success("Upload completed successfully!")
              }
              setUploading(false)
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error)
              toast.error(`Upload failed: ${error.message}`)
              setUploading(false)
            }}
            onUploadBegin={(name) => {
              console.log("Upload begun for:", name)
              setUploading(true)
              toast.info("Starting upload...")
            }}
            appearance={{
              button: cn(
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "px-6 py-3 rounded-md font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              ),
              container: "flex flex-col items-center gap-2",
              allowedContent: "text-sm text-muted-foreground mt-2"
            }}
          />
          
          {uploading && (
            <div className="mt-4 w-full max-w-xs">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Uploading and processing...
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
            {uploadedFiles.map((file) => (
              <div
                key={file.key}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Processed
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.key)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Format Info */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Supported Formats
          </h5>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>TXT:</strong> Up to 4MB - Plain text meeting transcripts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
