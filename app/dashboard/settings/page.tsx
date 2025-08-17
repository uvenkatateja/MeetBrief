'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings,
  User,
  Bell,
  Shield,
  Trash2,
  Key,
  Mail,
  Smartphone,
  Globe,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
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

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    summaryComplete: boolean
    weeklyDigest: boolean
    securityAlerts: boolean
  }
  preferences: {
    language: string
    timezone: string
    defaultPrompt: string
    autoSummarize: boolean
    shareByDefault: boolean
  }
  privacy: {
    dataRetention: number
    analyticsTracking: boolean
    shareUsageData: boolean
  }
}

interface UserStats {
  totalUploads: number
  totalSummaries: number
  storageUsed: number
  storageLimit: number
  accountCreated: string
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      summaryComplete: true,
      weeklyDigest: true,
      securityAlerts: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      defaultPrompt: 'comprehensive',
      autoSummarize: true,
      shareByDefault: false
    },
    privacy: {
      dataRetention: 365,
      analyticsTracking: true,
      shareUsageData: false
    }
  })
  
  const [stats, setStats] = useState<UserStats>({
    totalUploads: 147,
    totalSummaries: 135,
    storageUsed: 245,
    storageLimit: 1000,
    accountCreated: '2024-01-15'
  })

  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy'>('account')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserSettings()
      fetchUserStats()
    }
  }, [isLoaded, user])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/user/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `meetbrief-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Data exported successfully!')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Account deletion initiated. You will be logged out shortly.')
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Failed to delete account')
    }
  }

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const updatePreferenceSetting = (key: keyof UserSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'account', label: 'Account', icon: User },
            { key: 'notifications', label: 'Notifications', icon: Bell },
            { key: 'privacy', label: 'Privacy', icon: Shield }
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
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.imageUrl || '/default-avatar.png'}
                      alt="Profile"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user?.fullName || user?.username}</div>
                      <div className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input defaultValue={user?.fullName || ''} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue={user?.primaryEmailAddress?.emailAddress || ''} disabled />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Account Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Uploads</span>
                      <Badge variant="outline">{stats.totalUploads}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Summaries Generated</span>
                      <Badge variant="outline">{stats.totalSummaries}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Storage Used</span>
                      <div className="text-right">
                        <div className="text-sm">{stats.storageUsed}MB / {stats.storageLimit}MB</div>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Member Since</span>
                      <span className="text-sm">{new Date(stats.accountCreated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Preferences</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={settings.preferences.language}
                      onChange={(e) => updatePreferenceSetting('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={settings.preferences.timezone}
                      onChange={(e) => updatePreferenceSetting('timezone', e.target.value)}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Summarize Uploads</Label>
                      <p className="text-sm text-muted-foreground">Automatically generate summaries after uploading</p>
                    </div>
                    <Switch
                      checked={settings.preferences.autoSummarize}
                      onCheckedChange={(value) => updatePreferenceSetting('autoSummarize', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share by Default</Label>
                      <p className="text-sm text-muted-foreground">Make summaries shareable by default</p>
                    </div>
                    <Switch
                      checked={settings.preferences.shareByDefault}
                      onCheckedChange={(value) => updatePreferenceSetting('shareByDefault', value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export your data or manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">Download all your meetings and summaries</div>
                </div>
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified about your meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(value) => updateNotificationSetting('email', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(value) => updateNotificationSetting('push', value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Summary Complete</Label>
                    <p className="text-sm text-muted-foreground">When AI summary generation is finished</p>
                  </div>
                  <Switch
                    checked={settings.notifications.summaryComplete}
                    onCheckedChange={(value) => updateNotificationSetting('summaryComplete', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Weekly summary of your activity</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyDigest}
                    onCheckedChange={(value) => updateNotificationSetting('weeklyDigest', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important account security notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.securityAlerts}
                    onCheckedChange={(value) => updateNotificationSetting('securityAlerts', value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control how your data is stored and used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <select 
                    className="w-full p-2 border rounded-md max-w-xs"
                    value={settings.privacy.dataRetention}
                    onChange={(e) => updatePrivacySetting('dataRetention', parseInt(e.target.value))}
                  >
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                    <option value={730}>2 years</option>
                    <option value={-1}>Keep forever</option>
                  </select>
                  <p className="text-sm text-muted-foreground">How long to keep your meeting data</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Analytics Tracking</Label>
                      <p className="text-sm text-muted-foreground">Help improve our service with usage analytics</p>
                    </div>
                    <Switch
                      checked={settings.privacy.analyticsTracking}
                      onCheckedChange={(value) => updatePrivacySetting('analyticsTracking', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Usage Data</Label>
                      <p className="text-sm text-muted-foreground">Share anonymous usage statistics</p>
                    </div>
                    <Switch
                      checked={settings.privacy.shareUsageData}
                      onCheckedChange={(value) => updatePrivacySetting('shareUsageData', value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers, including all meetings,
                      summaries, and settings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={saveSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
