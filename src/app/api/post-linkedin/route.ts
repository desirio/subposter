import { NextRequest, NextResponse } from 'next/server';
import { postToLinkedIn } from '@/lib/linkedin';
import { PostLinkedInRequest } from '@/lib/types';
import { getAuthenticatedUser, unauthorizedResponse, notConnectedResponse } from '@/lib/auth-helpers';
import { getValidLinkedInToken } from '@/lib/token-refresh';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();
  const tokens = await getValidLinkedInToken(user.id);
  return NextResponse.json({ configured: !!tokens });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const tokens = await getValidLinkedInToken(user.id);
  if (!tokens) return notConnectedResponse('LinkedIn');

  try {
    const body: PostLinkedInRequest = await request.json();
    const { tweets } = body;

    if (!tweets || !tweets.length) {
      return NextResponse.json({ error: 'tweets array is required' }, { status: 400 });
    }

    const creds = { accessToken: tokens.accessToken, personUrn: tokens.personUrn };
    const result = await postToLinkedIn(tweets[0], creds);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to post to LinkedIn';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
