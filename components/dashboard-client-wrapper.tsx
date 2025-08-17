'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserButton } from '@clerk/nextjs'
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Settings, 
  Menu,
  X,
  Brain,
  BarChart3
} from 'lucide-react'

// Navigation items configuration
const navigationItems = [
  {
    title: 'Dashboard Home',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    title: 'Upload Transcript',
    href: '/dashboard/upload',
    icon: Upload,
    description: 'Upload meeting files'
  },
  {
    title: 'Summaries',
    href: '/dashboard/summaries',
    icon: FileText,
    description: 'View generated summaries'
  },
  {
    title: 'AI Assistant',
    href: '/dashboard/ai',
    icon: Brain,
    description: 'AI tools and settings'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Usage statistics'
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account preferences'
  },
]

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Mobile Sidebar Component
 * - Overlay sidebar for mobile/tablet
 * - Slides in from left with backdrop
 * - Same navigation as desktop but in overlay format
 */
const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <div className="flex items-center space-x-3">
              <Image 
                src="/newlogo.png" 
                alt="MeetBrief Logo" 
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="text-xl font-bold text-foreground">MeetBrief</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mobile Navigation */}
          <ScrollArea className="flex-1">
            <nav className="px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center px-2 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}

/**
 * Dashboard Header Component
 * - Responsive header bar
 * - Contains mobile menu button, breadcrumbs, and user controls
 * - Sticky positioning
 */
const DashboardHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 lg:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
        
        {/* Page Title Area - can be customized by child pages */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your meeting summaries and AI insights
          </p>
        </div>
        
        {/* User Controls */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle - Hidden on mobile as it's in sidebar */}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          
          {/* User Profile Button */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
                userButtonPopoverCard: "shadow-lg border",
                userButtonPopoverActionButton: "hover:bg-accent",
              }
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  )
}

/**
 * Client Wrapper Component
 * - Handles mobile sidebar state and interactions
 * - This component needs client-side state for mobile menu
 */
export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <MobileSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main content with header */}
      <div className="flex flex-col min-h-screen">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </>
  )
}
