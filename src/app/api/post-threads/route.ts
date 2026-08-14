import { NextRequest, NextResponse } from 'next/server';
import { postSingleThreadsPost, postThreadsThread } from '@/lib/threads';
import { PostThreadsRequest } from '@/lib/types';
import { getAuthenticatedUser, getUserPlatformTokens, unauthorizedResponse, notConnectedResponse } from '@/lib/auth-helpers';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  const tokens = await getUserPlatformTokens(user.id, 'threads');
  return NextResponse.json({ configured: !!tokens });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const tokens = await getUserPlatformTokens(user.id, 'threads');
  if (!tokens) return notConnectedResponse('Threads');

  try {
    const body: PostThreadsRequest = await request.json();
    const { tweets, format } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const creds = { accessToken: tokens.accessToken, userId: tokens.platformUserId! };
    const result = format === 'single'
      ? await postSingleThreadsPost(tweets[0], creds)
      : await postThreadsThread(tweets, creds);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post to Threads';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
