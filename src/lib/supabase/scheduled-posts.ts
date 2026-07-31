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

export async function getPostsDueForPublishing(): Promise<ScheduledPost[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (error) throw error
  return (data as ScheduledPost[]) ?? []
}
