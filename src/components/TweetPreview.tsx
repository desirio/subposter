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

  let barColor = 'bg-gray-600';
  if (count > 270) barColor = 'bg-red-500';
  else if (count > 240) barColor = 'bg-yellow-500';

  return (
    <div className="mt-1.5">
      <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overflowPct > 0 && (
        <div className="w-full bg-red-900/50 rounded-full h-0.5 mt-0.5 overflow-hidden">
          <div className="h-full bg-red-400 rounded-full" style={{ width: `${overflowPct}%` }} />
        </div>
      )}
      <div className={`text-right text-[11px] mt-1 ${count > 280 ? 'text-red-400' : count > 240 ? 'text-yellow-400' : 'text-gray-600'}`}>
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
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">{variant.label}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-gray-800/50 text-gray-100 text-sm font-mono rounded-lg p-3 border border-gray-800 focus:outline-none focus:border-brand-500/60 resize-none leading-relaxed"
        rows={4}
      />
      <CharCountBar count={charCount} />

      {saveStatus && (
        <div className="mt-2 px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400">
          {saveStatus}
        </div>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>

        {isConfigured ? (
          <button
            onClick={handlePost}
            disabled={isPosting || isOverLimit}
            className="px-3 py-2 bg-brand-500 hover:bg-brand-400 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-medium rounded-lg transition-all"
          >
            {isPosting ? 'Posting...' : `Post to ${label}`}
          </button>
        ) : (
          <Link
            href="/settings"
            className="px-3 py-2 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-medium rounded-lg hover:bg-brand-500/20 transition-all"
          >
            Connect {label}
          </Link>
        )}

        <button
          onClick={() => setScheduling(!scheduling)}
          disabled={saving}
          className="px-3 py-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 text-xs font-medium rounded-lg hover:bg-yellow-500/20 transition-all"
        >
          Schedule
        </button>

        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-3 py-2 text-gray-400 bg-gray-800 border border-gray-700 text-xs font-medium rounded-lg hover:bg-gray-700 hover:text-white transition-all"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {/* Schedule picker */}
      {scheduling && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-800">
          {!isConfigured && (
            <p className="text-xs text-amber-400 mr-1 w-full sm:w-auto">
              <Link href="/settings" className="underline">Connect {label}</Link> before the scheduled time
            </p>
          )}
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellow-500/60"
          />
          <button
            onClick={handleSchedule}
            disabled={!scheduleDate || saving}
            className="px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-lg transition-all"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
          <button
            onClick={() => { setScheduling(false); setScheduleDate(''); }}
            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
