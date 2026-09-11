import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { publishDuePosts } from '@/lib/scheduled-publisher'

// Triggered by Supabase pg_cron (see SETUP_SCHEDULING.md)
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function hasValidSecret(authHeader: string | null, secret: string): boolean {
  if (!authHeader) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(authHeader)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not set; refusing to run the publisher')
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 500 })
  }

  if (!hasValidSecret(request.headers.get('authorization'), cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await publishDuePosts()
    return NextResponse.json(summary)
  } catch (err) {
    console.error('Scheduled publishing failed:', err)
    const message = err instanceof Error ? err.message : 'Cron job failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
