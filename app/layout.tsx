import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import CurrencyFormatEffect from '@/components/common/CurrencyFormatEffect'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Zoey's Tax Advisory | 2026 Tax Prep",
  description: "Zoey's Tax Advisory helps you prepare your 2026 return with clear, step-by-step guidance.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <CurrencyFormatEffect />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
