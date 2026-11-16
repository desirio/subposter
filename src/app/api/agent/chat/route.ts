import { NextRequest, NextResponse } from 'next/server';
import { handleAgentMessage } from '@/lib/agent/core';
import { AgentChatRequest } from '@/lib/types';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers';
import { checkChatLimit, incrementChatUsage } from '@/lib/usage';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const usageCheck = await checkChatLimit(user.id);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: `You've used all ${usageCheck.limit} chat messages this month. Upgrade your plan for more.`,
        upgrade_url: '/settings/billing',
        used: usageCheck.used,
        limit: usageCheck.limit,
      },
      { status: 429 }
    );
  }

  try {
    const body: AgentChatRequest = await request.json();

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const result = await handleAgentMessage(body, user.id);

    await incrementChatUsage(user.id);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
