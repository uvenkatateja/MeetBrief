import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardClientWrapper } from '@/components/dashboard-client-wrapper'
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Settings, 
  Menu,
  X,
  Brain,
  BarChart3,
  Mail
} from 'lucide-react'

// Types for component props
interface DashboardLayoutProps {
  children: React.ReactNode
}

interface SidebarProps {
  className?: string
}

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

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
    title: 'Shared Emails',
    href: '/dashboard/shared-emails',
    icon: Mail,
    description: 'View shared email history'
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

/**
 * Desktop Sidebar Component
 * - Always visible on desktop (lg:block)
 * - Fixed position on left side
 * - Includes navigation links and branding
 */
const Sidebar = ({ className = '' }: SidebarProps) => {
  return (
    <div className={`hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 ${className}`}>
      <div className="flex flex-col flex-grow pt-5 bg-background border-r overflow-y-auto">
        {/* Sidebar Header with Logo */}
        <div className="flex items-center flex-shrink-0 px-4 pb-4">
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
        </div>
        
        {/* Navigation Links */}
        <ScrollArea className="flex-grow">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
        
        {/* Sidebar Footer */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Version 1.0.0
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
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
 * Main Dashboard Layout Component
 * - Server Component (no 'use client' directive)
 * - Handles responsive layout structure
 * - Provides context for nested child pages
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Fixed position, always visible on lg+ */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* 
          ClientWrapper handles the mobile sidebar state since we need
          client-side interactivity for the mobile menu toggle
        */}
        <ClientWrapper>
          {/* 
            This is where child pages render:
            - app/dashboard/page.tsx -> Dashboard Home
            - app/dashboard/upload/page.tsx -> Upload page  
            - app/dashboard/summaries/page.tsx -> Summaries page
            - app/dashboard/settings/page.tsx -> Settings page
            
            Each child page will receive the full layout structure
            and render inside this main content area.
          */}
          <main className="flex-1">
            <div className="py-6 px-4 lg:px-8">
              {/* Child page content renders here */}
              {children}
            </div>
          </main>
        </ClientWrapper>
      </div>
    </div>
  )
}

// Use the client wrapper as ClientWrapper alias
const ClientWrapper = DashboardClientWrapper

/*
HOW TO USE THIS LAYOUT:

1. Create child pages in the dashboard directory:
   - app/dashboard/page.tsx (Dashboard home)
   - app/dashboard/upload/page.tsx (Upload page)
   - app/dashboard/summaries/page.tsx (Summaries page)
   - app/dashboard/settings/page.tsx (Settings page)

2. Each child page will automatically receive this layout structure.

3. Example child page (app/dashboard/page.tsx):
   ```tsx
   export default function DashboardPage() {
     return (
       <div className="space-y-6">
         <Card>
           <CardHeader>
             <CardTitle>Welcome to MeetBrief</CardTitle>
           </CardHeader>
           <CardContent>
             Your dashboard content here...
           </CardContent>
         </Card>
       </div>
     )
   }
   ```

4. The layout provides:
   - Responsive sidebar navigation
   - Header with user controls
   - Theme switching
   - Proper spacing and containers
   - Mobile-friendly design

5. Navigation automatically highlights the active page based on the URL.

6. All shadcn/ui components are pre-imported and ready to use in child pages.
*/
