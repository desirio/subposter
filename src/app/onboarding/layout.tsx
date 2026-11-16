import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SubPoster — Get Started',
  description: 'Set up your SubPoster account',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="border-b border-gray-800/50 py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16M4 12l4-4M4 12l4 4M14 4l6 8-6 8" />
            </svg>
          </div>
          <h1 className="text-lg font-display font-bold text-white tracking-tight">SubPoster</h1>
        </div>
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          {children}
        </div>
      </main>
    </div>
  )
}
