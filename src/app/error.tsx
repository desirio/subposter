'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl font-display font-bold text-red-500">Error</p>
        <h1 className="mt-4 text-xl font-display font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-400">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-block mt-6 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
