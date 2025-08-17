'use client'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import React from 'react'
import { cn } from '@/lib/utils'

const menuItems = []

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header>
      <nav
        data-state={menuState && 'active'}
        className="fixed z-20 w-full px-2"
      >
        <div className={cn(
          'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
          isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5'
        )}>
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
              </Link>
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>
            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <AuthButtons isScrolled={isScrolled} />
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

// Authentication buttons component
const AuthButtons = ({ isScrolled }: { isScrolled: boolean }) => {
  const { isSignedIn, user } = useUser()

  return (
    <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
      <ThemeToggle />
      
      {isSignedIn ? (
        // User is signed in - show dashboard link and user button
        <>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(isScrolled && 'lg:hidden')}
          >
            <Link href="/dashboard">
              <span>Dashboard</span>
            </Link>
          </Button>
          <div className={cn(isScrolled ? 'lg:inline-flex' : 'hidden', 'flex items-center')}>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg",
                }
              }}
              afterSignOutUrl="/"
            />
          </div>
        </>
      ) : (
        // User is not signed in - show login/signup buttons
        <>
          <SignInButton mode="modal">
            <Button
              variant="outline"
              size="sm"
              className={cn(isScrolled && 'lg:hidden')}
            >
              <span>Login</span>
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className={cn(isScrolled && 'lg:hidden')}
            >
              <span>Sign Up</span>
            </Button>
          </SignUpButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}
            >
              <span>Get Started</span>
            </Button>
          </SignUpButton>
        </>
      )}
    </div>
  )
}
