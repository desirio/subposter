'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import PostHistory from '@/components/PostHistory'

interface Connection {
  platform: string
  platform_username: string | null
  created_at: string
  token_expires_at: string | null
}

const PLATFORMS = [
  {
    key: 'x',
    label: 'X (Twitter)',
    description: 'Post tweets and threads',
    connectUrl: '/api/auth/x',
  },
  {
    key: 'threads',
    label: 'Threads',
    description: 'Post to Threads',
    connectUrl: '/api/auth/threads',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Post to LinkedIn',
    connectUrl: '/api/auth/linkedin',
  },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const connected = searchParams.get('connected')
  const error = searchParams.get('error')

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/connections')
      const data = await res.json()
      setConnections(data.connections ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform)
    try {
      await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      await fetchConnections()
    } catch {
      // ignore
    } finally {
      setDisconnecting(null)
    }
  }

  function isConnected(platform: string) {
    return connections.some((c) => c.platform === platform)
  }

  function getConnection(platform: string) {
    return connections.find((c) => c.platform === platform)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-lg font-display font-bold text-white">Settings</h1>
          </div>
          <span className="text-xs text-gray-600 hidden sm:inline">{user?.email}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Status messages */}
        {connected && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-300">
            Successfully connected {connected === 'x' ? 'X (Twitter)' : connected === 'threads' ? 'Threads' : 'LinkedIn'}.
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
            Failed to connect. Please try again.
          </div>
        )}

        {/* Connected Accounts */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Connected Accounts
          </h2>
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const conn = getConnection(platform.key)
              const platformConnected = isConnected(platform.key)

              return (
                <div
                  key={platform.key}
                  className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          platformConnected ? 'bg-green-400' : 'bg-gray-600'
                        }`}
                      />
                      <span className="text-sm font-medium text-white">{platform.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {platformConnected && conn?.platform_username
                        ? `Connected as @${conn.platform_username}`
                        : platform.description}
                    </p>
                    {platformConnected && conn?.token_expires_at && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Token expires: {new Date(conn.token_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div>
                    {platformConnected ? (
                      <button
                        onClick={() => handleDisconnect(platform.key)}
                        disabled={disconnecting === platform.key}
                        className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-all"
                      >
                        {disconnecting === platform.key ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <a
                        href={platform.connectUrl}
                        className="px-3 py-1.5 text-xs font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-lg hover:bg-brand-500/20 transition-all inline-block"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {loading && (
            <p className="text-xs text-gray-600 mt-2">Loading connections...</p>
          )}
        </section>

        {/* Subscription Management */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Subscription
          </h2>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Manage your subscription</p>
              <p className="text-xs text-gray-500 mt-1">
                Update payment method, change plan, or cancel
              </p>
            </div>
            <button
              onClick={async () => {
                setPortalLoading(true)
                try {
                  const res = await fetch('/api/stripe/portal', { method: 'POST' })
                  const data = await res.json()
                  if (data.url) {
                    window.location.href = data.url
                  }
                } catch {
                  // ignore
                } finally {
                  setPortalLoading(false)
                }
              }}
              disabled={portalLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all disabled:opacity-50 shrink-0"
            >
              {portalLoading ? 'Loading...' : 'Manage'}
            </button>
          </div>
        </section>

        {/* Scheduled & Past Posts */}
        <section>
          <PostHistory />
        </section>
      </main>
    </div>
  )
}
