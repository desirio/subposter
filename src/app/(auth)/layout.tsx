import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'SubPoster — Sign In',
  description: 'Sign in to SubPoster',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark bg-gray-950">
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#F97316" />
                  <path d="M8 22V10l8 6 8-6v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h1 className="text-2xl font-display font-bold text-white tracking-tight">SubPoster</h1>
              </div>
              <p className="text-sm text-gray-500">Substack content, powered by Claude</p>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
