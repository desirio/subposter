'use client';

import { useState } from 'react';
import { TweetFormat, TweetVariant } from '@/lib/types';

interface TweetPreviewProps {
  variant: TweetVariant;
  onPost: (tweets: string[], format: TweetFormat) => Promise<void>;
  isPosting: boolean;
  isTwitterConfigured: boolean;
}

function CharCountBar({ count }: { count: number }) {
  const max = 280;
  const pct = Math.min((count / max) * 100, 100);
  const overflowPct = count > max ? Math.min(((count - max) / 20) * 100, 100) : 0;

  let barColor = 'bg-gray-500';
  if (count > 270) barColor = 'bg-red-500';
  else if (count > 240) barColor = 'bg-yellow-500';

  return (
    <div className="mt-1">
      <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overflowPct > 0 && (
        <div className="w-full bg-red-900 rounded-full h-1 mt-0.5 overflow-hidden">
          <div className="h-full bg-red-400 rounded-full" style={{ width: `${overflowPct}%` }} />
        </div>
      )}
      <div className={`text-right text-xs mt-0.5 ${count > 280 ? 'text-red-400' : count > 240 ? 'text-yellow-400' : 'text-gray-500'}`}>
        {count} / {max}
      </div>
    </div>
  );
}

export default function TweetPreview({ variant, onPost, isPosting, isTwitterConfigured }: TweetPreviewProps) {
  const [text, setText] = useState(variant.tweets[0] || '');
  const [copied, setCopied] = useState(false);

  const charCount = text.length;
  const isOverLimit = charCount > 280;

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePost() {
    await onPost([text], 'single');
  }

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="text-xs font-medium text-gray-400 mb-2">{variant.label}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-gray-800 text-gray-100 text-sm font-mono rounded-lg p-3 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
        rows={4}
      />
      <CharCountBar count={charCount} />
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleCopy}
          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        {isTwitterConfigured && (
          <button
            onClick={handlePost}
            disabled={isPosting || isOverLimit}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isPosting ? 'Posting...' : 'Post to X'}
          </button>
        )}
      </div>
    </div>
  );
}
