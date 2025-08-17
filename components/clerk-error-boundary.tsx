'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ClerkErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ClerkErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ClerkErrorBoundary extends React.Component<
  ClerkErrorBoundaryProps,
  ClerkErrorBoundaryState
> {
  constructor(props: ClerkErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ClerkErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('Clerk Error Boundary caught an error:', error, errorInfo)
    
    // You can also log the error to an error reporting service here
    if (error.message.includes('Clerk')) {
      console.error('Clerk initialization failed. Please check your environment variables.')
    }
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined })
    
    // Reload the page to retry Clerk initialization
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle>Authentication Service Error</CardTitle>
              <CardDescription>
                We're having trouble connecting to the authentication service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                <p>This could be due to:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Network connectivity issues</li>
                  <li>• Temporary service outage</li>
                  <li>• Configuration problems</li>
                </ul>
              </div>
              
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                If the problem persists, please contact support.
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="text-xs cursor-pointer text-muted-foreground">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useClerkErrorHandler() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Clerk')) {
        console.error('Clerk error detected:', event.error)
        // You could trigger a toast notification here
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Clerk')) {
        console.error('Clerk promise rejection:', event.reason)
        // Prevent the default browser error handling
        event.preventDefault()
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}
