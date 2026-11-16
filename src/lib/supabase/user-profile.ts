import { createClient } from './server'
import type { UserProfile, PricingPlan, BillingInterval, OnboardingStep } from '../types'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export async function createUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ id: userId })
    .select()
    .single()

  if (error) throw new Error(`Failed to create user profile: ${error.message}`)
  return data as UserProfile
}

export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const existing = await getUserProfile(userId)
  if (existing) return existing
  return createUserProfile(userId)
}

export async function updateUserProfile(
  userId: string,
  updates: {
    display_name?: string | null
    substack_url?: string | null
    content_focus?: string | null
    selected_plan?: PricingPlan
    billing_interval?: BillingInterval
    onboarding_completed?: boolean
    onboarding_step?: OnboardingStep
    stripe_customer_id?: string | null
    stripe_subscription_id?: string | null
  }
): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update user profile: ${error.message}`)
  return data as UserProfile
}

export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.onboarding_completed ?? false
}
