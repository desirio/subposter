import { NextRequest, NextResponse } from 'next/server';
import { postSingleTweet, postThread } from '@/lib/twitter';
import { PostTweetRequest } from '@/lib/types';
import { getAuthenticatedUser, getUserPlatformTokens, unauthorizedResponse, notConnectedResponse } from '@/lib/auth-helpers';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  const tokens = await getUserPlatformTokens(user.id, 'x');
  return NextResponse.json({ configured: !!tokens });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const tokens = await getUserPlatformTokens(user.id, 'x');
  if (!tokens) return notConnectedResponse('X');

  try {
    const body: PostTweetRequest = await request.json();
    const { tweets, format } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const creds = { accessToken: tokens.accessToken };
    const result = format === 'single'
      ? await postSingleTweet(tweets[0], creds)
      : await postThread(tweets, creds);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post tweet';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
