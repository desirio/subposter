'use client';

import { useState } from 'react';
import { SubstackPost } from '@/lib/types';
import SubstackFeed from '@/components/SubstackFeed';
import GeneratePanel from '@/components/GeneratePanel';

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<SubstackPost | null>(null);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SubPoster</h1>
            <p className="text-xs text-gray-500">Substack → Tweets, powered by Claude</p>
          </div>
        </div>
      </header>

      {/* Main split layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* Left: Substack Feed */}
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Substack Posts
            </h2>
            <div className="flex-1 overflow-y-auto">
              <SubstackFeed
                onPostSelect={setSelectedPost}
                selectedPost={selectedPost}
              />
            </div>
          </div>

          {/* Right: Generate Panel */}
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Generate Tweets
            </h2>
            <div className="flex-1 overflow-y-auto">
              <GeneratePanel selectedPost={selectedPost} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
