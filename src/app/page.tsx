'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SubstackPost } from '@/lib/types';
import SubstackFeed from '@/components/SubstackFeed';
import GeneratePanel from '@/components/GeneratePanel';
import AgentChat from '@/components/AgentChat';
import { useAuth } from '@/components/AuthProvider';

type MainTab = 'feed' | 'agent';

export default function Home() {
  const { user, signOut } = useAuth();
  const [selectedPost, setSelectedPost] = useState<SubstackPost | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('agent');
  const [platformConfig, setPlatformConfig] = useState({ x: false, threads: false, linkedin: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFeedOnMobile, setShowFeedOnMobile] = useState(false);

  useEffect(() => {
    fetch('/api/connections')
      .then((r) => r.json())
      .then((data) => {
        const connections = data.connections ?? [];
        setPlatformConfig({
          x: connections.some((c: { platform: string }) => c.platform === 'x'),
          threads: connections.some((c: { platform: string }) => c.platform === 'threads'),
          linkedin: connections.some((c: { platform: string }) => c.platform === 'linkedin'),
        });
      })
      .catch(() => {});
  }, []);

  const connectedCount = [platformConfig.x, platformConfig.threads, platformConfig.linkedin].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <rect width="32" height="32" rx="8" fill="#F97316" />
                <path d="M8 22V10l8 6 8-6v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="hidden sm:block">
                <h1 className="text-base font-display font-bold text-white tracking-tight leading-none">SubPoster</h1>
                <p className="text-[11px] text-gray-500 leading-none mt-0.5">Your articles, distributed by us</p>
              </div>
            </div>

            {/* Desktop tab navigation — centered */}
            <div className="hidden md:flex gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl">
              <button
                onClick={() => setActiveTab('agent')}
                className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'agent'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Agent Chat
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'feed'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Feed + Generate
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Platform dots — desktop */}
              <div className="hidden lg:flex items-center gap-2.5">
                {[
                  { key: 'x', label: 'X', connected: platformConfig.x },
                  { key: 'threads', label: 'Threads', connected: platformConfig.threads },
                  { key: 'linkedin', label: 'LinkedIn', connected: platformConfig.linkedin },
                ].map(({ key, label, connected }) => (
                  <div key={key} className="flex items-center gap-1.5" title={`${label}: ${connected ? 'Connected' : 'Not connected'}`}>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        connected ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* Compact platform indicator — tablet */}
              <div className="hidden md:flex lg:hidden items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-xs text-gray-500">{connectedCount}/3</span>
              </div>

              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-800">
                <span className="text-xs text-gray-500 hidden xl:inline max-w-[160px] truncate">{user?.email}</span>
                <Link
                  href="/settings"
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                  title="Settings"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Link>
                <button
                  onClick={signOut}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Sign out
                </button>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-800/60 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate max-w-[200px]">{user?.email}</span>
                <div className="flex items-center gap-2">
                  {[
                    { key: 'x', label: 'X', connected: platformConfig.x },
                    { key: 'threads', label: 'T', connected: platformConfig.threads },
                    { key: 'linkedin', label: 'L', connected: platformConfig.linkedin },
                  ].map(({ key, label, connected }) => (
                    <div key={key} className="flex items-center gap-1" title={`${label}: ${connected ? 'Connected' : 'Not connected'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <span className="text-[11px] text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/settings"
                  className="flex-1 text-center py-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2 text-sm text-gray-400 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/80 safe-area-bottom">
        <div className="flex">
          <button
            onClick={() => { setActiveTab('agent'); setShowFeedOnMobile(false); }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'agent' && !showFeedOnMobile
                ? 'text-brand-500'
                : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            Agent
          </button>
          {activeTab === 'agent' && (
            <button
              onClick={() => setShowFeedOnMobile(!showFeedOnMobile)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                showFeedOnMobile ? 'text-brand-500' : 'text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              Articles
            </button>
          )}
          <button
            onClick={() => { setActiveTab('feed'); setShowFeedOnMobile(false); }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'feed'
                ? 'text-brand-500'
                : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
            Generate
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 md:pb-6">
        {activeTab === 'feed' ? (
          /* Feed + Generate layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-5.5rem)]">
            <div className="flex flex-col overflow-hidden min-h-0">
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">
                Articles
              </h2>
              <div className="flex-1 overflow-y-auto min-h-0">
                <SubstackFeed onPostSelect={setSelectedPost} selectedPost={selectedPost} />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden min-h-0">
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">
                Generate Posts
              </h2>
              <div className="flex-1 overflow-y-auto min-h-0">
                <GeneratePanel selectedPost={selectedPost} />
              </div>
            </div>
          </div>
        ) : (
          /* Agent chat layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-5.5rem)]">
            {/* Sidebar: article feed — hidden on mobile unless toggled */}
            <div className={`lg:col-span-1 flex flex-col overflow-hidden min-h-0 ${
              showFeedOnMobile ? 'block' : 'hidden lg:flex'
            }`}>
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">
                Select Article
              </h2>
              <div className="flex-1 overflow-y-auto min-h-0">
                <SubstackFeed onPostSelect={(post) => { setSelectedPost(post); setShowFeedOnMobile(false); }} selectedPost={selectedPost} />
              </div>
            </div>

            {/* Agent chat */}
            <div className={`lg:col-span-2 min-h-0 ${
              showFeedOnMobile ? 'hidden lg:block' : 'block'
            }`}>
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
