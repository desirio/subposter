'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingProgress from '@/components/OnboardingProgress'

const CONTENT_FOCUS_OPTIONS = [
  'Tech & Software',
  'Business & Finance',
  'Lifestyle & Wellness',
  'Science & Research',
  'Politics & Culture',
  'Creative Writing',
  'Education',
  'Other',
]

export default function OnboardingProfilePage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [substackUrl, setSubstackUrl] = useState('')
  const [contentFocus, setContentFocus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName || null,
          substack_url: substackUrl || null,
          content_focus: contentFocus || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      router.push('/onboarding/plan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSkip() {
    router.push('/onboarding/plan')
  }

  return (
    <div className="space-y-8">
      <OnboardingProgress currentStep={2} />

      <div>
        <h2 className="text-3xl font-display font-bold text-white">Tell us about yourself</h2>
        <p className="text-gray-400 mt-2">
          This helps us personalize your content generation. You can always update this later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1.5">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="substackUrl" className="block text-sm font-medium text-gray-300 mb-1.5">
            Substack URL
          </label>
          <input
            id="substackUrl"
            type="url"
            value={substackUrl}
            onChange={(e) => setSubstackUrl(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-colors"
            placeholder="https://yourname.substack.com"
          />
          <p className="text-xs text-gray-600 mt-1.5">We&apos;ll use this to pull your content automatically</p>
        </div>

        <div>
          <label htmlFor="contentFocus" className="block text-sm font-medium text-gray-300 mb-1.5">
            Content focus
          </label>
          <select
            id="contentFocus"
            value={contentFocus}
            onChange={(e) => setContentFocus(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-colors appearance-none"
          >
            <option value="">Select a category</option>
            {CONTENT_FOCUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-brand-500 hover:bg-brand-400 disabled:bg-brand-800 disabled:cursor-not-allowed text-white font-display font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/10 hover:shadow-brand-400/20"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
