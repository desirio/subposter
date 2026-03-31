import { NextRequest, NextResponse } from 'next/server';
import { handleAgentMessage } from '@/lib/agent/core';
import { AgentChatRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: AgentChatRequest = await request.json();

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const result = await handleAgentMessage(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
