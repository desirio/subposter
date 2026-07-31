import { NextRequest, NextResponse } from 'next/server';
import { fetchSubstackPosts } from '@/lib/substack';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  try {
    const posts = await fetchSubstackPosts(url);
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
