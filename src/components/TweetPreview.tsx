'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TweetFormat, TweetVariant } from '@/lib/types';

interface TweetPreviewProps {
  variant: TweetVariant;
  onPost: (tweets: string[], format: TweetFormat) => Promise<void>;
  isPosting: boolean;
  isConfigured: boolean;
  platform: 'x' | 'threads' | 'linkedin';
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

const PLATFORM_LABELS = { x: 'X', threads: 'Threads', linkedin: 'LinkedIn' };

export default function TweetPreview({ variant, onPost, isPosting, isConfigured, platform }: TweetPreviewProps) {
  const [text, setText] = useState(variant.tweets[0] || '');
  const [copied, setCopied] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const charCount = text.length;
  const isOverLimit = charCount > 280;
  const label = PLATFORM_LABELS[platform];

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePost() {
    await onPost([text], 'single');
  }

  async function handleSchedule() {
    if (!scheduleDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          format: 'single',
          content: { tweets: [text] },
          status: 'scheduled',
          scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
      if (res.ok) {
        setSaveStatus('Scheduled!');
        setScheduling(false);
        setScheduleDate('');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          format: 'single',
          content: { tweets: [text] },
          status: 'draft',
        }),
      });
      if (res.ok) {
        setSaveStatus('Saved as draft!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
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

      {saveStatus && (
        <div className="mt-2 px-2 py-1 bg-green-900/30 border border-green-800 rounded text-xs text-green-400">
          {saveStatus}
        </div>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>

        {isConfigured ? (
          <button
            onClick={handlePost}
            disabled={isPosting || isOverLimit}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isPosting ? 'Posting...' : `Post to ${label}`}
          </button>
        ) : (
          <Link
            href="/settings"
            className="px-3 py-1.5 bg-blue-900/50 border border-blue-700/50 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-900/70 transition-colors"
          >
            Connect {label} to post
          </Link>
        )}

        <button
          onClick={() => setScheduling(!scheduling)}
          disabled={saving}
          className="px-3 py-1.5 text-yellow-400 border border-yellow-800 text-xs font-medium rounded-lg hover:bg-yellow-900/30 transition-colors"
        >
          Schedule
        </button>

        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-3 py-1.5 text-gray-300 border border-gray-600 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {/* Schedule picker */}
      {scheduling && (
        <div className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-700">
          {!isConfigured && (
            <p className="text-xs text-amber-500 mr-1">
              <Link href="/settings" className="underline">Connect {label}</Link> before the scheduled time
            </p>
          )}
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="px-2 py-1 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <button
            onClick={handleSchedule}
            disabled={!scheduleDate || saving}
            className="px-2.5 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
          <button
            onClick={() => { setScheduling(false); setScheduleDate(''); }}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
