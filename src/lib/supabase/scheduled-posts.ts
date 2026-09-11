import { createClient } from './server'
import { createAdminClient } from './admin'

export interface CreateScheduledPostInput {
  platform: 'x' | 'threads' | 'linkedin'
  format: 'single' | 'thread'
  content: { tweets: string[] }
  status?: 'draft' | 'scheduled'
  scheduledAt?: string
  sourceArticleTitle?: string
  sourceArticleLink?: string
  skillUsed?: string
}

export interface ScheduledPost {
  id: string
  user_id: string
  platform: string
  format: string
  content: { tweets: string[] }
  status: string
  scheduled_at: string | null
  posted_at: string | null
  error_message: string | null
  source_article_title: string | null
  source_article_link: string | null
  skill_used: string | null
  platform_post_id: string | null
  created_at: string
  updated_at: string
}

export async function createScheduledPost(
  userId: string,
  input: CreateScheduledPostInput
): Promise<ScheduledPost> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({
      user_id: userId,
      platform: input.platform,
      format: input.format,
      content: input.content,
      status: input.status ?? 'draft',
      scheduled_at: input.scheduledAt ?? null,
      source_article_title: input.sourceArticleTitle ?? null,
      source_article_link: input.sourceArticleLink ?? null,
      skill_used: input.skillUsed ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as ScheduledPost
}

export async function getUserScheduledPosts(
  userId: string,
  status?: string
): Promise<ScheduledPost[]> {
  const supabase = createClient()
  let query = supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as ScheduledPost[]) ?? []
}

export async function updateScheduledPost(
  userId: string,
  postId: string,
  updates: Partial<{
    status: string
    scheduled_at: string | null
    content: { tweets: string[] }
    error_message: string | null
    platform_post_id: string | null
    posted_at: string | null
  }>
): Promise<ScheduledPost> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as ScheduledPost
}

export async function deleteScheduledPost(userId: string, postId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) throw error
}

// --- Publishing (cron only: these use the admin client and bypass RLS) ---

const CLAIM_BATCH_SIZE = 25
const STALE_CLAIM_MS = 10 * 60 * 1000

/**
 * Move due posts from 'scheduled' to 'publishing' and return them. The UPDATE
 * re-checks status, so overlapping cron runs can never claim the same post twice.
 */
export async function claimDuePosts(limit = CLAIM_BATCH_SIZE): Promise<ScheduledPost[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: due, error: selectError } = await supabase
    .from('scheduled_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (selectError) throw selectError
  if (!due || due.length === 0) return []

  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'publishing', updated_at: now })
    .in('id', due.map((p: { id: string }) => p.id))
    .eq('status', 'scheduled')
    .select('*')

  if (error) throw error
  return (data as ScheduledPost[]) ?? []
}

export async function completePublishing(
  postId: string,
  result: { success: true; platformPostId?: string } | { success: false; error: string }
) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const updates = result.success
    ? { status: 'posted', posted_at: now, platform_post_id: result.platformPostId ?? null, error_message: null }
    : { status: 'failed', error_message: result.error }

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ ...updates, updated_at: now })
    .eq('id', postId)
    .eq('status', 'publishing')

  if (error) throw error
}

/**
 * A post stuck in 'publishing' means a run died mid-publish. It is marked failed
 * rather than retried, because part of it may already be live.
 */
export async function failStalePublishingPosts(staleAfterMs = STALE_CLAIM_MS): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({
      status: 'failed',
      error_message:
        'Publishing was interrupted. Check the platform before retrying, as part of this post may already be live.',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'publishing')
    .lt('updated_at', new Date(Date.now() - staleAfterMs).toISOString())
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}
