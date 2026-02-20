'use client';

import { useState } from 'react';
import { TweetFormat, TweetVariant } from '@/lib/types';

interface ThreadPreviewProps {
  variant: TweetVariant;
  onPost: (tweets: string[], format: TweetFormat) => Promise<void>;
  isPosting: boolean;
  isTwitterConfigured: boolean;
}

export default function ThreadPreview({ variant, onPost, isPosting, isTwitterConfigured }: ThreadPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const tweets = variant.tweets;
  const previewCount = expanded ? tweets.length : Math.min(2, tweets.length);

  async function handleCopyAll() {
    const text = tweets.map((t, i) => `${i + 1}/${tweets.length} ${t}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePost() {
    await onPost(tweets, 'thread');
  }

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-400">{variant.label}</div>
        <div className="text-xs text-gray-500">Thread ({tweets.length} tweets)</div>
      </div>

      <div className="flex flex-col gap-3">
        {tweets.slice(0, previewCount).map((tweet, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-mono flex-shrink-0">
                {i + 1}
              </div>
              {i < previewCount - 1 && <div className="w-px flex-1 bg-gray-700 mt-1" />}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm font-mono text-gray-200 leading-relaxed">{tweet}</p>
              <div className={`text-right text-xs mt-0.5 ${tweet.length > 280 ? 'text-red-400' : tweet.length > 240 ? 'text-yellow-400' : 'text-gray-600'}`}>
                {tweet.length}/280
              </div>
            </div>
          </div>
        ))}
      </div>

      {tweets.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-blue-400 hover:text-blue-300"
        >
          {expanded ? 'Collapse' : `Show all ${tweets.length} tweets`}
        </button>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleCopyAll}
          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy All'}
        </button>
        {isTwitterConfigured && (
          <button
            onClick={handlePost}
            disabled={isPosting}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isPosting ? 'Posting...' : 'Post Thread to X'}
          </button>
        )}
      </div>
    </div>
  );
}
