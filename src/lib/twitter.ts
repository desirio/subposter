import { TwitterApi } from 'twitter-api-v2';
import { PostTweetResponse } from './types';

const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env;

export const isTwitterConfigured = Boolean(
  TWITTER_API_KEY &&
  TWITTER_API_SECRET &&
  TWITTER_ACCESS_TOKEN &&
  TWITTER_ACCESS_TOKEN_SECRET
);

function createClient(): TwitterApi {
  return new TwitterApi({
    appKey: TWITTER_API_KEY!,
    appSecret: TWITTER_API_SECRET!,
    accessToken: TWITTER_ACCESS_TOKEN!,
    accessSecret: TWITTER_ACCESS_TOKEN_SECRET!,
  });
}

export async function postSingleTweet(text: string): Promise<PostTweetResponse> {
  if (!isTwitterConfigured) {
    return { success: false, error: 'X API not configured' };
  }
  try {
    const client = createClient();
    const result = await client.v2.tweet(text);
    return { success: true, tweetId: result.data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function postThread(tweets: string[]): Promise<PostTweetResponse> {
  if (!isTwitterConfigured) {
    return { success: false, error: 'X API not configured' };
  }
  try {
    const client = createClient();
    let previousId: string | undefined;
    let firstId: string | undefined;

    for (const text of tweets) {
      const payload = previousId
        ? { text, reply: { in_reply_to_tweet_id: previousId } }
        : { text };
      const result = await client.v2.tweet(payload);
      if (!firstId) firstId = result.data.id;
      previousId = result.data.id;
    }

    return { success: true, tweetId: firstId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
