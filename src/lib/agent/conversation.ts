import { AgentMessage } from '../types';

interface ConversationState {
  messages: AgentMessage[];
  createdAt: number;
}

const sessions = new Map<string, ConversationState>();
const MAX_MESSAGES = 20;
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

export function getOrCreateSession(sessionId: string): ConversationState {
  let session = sessions.get(sessionId);
  if (!session) {
    session = { messages: [], createdAt: Date.now() };
    sessions.set(sessionId, session);
  }
  return session;
}

export function addMessage(sessionId: string, message: AgentMessage): void {
  const session = getOrCreateSession(sessionId);
  session.messages.push(message);
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
}

export function getMessages(sessionId: string): AgentMessage[] {
  return getOrCreateSession(sessionId).messages;
}

export function toClaudeMessages(
  sessionId: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return getMessages(sessionId).map((m) => ({
    role: m.role,
    content: m.text + (m.generatedContent ? '\n\n[Generated content attached]' : ''),
  }));
}

// Periodic cleanup of expired sessions
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    sessions.forEach((session, id) => {
      if (now - session.createdAt > SESSION_TTL) sessions.delete(id);
    });
  }, 5 * 60 * 1000);
}
