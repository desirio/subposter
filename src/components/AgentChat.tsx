'use client';

import { useState, useRef, useEffect } from 'react';
import { SubstackPost, AgentMessage, ContentVariant, TweetFormat } from '@/lib/types';
import TweetPreview from './TweetPreview';
import ThreadPreview from './ThreadPreview';
import StatusBanner from './StatusBanner';
import ContentQueue from './ContentQueue';

interface AgentChatProps {
  selectedPost: SubstackPost | null;
  onSelectPost: (post: SubstackPost | null) => void;
  platformConfig: { x: boolean; threads: boolean; linkedin: boolean };
}

const SKILL_STARTERS: { label: string; prompt: string }[] = [
  { label: 'Repurpose', prompt: 'Turn my selected article into tweets and a thread' },
  { label: 'Brand Voice', prompt: 'Analyze my writing style and voice' },
  { label: 'Timing', prompt: 'When should I post for maximum engagement?' },
  { label: 'Ideas', prompt: 'Give me content ideas based on my recent articles' },
  { label: 'Campaign', prompt: 'Create a promotion campaign for my selected article' },
  { label: 'Engagement', prompt: 'What content resonates most with my audience?' },
];

export default function AgentChat({ selectedPost, onSelectPost, platformConfig }: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<'x' | 'threads' | 'linkedin'>('x');
  const [isPosting, setIsPosting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [queueItems, setQueueItems] = useState<ContentVariant[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          context: {
            selectedPost: selectedPost || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Agent request failed');
      }

      // Add user message to local state
      const userMsg: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: messageText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, data.message]);
      setSessionId(data.sessionId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handlePost(tweets: string[], format: TweetFormat) {
    setIsPosting(true);
    setStatus(null);
    try {
      const endpoint =
        activePlatform === 'x'
          ? '/api/post-tweet'
          : activePlatform === 'threads'
            ? '/api/post-threads'
            : '/api/post-linkedin';
      const platformLabel =
        activePlatform === 'x' ? 'X' : activePlatform === 'threads' ? 'Threads' : 'LinkedIn';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets, format }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: `Posted to ${platformLabel}!` });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to post' });
      }
    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to post' });
    } finally {
      setIsPosting(false);
    }
  }

  function handleApprove(variant: ContentVariant) {
    setQueueItems((prev) => [...prev, { ...variant, status: 'approved' }]);
  }

  function handleRemoveFromQueue(variantId: string) {
    setQueueItems((prev) => prev.filter((v) => v.id !== variantId));
  }

  const isConfigured =
    activePlatform === 'x'
      ? platformConfig.x
      : activePlatform === 'threads'
        ? platformConfig.threads
        : platformConfig.linkedin;

  return (
    <div className="flex flex-col h-full">
      {/* Context bar */}
      {selectedPost && (
        <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-brand-950/30 border border-brand-800/40 rounded-xl">
          <div className="w-1 h-8 bg-brand-500 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-brand-400/80 uppercase tracking-wider font-medium">Context</p>
            <p className="text-sm text-gray-200 truncate">{selectedPost.title}</p>
          </div>
          <button
            onClick={() => onSelectPost(null)}
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md shrink-0"
            aria-label="Remove context"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Platform selector + Queue toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-0.5 p-0.5 bg-gray-900/80 border border-gray-800 rounded-xl">
          {(['x', 'threads', 'linkedin'] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activePlatform === platform
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {platform === 'x' ? 'X' : platform === 'threads' ? 'Threads' : 'LinkedIn'}
            </button>
          ))}
        </div>
        {queueItems.length > 0 && (
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
              showQueue
                ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                : 'bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-green-400'
            }`}
          >
            Queue ({queueItems.length})
          </button>
        )}
      </div>

      {/* Queue panel */}
      {showQueue && queueItems.length > 0 && (
        <div className="mb-3">
          <ContentQueue
            items={queueItems}
            onPost={handlePost}
            onRemove={handleRemoveFromQueue}
            isPosting={isPosting}
            isConfigured={isConfigured}
            platform={activePlatform}
          />
        </div>
      )}

      {status && (
        <div className="mb-3">
          <StatusBanner type={status.type} message={status.message} onDismiss={() => setStatus(null)} />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-4 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-1">Your content strategist</h3>
            <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
              Repurpose articles, refine your voice, plan campaigns, or brainstorm ideas.
            </p>
            {/* Skill starter chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SKILL_STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.prompt)}
                  className="px-3.5 py-2 text-xs bg-gray-900 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 hover:border-gray-700 hover:text-white transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                  : 'bg-gray-900 border border-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-3'
              }`}
            >
              {/* Conversational text */}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Generated content inline */}
              {msg.generatedContent?.map((gc) => (
                <div key={gc.id} className="mt-3 space-y-3">
                  <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Generated from: {gc.skill}
                  </div>
                  {gc.variants.map((variant) => (
                    <div key={variant.id}>
                      {variant.format === 'single' ? (
                        <TweetPreview
                          variant={variant}
                          onPost={handlePost}
                          isPosting={isPosting}
                          isConfigured={isConfigured}
                          platform={activePlatform}
                        />
                      ) : (
                        <ThreadPreview
                          variant={variant}
                          onPost={handlePost}
                          isPosting={isPosting}
                          isConfigured={isConfigured}
                          platform={activePlatform}
                        />
                      )}
                      {variant.status === 'draft' && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleApprove(variant)}
                            className="px-3 py-1.5 text-xs bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-all"
                          >
                            Add to Queue
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 text-gray-400 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the agent anything..."
          rows={1}
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500/60 focus:bg-gray-900/80 resize-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-5 py-3 bg-brand-500 hover:bg-brand-400 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-brand-500/10 disabled:shadow-none"
        >
          <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
}
