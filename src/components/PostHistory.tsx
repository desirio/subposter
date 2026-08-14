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

const STATUS_COLORS: Record<string, string> = {
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
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Post History
        </h3>
        <div className="flex gap-1 ml-auto">
          {['', 'draft', 'scheduled', 'posted', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 bg-gray-800'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-xs text-gray-500">Loading...</p>}

      {!loading && posts.length === 0 && (
        <p className="text-xs text-gray-500">No posts yet.</p>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-3 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-1.5 py-0.5 text-[10px] font-medium text-white rounded ${STATUS_COLORS[post.status]}`}>
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
            <p className="text-sm text-gray-300 line-clamp-2">
              {post.content.tweets[0]}
            </p>
            {post.scheduled_at && post.status === 'scheduled' && (
              <p className="text-xs text-yellow-500 mt-1">
                Scheduled for {new Date(post.scheduled_at).toLocaleString()}
              </p>
            )}
            {post.posted_at && (
              <p className="text-xs text-green-500 mt-1">
                Posted {new Date(post.posted_at).toLocaleString()}
              </p>
            )}
            {post.error_message && (
              <p className="text-xs text-red-400 mt-1">{post.error_message}</p>
            )}
            <div className="mt-2 flex gap-1">
              {(post.status === 'draft' || post.status === 'failed') && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-2 py-0.5 text-xs text-red-400 hover:text-red-300 bg-gray-800 rounded transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
