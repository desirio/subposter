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

      {saveStatus && (
        <div className="mt-2 px-2 py-1 bg-green-900/30 border border-green-800 rounded text-xs text-green-400">
          {saveStatus}
        </div>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={handleCopyAll}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? 'Copied' : 'Copy All'}
        </button>

        {platform !== 'linkedin' && (
          isConfigured ? (
            <button
              onClick={handlePost}
              disabled={isPosting || hasOverLimit}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isPosting ? 'Posting...' : `Post Thread to ${label}`}
            </button>
          ) : (
            <Link
              href="/settings"
              className="px-3 py-1.5 bg-blue-900/50 border border-blue-700/50 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-900/70 transition-colors"
            >
              Connect {label} to post
            </Link>
          )
        )}

        {platform !== 'linkedin' && (
          <button
            onClick={() => setScheduling(!scheduling)}
            disabled={saving}
            className="px-3 py-1.5 text-yellow-400 border border-yellow-800 text-xs font-medium rounded-lg hover:bg-yellow-900/30 transition-colors"
          >
            Schedule
          </button>
        )}

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
