import { TwitterApi } from 'twitter-api-v2';
import { PostTweetResponse } from './types';

export interface TwitterCredentials {
  accessToken: string;
}

function createClientWithToken(creds: TwitterCredentials): TwitterApi {
  return new TwitterApi(creds.accessToken);
}

export async function postSingleTweet(
  text: string,
  creds: TwitterCredentials
): Promise<PostTweetResponse> {
  try {
    const client = createClientWithToken(creds);
    const result = await client.v2.tweet(text);
    return { success: true, tweetId: result.data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function postThread(
  tweets: string[],
  creds: TwitterCredentials
): Promise<PostTweetResponse> {
  try {
    const client = createClientWithToken(creds);
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
