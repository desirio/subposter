import { NextRequest, NextResponse } from 'next/server';
import { isLinkedInConfigured, postToLinkedIn } from '@/lib/linkedin';
import { PostLinkedInRequest } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ configured: isLinkedInConfigured });
}

export async function POST(request: NextRequest) {
  if (!isLinkedInConfigured) {
    return NextResponse.json(
      { success: false, error: 'LinkedIn API not configured' },
      { status: 503 }
    );
  }

  try {
    const body: PostLinkedInRequest = await request.json();
    const { tweets } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const result = await postToLinkedIn(tweets[0]);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post to LinkedIn';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
