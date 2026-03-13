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
          placeholder="Substack, Medium, or any blog URL..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={loadPosts}
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          Loading posts...
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm text-center">
          <p>Enter a publication or article URL and click Load</p>
          <p className="text-xs mt-1 text-gray-600">Supports Substack, Medium, and most blogs</p>
        </div>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto">
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
