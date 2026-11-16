import type { PricingPlan, UsageLimits } from './types'
import { getUserProfile } from './supabase/user-profile'
import { createClient } from './supabase/server'

const PLAN_LIMITS: Record<PricingPlan, UsageLimits> = {
  starter: {
    articlesPerMonth: 15,
    chatMessagesPerMonth: 50,
    socialAccounts: 3,
    users: 1,
  },
  plus: {
    articlesPerMonth: 50,
    chatMessagesPerMonth: 200,
    socialAccounts: 10,
    users: 3,
  },
  pro: {
    articlesPerMonth: 200,
    chatMessagesPerMonth: -1, // unlimited (soft cap)
    socialAccounts: -1, // unlimited
    users: -1, // unlimited
  },
}

export function getUsageLimits(plan: PricingPlan): UsageLimits {
  return PLAN_LIMITS[plan]
}

export interface UsageCheckResult {
  allowed: boolean
  used: number
  limit: number
  plan: PricingPlan
}

export async function checkArticleLimit(userId: string): Promise<UsageCheckResult> {
  const profile = await getUserProfile(userId)
  if (!profile) {
    return { allowed: false, used: 0, limit: 0, plan: 'starter' }
  }

  const limits = getUsageLimits(profile.selected_plan)
  return {
    allowed: profile.articles_used < limits.articlesPerMonth,
    used: profile.articles_used,
    limit: limits.articlesPerMonth,
    plan: profile.selected_plan,
  }
}

export async function checkChatLimit(userId: string): Promise<UsageCheckResult> {
  const profile = await getUserProfile(userId)
  if (!profile) {
    return { allowed: false, used: 0, limit: 0, plan: 'starter' }
  }

  const limits = getUsageLimits(profile.selected_plan)
  // -1 means unlimited
  if (limits.chatMessagesPerMonth === -1) {
    return {
      allowed: true,
      used: profile.chat_messages_used,
      limit: -1,
      plan: profile.selected_plan,
    }
  }

  return {
    allowed: profile.chat_messages_used < limits.chatMessagesPerMonth,
    used: profile.chat_messages_used,
    limit: limits.chatMessagesPerMonth,
    plan: profile.selected_plan,
  }
}

export async function incrementArticleUsage(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('increment_articles_used', { user_id: userId })
  if (error) {
    // Fallback to manual increment if RPC not available
    const profile = await getUserProfile(userId)
    if (!profile) return
    await supabase
      .from('user_profiles')
      .update({ articles_used: profile.articles_used + 1 })
      .eq('id', userId)
  }
}

export async function incrementChatUsage(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('increment_chat_messages_used', { user_id: userId })
  if (error) {
    // Fallback to manual increment if RPC not available
    const profile = await getUserProfile(userId)
    if (!profile) return
    await supabase
      .from('user_profiles')
      .update({ chat_messages_used: profile.chat_messages_used + 1 })
      .eq('id', userId)
  }
}
