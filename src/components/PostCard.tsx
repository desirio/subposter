'use client';

import { SubstackPost } from '@/lib/types';

interface PostCardProps {
  post: SubstackPost;
  isSelected: boolean;
  onSelect: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PostCard({ post, isSelected, onSelect }: PostCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-150 ${
        isSelected
          ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
          : 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800'
      }`}
    >
      <h3 className="font-semibold text-gray-100 text-sm leading-snug mb-1 line-clamp-2">
        {post.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        {post.author && <span>{post.author}</span>}
        {post.author && post.pubDate && <span>·</span>}
        {post.pubDate && <span>{formatDate(post.pubDate)}</span>}
      </div>
      {post.contentSnippet && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {post.contentSnippet}
        </p>
      )}
    </button>
  );
}
