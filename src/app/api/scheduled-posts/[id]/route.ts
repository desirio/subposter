import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { updateScheduledPost, deleteScheduledPost } from '@/lib/supabase/scheduled-posts'

const ALLOWED_PATCH_FIELDS = ['status', 'scheduled_at', 'content']
const VALID_STATUSES = ['draft', 'scheduled']

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()

    // Only allow safe fields to be updated by the client
    const updates: Record<string, unknown> = {}
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.status && !VALID_STATUSES.includes(updates.status as string)) {
      return NextResponse.json({ error: 'Invalid status. Allowed: draft, scheduled' }, { status: 400 })
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const post = await updateScheduledPost(user.id, params.id, updates)
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
