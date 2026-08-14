import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { updateScheduledPost, deleteScheduledPost } from '@/lib/supabase/scheduled-posts'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const post = await updateScheduledPost(user.id, params.id, body)
    return NextResponse.json({ post })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    await deleteScheduledPost(user.id, params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
