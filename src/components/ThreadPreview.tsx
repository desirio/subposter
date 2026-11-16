'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TweetFormat, TweetVariant } from '@/lib/types';

interface ThreadPreviewProps {
  variant: TweetVariant;
  onPost: (tweets: string[], format: TweetFormat) => Promise<void>;
  isPosting: boolean;
  isConfigured: boolean;
  platform: 'x' | 'threads' | 'linkedin';
}

const PLATFORM_LABELS = { x: 'X', threads: 'Threads', linkedin: 'LinkedIn' };

export default function ThreadPreview({ variant, onPost, isPosting, isConfigured, platform }: ThreadPreviewProps) {
  const [texts, setTexts] = useState<string[]>(variant.tweets);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const previewCount = expanded ? texts.length : Math.min(2, texts.length);
  const hasOverLimit = texts.some((t) => t.length > 280);
  const label = PLATFORM_LABELS[platform];

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

  async function handleSchedule() {
    if (!scheduleDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          format: 'thread',
          content: { tweets: texts },
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
          format: 'thread',
          content: { tweets: texts },
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
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{variant.label}</div>
        <div className="text-xs text-gray-600">{texts.length} posts</div>
      </div>

      <div className="flex flex-col gap-3">
        {texts.slice(0, previewCount).map((tweet, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[11px] text-gray-400 font-mono shrink-0">
                {i + 1}
              </div>
              {i < previewCount - 1 && <div className="w-px flex-1 bg-gray-800 mt-1" />}
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <textarea
                value={tweet}
                onChange={(e) => updateTweet(i, e.target.value)}
                rows={3}
                className="w-full bg-gray-800/50 text-gray-100 text-sm font-mono rounded-lg p-2.5 border border-gray-800 focus:outline-none focus:border-brand-500/60 resize-none leading-relaxed"
              />
              <div className={`text-right text-[11px] mt-0.5 ${tweet.length > 280 ? 'text-red-400' : tweet.length > 240 ? 'text-yellow-400' : 'text-gray-600'}`}>
                {tweet.length}/280
              </div>
            </div>
          </div>
        ))}
      </div>

      {texts.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
        >
          {expanded ? 'Collapse' : `Show all ${texts.length} posts`}
        </button>
      )}

      {platform === 'linkedin' && (
        <p className="mt-3 text-xs text-amber-400/80">
          LinkedIn doesn&apos;t support threads. Switch to Single Post to post here.
        </p>
      )}

      {saveStatus && (
        <div className="mt-2 px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400">
          {saveStatus}
        </div>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={handleCopyAll}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all"
        >
          {copied ? 'Copied' : 'Copy All'}
        </button>

        {platform !== 'linkedin' && (
          isConfigured ? (
            <button
              onClick={handlePost}
              disabled={isPosting || hasOverLimit}
              className="px-3 py-2 bg-brand-500 hover:bg-brand-400 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-medium rounded-lg transition-all"
            >
              {isPosting ? 'Posting...' : `Post Thread to ${label}`}
            </button>
          ) : (
            <Link
              href="/settings"
              className="px-3 py-2 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-medium rounded-lg hover:bg-brand-500/20 transition-all"
            >
              Connect {label}
            </Link>
          )
        )}

        {platform !== 'linkedin' && (
          <button
            onClick={() => setScheduling(!scheduling)}
            disabled={saving}
            className="px-3 py-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 text-xs font-medium rounded-lg hover:bg-yellow-500/20 transition-all"
          >
            Schedule
          </button>
        )}

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
