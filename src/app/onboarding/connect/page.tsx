'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OnboardingProgress from '@/components/OnboardingProgress'

interface Connection {
  platform: string
  platform_username: string | null
}

function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.22 1.332-2.96.825-.66 1.96-1.044 3.304-1.12.984-.056 1.9.024 2.744.226-.078-.846-.335-1.493-.766-1.926-.544-.545-1.378-.82-2.478-.82l-.04.001c-.98.013-1.752.313-2.29.894l-1.436-1.39c.88-.912 2.1-1.397 3.712-1.44l.072-.001c1.6 0 2.861.467 3.742 1.389.836.874 1.29 2.075 1.362 3.578.476.152.925.34 1.342.566 1.16.627 2.065 1.508 2.608 2.55.855 1.636.96 4.424-1.193 6.536-1.786 1.752-4.02 2.548-7.035 2.571zm-.2-8.132c-1.155.066-2.484.39-2.594 1.698-.067.794.397 1.63 1.893 1.63l.056-.001c1.653-.091 2.552-1.14 2.737-3.2-.652-.172-1.371-.263-2.092-.127z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const PLATFORMS = [
  {
    key: 'x',
    label: 'X (Twitter)',
    description: 'Post tweets and threads to your X account',
    connectUrl: '/api/auth/x',
    icon: XIcon,
  },
  {
    key: 'threads',
    label: 'Threads',
    description: 'Share posts to your Threads profile',
    connectUrl: '/api/auth/threads',
    icon: ThreadsIcon,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Publish to your LinkedIn network',
    connectUrl: '/api/auth/linkedin',
    icon: LinkedInIcon,
  },
]

export default function OnboardingConnectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')

  const connected = searchParams.get('connected')

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/connections')
      const data = await res.json()
      setConnections(data.connections ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingConnections(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  function isConnected(platform: string) {
    return connections.some((c) => c.platform === platform)
  }

  function getConnection(platform: string) {
    return connections.find((c) => c.platform === platform)
  }

  async function handleComplete() {
    setError('')
    setCompleting(true)

    try {
      const res = await fetch('/api/onboarding/complete', { method: 'POST' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to complete onboarding')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCompleting(false)
    }
  }

  const hasConnections = connections.length > 0

  return (
    <div className="space-y-8">
      <OnboardingProgress currentStep={4} />

      <div>
        <h2 className="text-3xl font-display font-bold text-white">Connect your accounts</h2>
        <p className="text-gray-400 mt-2">
          Connect at least one social account to start sharing your content.
        </p>
      </div>

      {connected && (
        <div className="p-3.5 bg-green-900/20 border border-green-800/50 rounded-xl text-sm text-green-400">
          Successfully connected {connected === 'x' ? 'X (Twitter)' : connected === 'threads' ? 'Threads' : 'LinkedIn'}.
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="space-y-3">
        {PLATFORMS.map((platform) => {
          const conn = getConnection(platform.key)
          const platformConnected = isConnected(platform.key)
          const Icon = platform.icon

          return (
            <div
              key={platform.key}
              className={`flex items-center justify-between p-5 bg-gray-900 border rounded-xl transition-colors ${
                platformConnected ? 'border-green-800/40' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`${platformConnected ? 'text-white' : 'text-gray-500'}`}>
                  <Icon />
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{platform.label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {platformConnected && conn?.platform_username
                      ? `Connected as @${conn.platform_username}`
                      : platform.description}
                  </p>
                </div>
              </div>
              <div>
                {platformConnected ? (
                  <span className="px-3.5 py-1.5 text-xs font-medium text-green-400 bg-green-900/20 border border-green-800/40 rounded-lg">
                    Connected
                  </span>
                ) : (
                  <a
                    href={platform.connectUrl}
                    className="px-3.5 py-1.5 text-xs font-medium text-brand-400 bg-brand-950/50 border border-brand-800/40 rounded-lg hover:bg-brand-900/30 transition-colors inline-block"
                  >
                    Connect
                  </a>
                )}
              </div>
            </div>
          )
        })}
        {loadingConnections && (
          <p className="text-xs text-gray-600">Loading connections...</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full py-3.5 px-6 bg-brand-500 hover:bg-brand-400 disabled:bg-brand-800 disabled:cursor-not-allowed text-white font-display font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/10 hover:shadow-brand-400/20"
        >
          {completing ? 'Finishing up...' : 'Go to dashboard'}
        </button>
        {!hasConnections && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
