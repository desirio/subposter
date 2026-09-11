import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './supabase/admin';
import {
  claimDuePosts,
  completePublishing,
  failStalePublishingPosts,
  ScheduledPost,
} from './supabase/scheduled-posts';
import { getValidLinkedInToken, getValidThreadsToken, getValidXToken } from './token-refresh';
import { postSingleTweet, postThread } from './twitter';
import { postSingleThreadsPost, postThreadsThread } from './threads';
import { postToLinkedIn } from './linkedin';

type PublishResult = { success: true; platformPostId?: string } | { success: false; error: string };

export interface PublishRunSummary {
  processed: number;
  published: number;
  failed: number;
  interrupted: number;
}

const PLATFORM_LABELS: Record<string, string> = { x: 'X', threads: 'Threads', linkedin: 'LinkedIn' };

function notConnected(platform: string): PublishResult {
  return {
    success: false,
    error: `${PLATFORM_LABELS[platform]} is not connected or its login has expired. Reconnect it in Settings.`,
  };
}

function toResult(
  res: { success: boolean; error?: string },
  platformPostId: string | undefined
): PublishResult {
  return res.success
    ? { success: true, platformPostId }
    : { success: false, error: res.error ?? 'Unknown error' };
}

async function publishPost(post: ScheduledPost, supabase: SupabaseClient): Promise<PublishResult> {
  const tweets = post.content?.tweets ?? [];
  if (tweets.length === 0) return { success: false, error: 'Post has no content' };

  switch (post.platform) {
    case 'x': {
      const accessToken = await getValidXToken(post.user_id, supabase);
      if (!accessToken) return notConnected('x');
      const res = post.format === 'thread'
        ? await postThread(tweets, { accessToken })
        : await postSingleTweet(tweets[0], { accessToken });
      return toResult(res, res.tweetId);
    }
    case 'threads': {
      const creds = await getValidThreadsToken(post.user_id, supabase);
      if (!creds) return notConnected('threads');
      const res = post.format === 'thread'
        ? await postThreadsThread(tweets, creds)
        : await postSingleThreadsPost(tweets[0], creds);
      return toResult(res, res.threadId);
    }
    case 'linkedin': {
      const creds = await getValidLinkedInToken(post.user_id, supabase);
      if (!creds) return notConnected('linkedin');
      const res = await postToLinkedIn(tweets[0], creds);
      return toResult(res, res.postId);
    }
    default:
      return { success: false, error: `Unknown platform: ${post.platform}` };
  }
}

/**
 * Publish every scheduled post that is due. Runs without a user session, so
 * all token reads and writes go through the admin client.
 */
export async function publishDuePosts(): Promise<PublishRunSummary> {
  const interrupted = await failStalePublishingPosts();
  const posts = await claimDuePosts();
  const supabase = createAdminClient();
  let published = 0;
  let failed = 0;

  for (const post of posts) {
    let result: PublishResult;
    try {
      result = await publishPost(post, supabase);
    } catch (err) {
      result = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    if (result.success) published++;
    else failed++;

    try {
      await completePublishing(post.id, result);
    } catch (err) {
      // Left in 'publishing'; the stale sweep marks it failed on a later run
      console.error(`Failed to record publish result for post ${post.id}:`, err);
    }
  }

  return { processed: posts.length, published, failed, interrupted };
}
