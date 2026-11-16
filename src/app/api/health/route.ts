import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const checks: Record<string, { status: string; latency_ms?: number; error?: string }> = {}

  // Database check
  const dbStart = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('user_profiles').select('id').limit(1)
    checks.database = error
      ? { status: 'unhealthy', error: error.message, latency_ms: Date.now() - dbStart }
      : { status: 'healthy', latency_ms: Date.now() - dbStart }
  } catch (err) {
    checks.database = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error',
      latency_ms: Date.now() - dbStart,
    }
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy')

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
