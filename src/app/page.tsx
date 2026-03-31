'use client';

import { useState, useEffect } from 'react';
import { SubstackPost } from '@/lib/types';
import SubstackFeed from '@/components/SubstackFeed';
import GeneratePanel from '@/components/GeneratePanel';
import AgentChat from '@/components/AgentChat';

type MainTab = 'feed' | 'agent';

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<SubstackPost | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('agent');
  const [platformConfig, setPlatformConfig] = useState({ x: false, threads: false, linkedin: false });

  useEffect(() => {
    Promise.all([
      fetch('/api/post-tweet').then((r) => r.json()).catch(() => ({ configured: false })),
      fetch('/api/post-threads').then((r) => r.json()).catch(() => ({ configured: false })),
      fetch('/api/post-linkedin').then((r) => r.json()).catch(() => ({ configured: false })),
    ]).then(([x, threads, linkedin]) => {
      setPlatformConfig({
        x: x.configured ?? false,
        threads: threads.configured ?? false,
        linkedin: linkedin.configured ?? false,
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">SubPoster</h1>
              <p className="text-xs text-gray-500">Substack content, powered by Claude</p>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-700 rounded-lg">
              <button
                onClick={() => setActiveTab('agent')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'agent'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Agent Chat
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'feed'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Feed + Generate
              </button>
            </div>
          </div>

          {/* Platform connection status */}
          <div className="flex items-center gap-3">
            {[
              { key: 'x', label: 'X', connected: platformConfig.x },
              { key: 'threads', label: 'Threads', connected: platformConfig.threads },
              { key: 'linkedin', label: 'LinkedIn', connected: platformConfig.linkedin },
            ].map(({ key, label, connected }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'feed' ? (
          /* Existing feed + generate layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                Substack Posts
              </h2>
              <div className="flex-1 overflow-y-auto">
                <SubstackFeed onPostSelect={setSelectedPost} selectedPost={selectedPost} />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                Generate Tweets
              </h2>
              <div className="flex-1 overflow-y-auto">
                <GeneratePanel selectedPost={selectedPost} />
              </div>
            </div>
          </div>
        ) : (
          /* Agent chat layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar: feed for article selection */}
            <div className="lg:col-span-1 flex flex-col overflow-hidden h-[calc(100vh-120px)]">
              <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                Select Article Context
              </h2>
              <div className="flex-1 overflow-y-auto">
                <SubstackFeed onPostSelect={setSelectedPost} selectedPost={selectedPost} />
              </div>
            </div>

            {/* Right: Agent chat */}
            <div className="lg:col-span-2">
              <AgentChat
                selectedPost={selectedPost}
                onSelectPost={setSelectedPost}
                platformConfig={platformConfig}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
