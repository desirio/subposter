import { NextRequest, NextResponse } from 'next/server';
import { generateTweetVariants } from '@/lib/claude';
import { GenerateRequest } from '@/lib/types';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers';
import { checkArticleLimit, incrementArticleUsage } from '@/lib/usage';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const usageCheck = await checkArticleLimit(user.id);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: `You've used all ${usageCheck.limit} article repurposes this month. Upgrade your plan for more.`,
        upgrade_url: '/settings/billing',
        used: usageCheck.used,
        limit: usageCheck.limit,
      },
      { status: 429 }
    );
  }

  try {
    const body: GenerateRequest = await request.json();
    const { post, formats, tone, includeLink } = body;

    if (!post || !formats || !tone) {
      return NextResponse.json({ error: 'post, formats, and tone are required' }, { status: 400 });
    }

    const variants = await generateTweetVariants(post, formats, tone, includeLink ?? true);

    await incrementArticleUsage(user.id);

    return NextResponse.json({ variants });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate variants';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
