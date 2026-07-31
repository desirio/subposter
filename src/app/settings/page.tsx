'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

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
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
              &larr; Back
            </Link>
            <h1 className="text-lg font-bold text-white">Settings</h1>
          </div>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Status messages */}
        {connected && (
          <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg text-sm text-green-300">
            Successfully connected {connected === 'x' ? 'X (Twitter)' : connected === 'threads' ? 'Threads' : 'LinkedIn'}.
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
            Failed to connect. Please try again.
          </div>
        )}

        {/* Connected Accounts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
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
                          platformConnected ? 'bg-green-500' : 'bg-gray-600'
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
                        className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-800 rounded-lg hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                      >
                        {disconnecting === platform.key ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <a
                        href={platform.connectUrl}
                        className="px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-800 rounded-lg hover:bg-blue-900/30 transition-colors inline-block"
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
      </main>
    </div>
  )
}
