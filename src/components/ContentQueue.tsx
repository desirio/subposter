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
    <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Approved Queue
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="p-2.5 bg-gray-800/50 border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500">{item.label}</p>
                <p className="text-sm text-gray-200 truncate">
                  {item.format === 'single'
                    ? item.tweets[0]
                    : `Thread (${item.tweets.length} posts)`}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                {isConfigured && !(platform === 'linkedin' && item.format === 'thread') && (
                  <button
                    onClick={() => onPost(item.tweets, item.format)}
                    disabled={isPosting || saving}
                    className="px-2.5 py-1.5 text-xs bg-brand-500 hover:bg-brand-400 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-lg transition-all"
                  >
                    {isPosting ? '...' : `Post to ${platformLabel}`}
                  </button>
                )}
                <button
                  onClick={() => setSchedulingId(schedulingId === item.id ? null : item.id)}
                  disabled={saving}
                  className="px-2.5 py-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 rounded-lg transition-all"
                >
                  Schedule
                </button>
                <button
                  onClick={() => handleSaveDraft(item)}
                  disabled={saving}
                  className="px-2.5 py-1.5 text-xs text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white rounded-lg transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="px-2 py-1.5 text-xs text-gray-500 hover:text-red-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                  aria-label="Remove from queue"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Schedule picker */}
            {schedulingId === item.id && (
              <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800">
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellow-500/60"
                />
                <button
                  onClick={() => handleSchedule(item)}
                  disabled={!scheduleDate || saving}
                  className="px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-lg transition-all"
                >
                  {saving ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setSchedulingId(null); setScheduleDate(''); }}
                  className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
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
