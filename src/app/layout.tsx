import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TwemojiProvider from '@/components/TwemojiProvider'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  title: 'DropSwap — Back to Barter. Swap More. Spend Less.',
  description: 'DropSwap is the UK peer-to-peer bartering platform. Trade what you have for what you need — no money, no middlemen. Beat the cost of living.',
  manifest: '/manifest.json',
  keywords: ['barter', 'swap', 'trade', 'UK', 'free', 'exchange', 'peer to peer', 'cost of living'],
  authors: [{ name: 'DropSwap' }],
  creator: 'DropSwap',
  metadataBase: new URL('https://www.dropswap.co.uk'),
  openGraph: {
    title: 'DropSwap — Back to Barter. Swap More. Spend Less.',
    description: 'Trade what you have for what you need — no money needed. The UK\'s free peer-to-peer bartering platform.',
    url: 'https://www.dropswap.co.uk',
    siteName: 'DropSwap',
    images: [
      {
        url: '/logo-full.png',
        width: 1200,
        height: 630,
        alt: 'DropSwap — Back to Barter',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DropSwap — Swap More. Spend Less.',
    description: 'The UK\'s free peer-to-peer bartering platform. Trade items, beat the cost of living.',
    images: ['/logo-full.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DropSwap',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <TwemojiProvider />
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  )
}
