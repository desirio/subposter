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
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Context bar */}
      {selectedPost && (
        <div className="flex items-center justify-between px-3 py-2 mb-3 bg-blue-950/40 border border-blue-800/50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-400">Context article</p>
            <p className="text-sm text-gray-200 truncate">{selectedPost.title}</p>
          </div>
          <button
            onClick={() => onSelectPost(null)}
            className="ml-2 text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            x
          </button>
        </div>
      )}

      {/* Platform selector + Queue toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1 p-1 bg-gray-900 border border-gray-700 rounded-lg">
          {(['x', 'threads', 'linkedin'] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activePlatform === platform
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {platform === 'x' ? 'X' : platform === 'threads' ? 'Threads' : 'LinkedIn'}
            </button>
          ))}
        </div>
        {queueItems.length > 0 && (
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="px-3 py-1 text-xs font-medium bg-green-900/50 border border-green-700/50 text-green-400 rounded-lg hover:bg-green-900/70 transition-colors"
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
      <div className="flex-1 overflow-y-auto mb-3 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-3xl mb-3">SubAgent</div>
            <p className="text-gray-400 text-sm mb-6">
              Your AI content strategist. Ask me to repurpose articles, analyze your voice, plan campaigns, or suggest content ideas.
            </p>
            {/* Skill starter chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SKILL_STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.prompt)}
                  className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-colors"
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
              className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2'
                  : 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3'
              }`}
            >
              {/* Conversational text */}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Generated content inline */}
              {msg.generatedContent?.map((gc) => (
                <div key={gc.id} className="mt-3 space-y-3">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
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
                            className="px-3 py-1 text-xs bg-green-900/50 border border-green-700/50 text-green-400 rounded-lg hover:bg-green-900/70 transition-colors"
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
            <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
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
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
