import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-display font-bold text-brand-500">404</p>
        <h1 className="mt-4 text-xl font-display font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
