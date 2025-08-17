import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./hide-dev-ui.css";
import "@/lib/suppress-warnings";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs';
import { ClerkErrorBoundary } from '@/components/clerk-error-boundary';

// Clerk configuration
const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  appearance: {
    baseTheme: undefined,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
    },
  },
  localization: {
    signIn: {
      start: {
        title: 'Sign in to MeetBrief',
      },
    },
    signUp: {
      start: {
        title: 'Create your MeetBrief account',
      },
    },
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeetBrief",
  description: "AI-Powered Meeting Notes Summarizer & Sharer",
  icons: {
    icon: [
      {
        url: '/newlogo.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/newlogo.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: {
      url: '/newlogo.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
  openGraph: {
    title: 'MeetBrief',
    description: 'AI-Powered Meeting Notes Summarizer & Sharer',
    url: 'https://meetbrief.com',
    siteName: 'MeetBrief',
    images: [
      {
        url: '/newlogo.png',
        width: 1200,
        height: 630,
        alt: 'MeetBrief Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeetBrief',
    description: 'AI-Powered Meeting Notes Summarizer & Sharer',
    images: ['/newlogo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Validate Clerk configuration
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
  }

  return (
    <ClerkErrorBoundary>
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        appearance={clerkConfig.appearance}
        localization={clerkConfig.localization}
      >
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}
