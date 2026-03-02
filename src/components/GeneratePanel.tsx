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
  const [activePlatform, setActivePlatform] = useState<'x' | 'threads'>('x');
  const [isThreadsConfigured, setIsThreadsConfigured] = useState(false);

  useEffect(() => {
    fetch('/api/post-tweet')
      .then((r) => r.json())
      .then((data) => setIsTwitterConfigured(data.configured ?? false))
      .catch(() => setIsTwitterConfigured(false));
  }, []);

  useEffect(() => {
    fetch('/api/post-threads')
      .then((r) => r.json())
      .then((data) => setIsThreadsConfigured(data.configured ?? false))
      .catch(() => setIsThreadsConfigured(false));
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
      const endpoint = activePlatform === 'x' ? '/api/post-tweet' : '/api/post-threads';
      const successMessage = activePlatform === 'x' ? 'Successfully posted to X!' : 'Successfully posted to Threads!';
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

  const isConfigured = activePlatform === 'x' ? isTwitterConfigured : isThreadsConfigured;

  const singleVariants = variants.filter((v) => v.format === 'single');
  const threadVariants = variants.filter((v) => v.format === 'thread');

  const filteredVariants =
    activeTab === 'single' ? singleVariants :
    activeTab === 'thread' ? threadVariants :
    variants;

  const canGenerate = selectedPost && formats.length > 0 && !loading;

  if (!selectedPost) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <div className="text-4xl mb-4">✦</div>
        <p className="text-gray-400 text-sm">Select a post from the left to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selected post info */}
      <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
        <p className="text-xs text-gray-400 mb-1">Selected post</p>
        <p className="text-sm font-medium text-gray-200 line-clamp-1">{selectedPost.title}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 p-4 bg-gray-900 border border-gray-700 rounded-lg">
        {/* Format checkboxes */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Format</p>
          <div className="flex gap-4">
            {(['single', 'thread'] as TweetFormat[]).map((fmt) => (
              <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formats.includes(fmt)}
                  onChange={() => toggleFormat(fmt)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300 capitalize">
                  {fmt === 'single' ? 'Single Post' : 'Thread'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tone selector */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Tone</p>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as TweetTone)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Include link toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeLink}
            onChange={(e) => setIncludeLink(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 cursor-pointer"
          />
          <span className="text-sm text-gray-300">Include article link</span>
        </label>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Generating...
            </span>
          ) : (
            'Generate Variants'
          )}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Generate once — then choose to post to X or Threads
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
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
          <div className="flex gap-1 mb-3 p-1 bg-gray-900 border border-gray-700 rounded-lg">
            {(['x', 'threads'] as const).map((platform) => (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activePlatform === platform
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {platform === 'x' ? 'X' : 'Threads'}
              </button>
            ))}
          </div>

          {/* Format Tabs */}
          <div className="flex gap-1 mb-3">
            {(['all', ...(singleVariants.length > 0 ? ['single'] : []), ...(threadVariants.length > 0 ? ['thread'] : [])] as TabValue[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'single' ? 'Single Posts' : 'Threads'}
              </button>
            ))}
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
