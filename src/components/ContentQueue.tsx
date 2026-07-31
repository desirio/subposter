'use client';

import { useState } from 'react';
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

  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSchedule(item: ContentVariant) {
    if (!scheduleDate) return;
    setSaving(true);
    try {
      await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          format: item.format,
          content: { tweets: item.tweets },
          status: 'scheduled',
          scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
      onRemove(item.id);
      setSchedulingId(null);
      setScheduleDate('');
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft(item: ContentVariant) {
    setSaving(true);
    try {
      await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          format: item.format,
          content: { tweets: item.tweets },
          status: 'draft',
        }),
      });
      onRemove(item.id);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Approved Queue
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="p-2 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between gap-3">
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
                    disabled={isPosting || saving}
                    className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
                  >
                    {isPosting ? '...' : `Post to ${platformLabel}`}
                  </button>
                )}
                <button
                  onClick={() => setSchedulingId(schedulingId === item.id ? null : item.id)}
                  disabled={saving}
                  className="px-2.5 py-1 text-xs text-yellow-400 border border-yellow-800 hover:bg-yellow-900/30 rounded-md transition-colors"
                >
                  Schedule
                </button>
                <button
                  onClick={() => handleSaveDraft(item)}
                  disabled={saving}
                  className="px-2.5 py-1 text-xs text-gray-300 border border-gray-600 hover:bg-gray-700 rounded-md transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Schedule picker */}
            {schedulingId === item.id && (
              <div className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-700">
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
                <button
                  onClick={() => handleSchedule(item)}
                  disabled={!scheduleDate || saving}
                  className="px-2.5 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
                >
                  {saving ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setSchedulingId(null); setScheduleDate(''); }}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
