import { NextRequest, NextResponse } from 'next/server';
import { isThreadsConfigured, postSingleThreadsPost, postThreadsThread } from '@/lib/threads';
import { PostThreadsRequest } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ configured: isThreadsConfigured });
}

export async function POST(request: NextRequest) {
  if (!isThreadsConfigured) {
    return NextResponse.json(
      { success: false, error: 'Threads API not configured' },
      { status: 503 }
    );
  }

  try {
    const body: PostThreadsRequest = await request.json();
    const { tweets, format } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const result = format === 'single'
      ? await postSingleThreadsPost(tweets[0])
      : await postThreadsThread(tweets);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post to Threads';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
