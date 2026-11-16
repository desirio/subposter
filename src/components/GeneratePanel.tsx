'use client';

import { useState, useEffect } from 'react';
import { SubstackPost, TweetFormat, TweetTone, TweetVariant } from '@/lib/types';
import TweetPreview from './TweetPreview';
import ThreadPreview from './ThreadPreview';
import StatusBanner from './StatusBanner';

interface GeneratePanelProps {
  selectedPost: SubstackPost | null;
}

const TONES: { value: TweetTone; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'witty', label: 'Witty' },
  { value: 'inspirational', label: 'Inspirational' },
];

type TabValue = 'all' | 'single' | 'thread';

export default function GeneratePanel({ selectedPost }: GeneratePanelProps) {
  const [formats, setFormats] = useState<TweetFormat[]>(['single']);
  const [tone, setTone] = useState<TweetTone>('casual');
  const [includeLink, setIncludeLink] = useState(true);
  const [variants, setVariants] = useState<TweetVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isPosting, setIsPosting] = useState(false);
  const [isTwitterConfigured, setIsTwitterConfigured] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'x' | 'threads' | 'linkedin'>('x');
  const [isThreadsConfigured, setIsThreadsConfigured] = useState(false);
  const [isLinkedInConfigured, setIsLinkedInConfigured] = useState(false);

  useEffect(() => {
    fetch('/api/connections')
      .then((r) => r.json())
      .then((data) => {
        const connections = data.connections ?? [];
        setIsTwitterConfigured(connections.some((c: { platform: string }) => c.platform === 'x'));
        setIsThreadsConfigured(connections.some((c: { platform: string }) => c.platform === 'threads'));
        setIsLinkedInConfigured(connections.some((c: { platform: string }) => c.platform === 'linkedin'));
      })
      .catch(() => {});
  }, []);

  function toggleFormat(fmt: TweetFormat) {
    setFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  }

  async function handleGenerate() {
    if (!selectedPost) return;
    setLoading(true);
    setError(null);
    setVariants([]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: selectedPost, formats, tone, includeLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setVariants(data.variants);
      setActiveTab('all');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePost(tweets: string[], format: TweetFormat) {
    setIsPosting(true);
    setStatus(null);
    try {
      const endpoint =
        activePlatform === 'x' ? '/api/post-tweet' :
        activePlatform === 'threads' ? '/api/post-threads' :
        '/api/post-linkedin';
      const successMessage =
        activePlatform === 'x' ? 'Successfully posted to X!' :
        activePlatform === 'threads' ? 'Successfully posted to Threads!' :
        'Successfully posted to LinkedIn!';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweets, format }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: successMessage });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to post' });
      }
    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to post' });
    } finally {
      setIsPosting(false);
    }
  }

  const isConfigured =
    activePlatform === 'x' ? isTwitterConfigured :
    activePlatform === 'threads' ? isThreadsConfigured :
    isLinkedInConfigured;

  const singleVariants = variants.filter((v) => v.format === 'single');
  const threadVariants = variants.filter((v) => v.format === 'thread');

  const filteredVariants =
    activeTab === 'single' ? singleVariants :
    activeTab === 'thread' ? threadVariants :
    variants;

  const canGenerate = selectedPost && formats.length > 0 && !loading;

  if (!selectedPost) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 font-medium">Select an article to generate posts</p>
        <p className="text-xs text-gray-600 mt-1">Load your feed on the left, then pick an article</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selected post info */}
      <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl">
        <div className="w-1 h-8 bg-brand-500 rounded-full shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Selected</p>
          <p className="text-sm font-medium text-gray-200 line-clamp-1">{selectedPost.title}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
        {/* Format checkboxes */}
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">Format</p>
          <div className="flex gap-4">
            {(['single', 'thread'] as TweetFormat[]).map((fmt) => (
              <label key={fmt} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formats.includes(fmt)}
                  onChange={() => toggleFormat(fmt)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-brand-500 cursor-pointer focus:ring-brand-500/40 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {fmt === 'single' ? 'Single Post' : 'Thread'}
                </span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5">Thread format is not supported on LinkedIn</p>
        </div>

        {/* Tone selector */}
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">Tone</p>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as TweetTone)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brand-500/60 appearance-none cursor-pointer"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Include link toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={includeLink}
            onChange={(e) => setIncludeLink(e.target.checked)}
            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-brand-500 cursor-pointer focus:ring-brand-500/40 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Include article link</span>
        </label>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-brand-500/10 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Generating...
            </span>
          ) : (
            'Generate Variants'
          )}
        </button>
        <p className="text-[11px] text-gray-600 text-center">
          Generate once — then post to X, Threads, or LinkedIn
        </p>
      </div>

      {error && (
        <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
          {error}
        </div>
      )}

      {status && (
        <StatusBanner
          type={status.type}
          message={status.message}
          onDismiss={() => setStatus(null)}
        />
      )}

      {/* Results */}
      {variants.length > 0 && (
        <div>
          {/* Platform tab switcher */}
          <div className="flex gap-0.5 mb-3 p-0.5 bg-gray-900/80 border border-gray-800 rounded-xl">
            {(['x', 'threads', 'linkedin'] as const).map((platform) => (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  activePlatform === platform
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {platform === 'x' ? 'X' : platform === 'threads' ? 'Threads' : 'LinkedIn'}
              </button>
            ))}
          </div>

          {/* Format Tabs + Regenerate */}
          <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {(['all', ...(singleVariants.length > 0 ? ['single'] : []), ...(threadVariants.length > 0 && activePlatform !== 'linkedin' ? ['thread'] : [])] as TabValue[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'single' ? 'Single Posts' : 'Threads'}
              </button>
            ))}
          </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:bg-gray-800 disabled:opacity-50 rounded-lg transition-all"
            >
              {loading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>

          {/* Variant cards */}
          <div className="flex flex-col gap-3">
            {filteredVariants.map((variant) =>
              variant.format === 'single' ? (
                <TweetPreview
                  key={variant.id}
                  variant={variant}
                  onPost={handlePost}
                  isPosting={isPosting}
                  isConfigured={isConfigured}
                  platform={activePlatform}
                />
              ) : (
                <ThreadPreview
                  key={variant.id}
                  variant={variant}
                  onPost={handlePost}
                  isPosting={isPosting}
                  isConfigured={isConfigured}
                  platform={activePlatform}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
