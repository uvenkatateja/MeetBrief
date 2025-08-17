'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Brain,
  Settings,
  Save,
  Sparkles,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Copy,
  Trash2,
  Plus,
  Edit3,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  category: 'meeting' | 'action-items' | 'summary' | 'custom'
  isDefault?: boolean
  usage_count?: number
}

const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Summary',
    description: 'Detailed overview with all key points',
    prompt: 'Please provide a comprehensive summary of this meeting transcript. Include: 1) Main topics discussed, 2) Key decisions made, 3) Action items with owners, 4) Next steps, and 5) Important quotes or insights.',
    category: 'summary',
    isDefault: true
  },
  {
    id: 'action-focused',
    name: 'Action Items Focus',
    description: 'Emphasizes tasks and deliverables',
    prompt: 'Focus on extracting action items and deliverables from this meeting. For each action item, identify: 1) The specific task, 2) Who is responsible, 3) The deadline if mentioned, 4) Priority level, and 5) Dependencies on other tasks.',
    category: 'action-items',
    isDefault: true
  },
  {
    id: 'decision-tracker',
    name: 'Decision Tracker',
    description: 'Highlights decisions and rationale',
    prompt: 'Identify and summarize all decisions made in this meeting. For each decision: 1) What was decided, 2) Who made the decision, 3) The reasoning behind it, 4) Any alternatives considered, and 5) Impact on the project/team.',
    category: 'meeting',
    isDefault: true
  },
  {
    id: 'brief-executive',
    name: 'Executive Brief',
    description: 'Concise summary for leadership',
    prompt: 'Create a brief executive summary suitable for leadership. Include only: 1) The meeting purpose, 2) Critical decisions made, 3) Key risks or blockers identified, 4) Budget/resource implications, and 5) Next steps requiring leadership attention.',
    category: 'summary',
    isDefault: true
  }
]

export default function AIAssistantPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'templates' | 'settings' | 'custom'>('templates')
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(defaultPromptTemplates)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'custom' as const
  })
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false)

  useEffect(() => {
    // Load user's custom templates
    fetchCustomTemplates()
  }, [])

  const fetchCustomTemplates = async () => {
    try {
      const response = await fetch('/api/ai/templates')
      if (response.ok) {
        const customTemplates = await response.json()
        setPromptTemplates([...defaultPromptTemplates, ...customTemplates])
      }
    } catch (error) {
      console.error('Failed to fetch custom templates:', error)
    }
  }

  const saveCustomTemplate = async () => {
    if (!newTemplate.name || !newTemplate.prompt) {
      toast.error('Please provide a name and prompt for your template')
      return
    }

    try {
      const response = await fetch('/api/ai/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })

      if (response.ok) {
        const savedTemplate = await response.json()
        setPromptTemplates(prev => [...prev, savedTemplate])
        setNewTemplate({ name: '', description: '', prompt: '', category: 'custom' })
        setShowNewTemplateForm(false)
        toast.success('Template saved successfully!')
      } else {
        toast.error('Failed to save template')
      }
    } catch (error) {
      console.error('Save template error:', error)
      toast.error('Failed to save template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/ai/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPromptTemplates(prev => prev.filter(t => t.id !== templateId))
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null)
        }
        toast.success('Template deleted successfully')
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      console.error('Delete template error:', error)
      toast.error('Failed to delete template')
    }
  }

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success('Prompt copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy prompt')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting':
        return <Users className="h-4 w-4" />
      case 'action-items':
        return <CheckCircle className="h-4 w-4" />
      case 'summary':
        return <FileText className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800'
      case 'action-items':
        return 'bg-green-100 text-green-800'
      case 'summary':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Customize your AI prompts and manage summarization settings
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'templates', label: 'Prompt Templates', icon: FileText },
            { key: 'custom', label: 'Custom Prompts', icon: Edit3 },
            { key: 'settings', label: 'AI Settings', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Templates List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Prompt Templates</h2>
              <Button 
                onClick={() => setShowNewTemplateForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>

            {promptTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(template.category)}`}
                      >
                        {getCategoryIcon(template.category)}
                        <span className="ml-1 capitalize">{template.category}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.prompt}
                  </p>
                  {template.usage_count && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      Used {template.usage_count} times
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Template Detail View */}
          <div className="lg:sticky lg:top-4">
            {selectedTemplate ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedTemplate.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`${getCategoryColor(selectedTemplate.category)}`}
                    >
                      {getCategoryIcon(selectedTemplate.category)}
                      <span className="ml-1 capitalize">{selectedTemplate.category}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Prompt</Label>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                      {selectedTemplate.prompt}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => copyPrompt(selectedTemplate.prompt)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Prompt
                    </Button>
                    {!selectedTemplate.isDefault && (
                      <Button 
                        onClick={() => deleteTemplate(selectedTemplate.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Template</h3>
                  <p className="text-muted-foreground">
                    Choose a prompt template to view its details and copy the prompt
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-6">
          {/* Custom Prompt Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Custom Prompt Editor
              </CardTitle>
              <CardDescription>
                Create and test custom prompts for your specific needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom-prompt">Custom Prompt</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="Enter your custom prompt here... For example: 'Summarize this meeting focusing on technical decisions and their implementation timeline.'"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="mt-2 min-h-32"
                  rows={8}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyPrompt(customPrompt)}
                  disabled={!customPrompt}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Prompt
                </Button>
                <Button 
                  onClick={() => {
                    setNewTemplate(prev => ({ ...prev, prompt: customPrompt }))
                    setShowNewTemplateForm(true)
                  }}
                  disabled={!customPrompt}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* New Template Form */}
          {showNewTemplateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
                <CardDescription>
                  Save your custom prompt as a reusable template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Technical Review Summary"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    placeholder="Brief description of when to use this template"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-prompt">Prompt</Label>
                  <Textarea
                    id="template-prompt"
                    placeholder="Enter the prompt template..."
                    value={newTemplate.prompt}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, prompt: e.target.value }))}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={saveCustomTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowNewTemplateForm(false)
                      setNewTemplate({ name: '', description: '', prompt: '', category: 'custom' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* AI Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Configuration
              </CardTitle>
              <CardDescription>
                Configure AI model preferences and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">Primary AI Service</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Groq</div>
                          <div className="text-xs text-muted-foreground">Lightning fast responses</div>
                        </div>
                      </div>
                      <Badge>Primary</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">OpenAI GPT-4</div>
                          <div className="text-xs text-muted-foreground">Fallback service</div>
                        </div>
                      </div>
                      <Badge variant="outline">Fallback</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Processing Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max tokens per summary</span>
                      <Badge variant="outline">8,192</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Temperature</span>
                      <Badge variant="outline">0.3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-chunk large files</span>
                      <Badge>Enabled</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Usage Statistics</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Total summaries generated</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">98.2%</div>
                    <div className="text-sm text-muted-foreground">Success rate</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">~2min</div>
                    <div className="text-sm text-muted-foreground">Avg processing time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Quality & Preferences</CardTitle>
              <CardDescription>
                Adjust summary quality and output preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Summary Length</div>
                    <div className="text-sm text-muted-foreground">Preferred summary detail level</div>
                  </div>
                  <Badge variant="outline">Comprehensive</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Include Timestamps</div>
                    <div className="text-sm text-muted-foreground">Add time references to summaries</div>
                  </div>
                  <Badge>Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Highlight Action Items</div>
                    <div className="text-sm text-muted-foreground">Emphasize tasks and deliverables</div>
                  </div>
                  <Badge>Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
