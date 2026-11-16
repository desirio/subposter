import { NextRequest, NextResponse } from 'next/server';
import { postSingleThreadsPost, postThreadsThread } from '@/lib/threads';
import { PostThreadsRequest } from '@/lib/types';
import { getAuthenticatedUser, unauthorizedResponse, notConnectedResponse } from '@/lib/auth-helpers';
import { getValidThreadsToken } from '@/lib/token-refresh';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  const tokens = await getValidThreadsToken(user.id);
  return NextResponse.json({ configured: !!tokens });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const tokens = await getValidThreadsToken(user.id);
  if (!tokens) return notConnectedResponse('Threads');

  try {
    const body: PostThreadsRequest = await request.json();
    const { tweets, format } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const creds = { accessToken: tokens.accessToken, userId: tokens.userId };
    const result = format === 'single'
      ? await postSingleThreadsPost(tweets[0], creds)
      : await postThreadsThread(tweets, creds);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post to Threads';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
