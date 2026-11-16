'use client'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps?: number
}

const STEP_LABELS = ['Register', 'Profile', 'Plan', 'Connect']

export default function OnboardingProgress({ currentStep, totalSteps = 4 }: OnboardingProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentStep ? 'bg-brand-500' : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={`text-xs transition-colors ${
              i < currentStep
                ? 'text-brand-400 font-medium'
                : i === currentStep - 1
                ? 'text-white font-medium'
                : 'text-gray-600'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
