import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { createScheduledPost, getUserScheduledPosts } from '@/lib/supabase/scheduled-posts'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const posts = await getUserScheduledPosts(user.id, status)
    return NextResponse.json({ posts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const VALID_PLATFORMS = ['x', 'threads', 'linkedin']
const VALID_FORMATS = ['single', 'thread']

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { platform, format, content } = body

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid or missing platform' }, { status: 400 })
    }
    if (!format || !VALID_FORMATS.includes(format)) {
      return NextResponse.json({ error: 'Invalid or missing format' }, { status: 400 })
    }
    if (!content?.tweets || !Array.isArray(content.tweets) || content.tweets.length === 0) {
      return NextResponse.json({ error: 'content.tweets must be a non-empty array' }, { status: 400 })
    }

    const post = await createScheduledPost(user.id, body)
    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
