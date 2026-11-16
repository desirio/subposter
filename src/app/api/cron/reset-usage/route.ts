import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const isAuthed = authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('reset_usage_counters')

    if (error) {
      // Fallback: manual reset if RPC not available
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          articles_used: 0,
          chat_messages_used: 0,
          usage_reset_at: new Date().toISOString(),
        })
        .lt('usage_reset_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .select('id')

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        reset_count: updated?.length ?? 0,
        method: 'fallback',
      })
    }

    return NextResponse.json({
      success: true,
      reset_count: data ?? 0,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reset usage' },
      { status: 500 }
    )
  }
}
