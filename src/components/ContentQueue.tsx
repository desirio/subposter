'use client';

import { ContentVariant, TweetFormat } from '@/lib/types';

interface ContentQueueProps {
  items: ContentVariant[];
  onPost: (tweets: string[], format: TweetFormat) => Promise<void>;
  onRemove: (variantId: string) => void;
  isPosting: boolean;
  isConfigured: boolean;
  platform: 'x' | 'threads' | 'linkedin';
}

export default function ContentQueue({
  items,
  onPost,
  onRemove,
  isPosting,
  isConfigured,
  platform,
}: ContentQueueProps) {
  const platformLabel =
    platform === 'x' ? 'X' : platform === 'threads' ? 'Threads' : 'LinkedIn';

  return (
    <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Approved Queue
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-2 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm text-gray-200 truncate">
                {item.format === 'single'
                  ? item.tweets[0]
                  : `Thread (${item.tweets.length} posts)`}
              </p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {isConfigured && !(platform === 'linkedin' && item.format === 'thread') && (
                <button
                  onClick={() => onPost(item.tweets, item.format)}
                  disabled={isPosting}
                  className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
                >
                  {isPosting ? '...' : `Post to ${platformLabel}`}
                </button>
              )}
              <button
                onClick={() => onRemove(item.id)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
