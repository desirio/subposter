import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { authLimiter, apiLimiter, AUTH_WINDOW, API_WINDOW } from '@/lib/rate-limit'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/api/cron/', '/api/health', '/api/webhooks/stripe']
const ONBOARDING_ROUTES = ['/onboarding/profile', '/onboarding/plan', '/onboarding/connect']

const ONBOARDING_STEP_ROUTES: Record<number, string> = {
  1: '/onboarding/profile',
  2: '/onboarding/profile',
  3: '/onboarding/plan',
  4: '/onboarding/connect',
}

// Rate limit configuration: [limiter, limit, windowMs]
const AUTH_RATE_LIMITS: Array<{ pattern: string; limit: number }> = [
  { pattern: '/login', limit: 20 },
  { pattern: '/register', limit: 20 },
  { pattern: '/forgot-password', limit: 20 },
  { pattern: '/reset-password', limit: 20 },
  { pattern: '/api/auth/', limit: 15 },
  { pattern: '/api/onboarding/', limit: 15 },
]

const API_RATE_LIMITS: Array<{ pattern: string; limit: number }> = [
  { pattern: '/api/generate', limit: 10 },
  { pattern: '/api/agent/chat', limit: 20 },
  { pattern: '/api/post-', limit: 10 },
]

const DEFAULT_API_LIMIT = 60

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || '127.0.0.1'
}

function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(retryAfter, 1)) },
    }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = getClientIp(request)

  // --- Rate limiting for public/auth routes (IP-based, before auth) ---
  for (const rule of AUTH_RATE_LIMITS) {
    if (pathname.startsWith(rule.pattern)) {
      const result = authLimiter.check(`ip:${clientIp}:${rule.pattern}`, rule.limit, AUTH_WINDOW)
      if (!result.allowed) {
        return rateLimitResponse(result.resetAt)
      }
      break
    }
  }

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // --- Rate limiting for authenticated API routes (user-based) ---
  if (pathname.startsWith('/api/')) {
    let matched = false
    for (const rule of API_RATE_LIMITS) {
      if (pathname.startsWith(rule.pattern)) {
        const result = apiLimiter.check(`user:${user.id}:${rule.pattern}`, rule.limit, API_WINDOW)
        if (!result.allowed) {
          return rateLimitResponse(result.resetAt)
        }
        matched = true
        break
      }
    }
    if (!matched) {
      const result = apiLimiter.check(`user:${user.id}:api`, DEFAULT_API_LIMIT, API_WINDOW)
      if (!result.allowed) {
        return rateLimitResponse(result.resetAt)
      }
    }
    return response
  }

  const isOnboardingRoute = ONBOARDING_ROUTES.some((route) => pathname.startsWith(route))

  // Use a cookie flag to skip the profile DB query for users who already completed onboarding
  const onboardingDone = request.cookies.get('onboarding_done')?.value === '1'

  if (onboardingDone && !isOnboardingRoute) {
    return response
  }

  // Query profile only when needed: during onboarding or first visit after completion
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, onboarding_step')
    .eq('id', user.id)
    .single()

  const onboardingCompleted = profile?.onboarding_completed ?? false
  const onboardingStep = profile?.onboarding_step ?? 1

  // Set the cookie flag once onboarding is confirmed complete
  if (onboardingCompleted && !onboardingDone) {
    response.cookies.set('onboarding_done', '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  }

  // Completed user hitting onboarding routes → redirect to dashboard
  if (onboardingCompleted && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Incomplete user hitting non-onboarding protected routes → redirect to onboarding
  if (!onboardingCompleted && !isOnboardingRoute) {
    const targetRoute = ONBOARDING_STEP_ROUTES[onboardingStep] || '/onboarding/profile'
    return NextResponse.redirect(new URL(targetRoute, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
