'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScheduledPost {
  id: string;
  platform: string;
  format: string;
  content: { tweets: string[] };
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-600',
  scheduled: 'bg-yellow-600',
  posted: 'bg-green-600',
  failed: 'bg-red-600',
};

const PLATFORM_LABELS: Record<string, string> = {
  x: 'X',
  threads: 'Threads',
  linkedin: 'LinkedIn',
};

export default function PostHistory() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const fetchPosts = useCallback(async () => {
    try {
      const url = filter
        ? `/api/scheduled-posts?status=${filter}`
        : '/api/scheduled-posts';
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleDelete(id: string) {
    await fetch(`/api/scheduled-posts/${id}`, { method: 'DELETE' });
    fetchPosts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Post History
        </h3>
        <div className="flex gap-1 ml-auto">
          {['', 'draft', 'scheduled', 'posted', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                filter === s
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-500 hover:text-white bg-gray-900 border border-gray-800 hover:bg-gray-800'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-xs text-gray-600">Loading...</p>}

      {!loading && posts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No posts yet</p>
          <p className="text-xs text-gray-600 mt-1">Your drafts, scheduled, and posted content will appear here</p>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-3 bg-gray-900 border border-gray-800 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-md uppercase tracking-wider ${STATUS_STYLES[post.status]}`}>
                {post.status}
              </span>
              <span className="text-xs text-gray-500">
                {PLATFORM_LABELS[post.platform] ?? post.platform}
              </span>
              <span className="text-xs text-gray-600">
                {post.format === 'thread' ? `Thread (${post.content.tweets.length})` : 'Single'}
              </span>
              <span className="text-xs text-gray-600 ml-auto">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {post.content.tweets[0]}
            </p>
            {post.scheduled_at && post.status === 'scheduled' && (
              <p className="text-xs text-yellow-400 mt-1.5">
                Scheduled for {new Date(post.scheduled_at).toLocaleString()}
              </p>
            )}
            {post.posted_at && (
              <p className="text-xs text-green-400 mt-1.5">
                Posted {new Date(post.posted_at).toLocaleString()}
              </p>
            )}
            {post.error_message && (
              <p className="text-xs text-red-400 mt-1.5">{post.error_message}</p>
            )}
            {(post.status === 'draft' || post.status === 'failed') && (
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
