import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">SubPoster</h1>
              <p className="text-sm text-gray-500 mt-1">Substack content, powered by Claude</p>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
