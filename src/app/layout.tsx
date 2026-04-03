import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ReviewRadar – AI-Powered Review Analytics',
    template: '%s | ReviewRadar',
  },
  description:
    'Aggregate, analyze, and act on customer reviews with AI-powered insights. Monitor sentiment, detect trends, and respond faster with ReviewRadar.',
  keywords: [
    'review analytics',
    'AI reviews',
    'sentiment analysis',
    'customer feedback',
    'review monitoring',
  ],
  authors: [{ name: 'ReviewRadar' }],
  creator: 'ReviewRadar',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://reviewradar.app'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ReviewRadar',
    title: 'ReviewRadar – AI-Powered Review Analytics',
    description:
      'Aggregate, analyze, and act on customer reviews with AI-powered insights.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ReviewRadar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewRadar – AI-Powered Review Analytics',
    description:
      'Aggregate, analyze, and act on customer reviews with AI-powered insights.',
    images: ['/og-image.png'],
    creator: '@reviewradar',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
