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
      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'border-brand-500/60 bg-brand-950/30 ring-1 ring-brand-500/40'
          : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/80'
      }`}
    >
      <h3 className="font-semibold text-gray-100 text-sm leading-snug mb-1 line-clamp-2">
        {post.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
        {post.author && <span>{post.author}</span>}
        {post.author && post.pubDate && <span className="text-gray-700">·</span>}
        {post.pubDate && <span>{formatDate(post.pubDate)}</span>}
      </div>
      {post.contentSnippet && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {post.contentSnippet}
        </p>
      )}
    </button>
  );
}
