import { NextRequest, NextResponse } from 'next/server';
import { isTwitterConfigured, postSingleTweet, postThread } from '@/lib/twitter';
import { PostTweetRequest } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ configured: isTwitterConfigured });
}

export async function POST(request: NextRequest) {
  if (!isTwitterConfigured) {
    return NextResponse.json(
      { success: false, error: 'X API not configured' },
      { status: 503 }
    );
  }

  try {
    const body: PostTweetRequest = await request.json();
    const { tweets, format } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const result = format === 'single'
      ? await postSingleTweet(tweets[0])
      : await postThread(tweets);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post tweet';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
