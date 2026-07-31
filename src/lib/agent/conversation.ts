import { AgentMessage } from '../types';
import { createClient } from '../supabase/server';

const MAX_MESSAGES = 20;

export async function getOrCreateSession(
  sessionId: string,
  userId: string
): Promise<{ id: string; messages: AgentMessage[] }> {
  const supabase = createClient();
  const { data } = await supabase
    .from('agent_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (data) {
    return { id: data.id, messages: (data.messages as AgentMessage[]) ?? [] };
  }

  const { data: newSession, error } = await supabase
    .from('agent_sessions')
    .insert({ id: sessionId, user_id: userId, messages: [] })
    .select()
    .single();

  if (error) throw error;
  return { id: newSession.id, messages: [] };
}

export async function addMessage(
  sessionId: string,
  userId: string,
  message: AgentMessage
): Promise<void> {
  const session = await getOrCreateSession(sessionId, userId);
  const messages = [...session.messages, message].slice(-MAX_MESSAGES);

  const supabase = createClient();
  const { error } = await supabase
    .from('agent_sessions')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getMessages(
  sessionId: string,
  userId: string
): Promise<AgentMessage[]> {
  const session = await getOrCreateSession(sessionId, userId);
  return session.messages;
}

export async function toClaudeMessages(
  sessionId: string,
  userId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const messages = await getMessages(sessionId, userId);
  return messages.map((m) => ({
    role: m.role,
    content: m.text + (m.generatedContent ? '\n\n[Generated content attached]' : ''),
  }));
}
