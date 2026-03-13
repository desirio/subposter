'use client';

import { useState } from 'react';
import { TweetFormat, TweetVariant } from '@/lib/types';

interface ThreadPreviewProps {
  variant: TweetVariant;
  onPost: (tweets: string[], format: TweetFormat) => Promise<void>;
  isPosting: boolean;
  isConfigured: boolean;
  platform: 'x' | 'threads' | 'linkedin';
}

export default function ThreadPreview({ variant, onPost, isPosting, isConfigured, platform }: ThreadPreviewProps) {
  const [texts, setTexts] = useState<string[]>(variant.tweets);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewCount = expanded ? texts.length : Math.min(2, texts.length);
  const hasOverLimit = texts.some((t) => t.length > 280);

  function updateTweet(index: number, value: string) {
    setTexts((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  async function handleCopyAll() {
    const text = texts.map((t, i) => `${i + 1}/${texts.length} ${t}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePost() {
    await onPost(texts, 'thread');
  }

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-400">{variant.label}</div>
        <div className="text-xs text-gray-500">Thread ({texts.length} posts)</div>
      </div>

      <div className="flex flex-col gap-3">
        {texts.slice(0, previewCount).map((tweet, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-mono flex-shrink-0">
                {i + 1}
              </div>
              {i < previewCount - 1 && <div className="w-px flex-1 bg-gray-700 mt-1" />}
            </div>
            <div className="flex-1 pb-1">
              <textarea
                value={tweet}
                onChange={(e) => updateTweet(i, e.target.value)}
                rows={3}
                className="w-full bg-gray-800 text-gray-100 text-sm font-mono rounded-lg p-2 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
              <div className={`text-right text-xs mt-0.5 ${tweet.length > 280 ? 'text-red-400' : tweet.length > 240 ? 'text-yellow-400' : 'text-gray-600'}`}>
                {tweet.length}/280
              </div>
            </div>
          </div>
        ))}
      </div>

      {texts.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-blue-400 hover:text-blue-300"
        >
          {expanded ? 'Collapse' : `Show all ${texts.length} posts`}
        </button>
      )}

      {platform === 'linkedin' && (
        <p className="mt-3 text-xs text-amber-500/80">
          LinkedIn doesn&apos;t support threads. Switch to a Single Post variant to post here.
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleCopyAll}
          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy All'}
        </button>
        {isConfigured && platform !== 'linkedin' && (
          <button
            onClick={handlePost}
            disabled={isPosting || hasOverLimit}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isPosting ? 'Posting...' : platform === 'x' ? 'Post Thread to X' : 'Post Thread to Threads'}
          </button>
        )}
      </div>
    </div>
  );
}
