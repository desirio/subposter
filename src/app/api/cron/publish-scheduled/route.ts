import { NextRequest, NextResponse } from 'next/server'
import { getPostsDueForPublishing } from '@/lib/supabase/scheduled-posts'
import { getDecryptedTokens } from '@/lib/supabase/social-tokens'
import { postSingleTweet, postThread } from '@/lib/twitter'
import { postSingleThreadsPost, postThreadsThread } from '@/lib/threads'
import { postToLinkedIn } from '@/lib/linkedin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const posts = await getPostsDueForPublishing()
    const supabase = createAdminClient()
    let published = 0
    let failed = 0

    for (const post of posts) {
      try {
        const tokens = await getDecryptedTokens(post.user_id, post.platform)
        if (!tokens) {
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'failed',
              error_message: `${post.platform} not connected`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id)
          failed++
          continue
        }

        const tweets = post.content.tweets
        let result: { success: boolean; error?: string; tweetId?: string; threadId?: string; postId?: string }

        switch (post.platform) {
          case 'x': {
            const creds = { accessToken: tokens.accessToken }
            result = post.format === 'thread'
              ? await postThread(tweets, creds)
              : await postSingleTweet(tweets[0], creds)
            break
          }
          case 'threads': {
            const creds = { accessToken: tokens.accessToken, userId: tokens.platformUserId! }
            result = post.format === 'thread'
              ? await postThreadsThread(tweets, creds)
              : await postSingleThreadsPost(tweets[0], creds)
            break
          }
          case 'linkedin': {
            const creds = { accessToken: tokens.accessToken, personUrn: tokens.platformUserId! }
            result = await postToLinkedIn(tweets[0], creds)
            break
          }
          default:
            result = { success: false, error: `Unknown platform: ${post.platform}` }
        }

        if (result.success) {
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'posted',
              posted_at: new Date().toISOString(),
              platform_post_id: result.tweetId ?? result.threadId ?? result.postId ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id)
          published++
        } else {
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'failed',
              error_message: result.error ?? 'Unknown error',
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id)
          failed++
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)
        failed++
      }
    }

    return NextResponse.json({ processed: posts.length, published, failed })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron job failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
