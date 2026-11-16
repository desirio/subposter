'use client'

import type { PricingPlan } from '@/lib/types'

interface PricingFeature {
  text: string
}

interface PricingCardProps {
  plan: PricingPlan
  name: string
  subtitle: string
  monthlyPrice: number
  annualPrice: number
  isAnnual: boolean
  features: PricingFeature[]
  recommended?: boolean
  selected?: boolean
  onSelect: (plan: PricingPlan) => void
  loading?: boolean
}

export default function PricingCard({
  plan,
  name,
  subtitle,
  monthlyPrice,
  annualPrice,
  isAnnual,
  features,
  recommended = false,
  selected = false,
  onSelect,
  loading = false,
}: PricingCardProps) {
  const price = isAnnual ? annualPrice : monthlyPrice
  const formattedPrice = Number.isInteger(price) ? `${price}` : price.toFixed(2)
  const interval = isAnnual ? '/mo, billed annually' : '/mo'
  const annualSavings = Math.round((monthlyPrice - annualPrice) * 12)

  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col transition-all ${
        recommended
          ? 'bg-gradient-to-b from-brand-950/80 to-gray-900 border-2 border-brand-500/60 shadow-[0_0_40px_-8px_rgba(249,115,22,0.15)]'
          : selected
          ? 'bg-gray-900 border-2 border-brand-400'
          : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-brand-500 text-white text-xs font-display font-semibold px-3.5 py-1 rounded-full shadow-lg shadow-brand-500/25">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-white">{name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        <div className="mt-4">
          <span className="text-4xl font-display font-bold text-white">${formattedPrice}</span>
          <span className="text-sm text-gray-400 ml-1">{interval}</span>
        </div>
        {isAnnual && (
          <p className="text-xs text-brand-400 mt-1.5 font-medium">
            Save ${annualSavings}/year
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
            <svg
              className={`w-4 h-4 mt-0.5 shrink-0 ${recommended ? 'text-brand-400' : 'text-gray-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature.text}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        disabled={loading}
        className={`w-full py-3.5 px-6 font-display font-semibold rounded-xl transition-all ${
          recommended
            ? 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-400/30'
            : 'bg-gray-800 hover:bg-gray-750 text-white border border-gray-700 hover:border-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Saving...' : 'Start free trial'}
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">7-day free trial · No card required</p>
    </div>
  )
}
