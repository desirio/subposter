'use client';

import { useState } from 'react';
import { SubstackPost } from '@/lib/types';
import PostCard from './PostCard';

interface SubstackFeedProps {
  onPostSelect: (post: SubstackPost) => void;
  selectedPost: SubstackPost | null;
}

export default function SubstackFeed({ onPostSelect, selectedPost }: SubstackFeedProps) {
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_SUBSTACK_DEFAULT_URL || '');
  const [posts, setPosts] = useState<SubstackPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/substack?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load posts');
      setPosts(data.posts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') loadPosts();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste blog or Substack URL..."
          className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500/60"
        />
        <button
          onClick={loadPosts}
          disabled={loading || !url.trim()}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-brand-500/10 disabled:shadow-none"
        >
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm gap-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          Loading posts...
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 font-medium">Paste a URL to get started</p>
          <p className="text-xs text-gray-600 mt-1">Substack, Medium, Ghost, and most blogs</p>
        </div>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isSelected={selectedPost?.id === post.id}
            onSelect={() => onPostSelect(post)}
          />
        ))}
      </div>
    </div>
  );
}
