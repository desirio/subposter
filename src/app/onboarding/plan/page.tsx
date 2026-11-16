'use client'

import { useState } from 'react'
import OnboardingProgress from '@/components/OnboardingProgress'
import PricingCard from '@/components/PricingCard'
import type { PricingPlan } from '@/lib/types'

const PLANS = [
  {
    plan: 'starter' as PricingPlan,
    name: 'Starter',
    subtitle: 'For creators getting started',
    monthlyPrice: 12.50,
    annualPrice: 10.25,
    features: [
      { text: '15 article repurposes/month' },
      { text: '50 agent chat messages/month' },
      { text: '3 social accounts' },
      { text: '1 user' },
    ],
  },
  {
    plan: 'plus' as PricingPlan,
    name: 'Plus',
    subtitle: 'For growing newsletters',
    monthlyPrice: 28,
    annualPrice: 22.40,
    recommended: true,
    features: [
      { text: '50 article repurposes/month' },
      { text: '200 agent chat messages/month' },
      { text: '10 social accounts' },
      { text: 'Analytics dashboard' },
      { text: 'Priority support' },
      { text: '3 users' },
    ],
  },
  {
    plan: 'pro' as PricingPlan,
    name: 'Pro',
    subtitle: 'For teams and agencies',
    monthlyPrice: 80,
    annualPrice: 62,
    features: [
      { text: '200 article repurposes/month' },
      { text: 'Unlimited agent chat messages' },
      { text: 'Unlimited social accounts' },
      { text: 'Custom AI voice training' },
      { text: 'Dedicated support' },
      { text: 'Unlimited users' },
    ],
  },
]

export default function OnboardingPlanPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelectPlan(plan: PricingPlan) {
    setError('')
    setLoading(true)

    try {
      // Save plan selection to profile
      const saveRes = await fetch('/api/onboarding/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_plan: plan,
          billing_interval: isAnnual ? 'annual' : 'monthly',
        }),
      })

      if (!saveRes.ok) {
        const data = await saveRes.json()
        throw new Error(data.error || 'Failed to save plan selection')
      }

      // Redirect to Stripe Checkout
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval: isAnnual ? 'annual' : 'monthly',
        }),
      })

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json()
        throw new Error(data.error || 'Failed to start checkout')
      }

      const { url } = await checkoutRes.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <OnboardingProgress currentStep={3} />

      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-white">Choose your plan</h2>
        <p className="text-gray-400 mt-2">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${!isAnnual ? 'text-white font-medium' : 'text-gray-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isAnnual ? 'bg-brand-500' : 'bg-gray-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              isAnnual ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm ${isAnnual ? 'text-white font-medium' : 'text-gray-500'}`}>
          Annual
        </span>
        {isAnnual && (
          <span className="text-xs bg-brand-950 text-brand-400 px-2.5 py-0.5 rounded-full font-medium">
            Save up to 22%
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((p) => (
          <PricingCard
            key={p.plan}
            plan={p.plan}
            name={p.name}
            subtitle={p.subtitle}
            monthlyPrice={p.monthlyPrice}
            annualPrice={p.annualPrice}
            isAnnual={isAnnual}
            features={p.features}
            recommended={p.recommended}
            onSelect={handleSelectPlan}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}
