import React from 'react';
import { 
  Flame, 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { formatNumber } from '../utils/format';

export default function RightSidebar({ 
  trendingData, 
  onSelectPost 
}) {
  const trendingPosts = trendingData?.trending_posts || [];
  const stats = trendingData?.community_stats || {
    total_users: 5,
    total_posts: 6,
    total_comments: 8,
  };

  return (
    <aside className="hidden lg:block w-80 shrink-0 space-y-4 py-4 pr-4">
      
      {/* 1. About MiniForum Card */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <MessageSquare className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              About MiniForum
            </h3>
            <p className="text-xs text-neutral-500">
              The front page of your developer world
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          A modern, open community to share ideas, ask questions, debate tech stacks, and vote on what matters.
        </p>

        {/* Community Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-100 dark:border-neutral-800/80 mb-3 text-center">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              {formatNumber(stats.total_posts)}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Posts</p>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              {formatNumber(stats.total_comments)}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Comments</p>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              {formatNumber(stats.total_users)}
            </p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Members</p>
          </div>
        </div>

        {/* Community Rules summary */}
        <div className="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Be civil and respect others</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Search before creating duplicates</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Constructive discussions welcome</span>
          </div>
        </div>
      </div>

      {/* 2. Trending Discussions Card */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
            Trending Today
          </h3>
        </div>

        <div className="space-y-3">
          {trendingPosts.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">No trending posts yet.</p>
          ) : (
            trendingPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                    r/{post.category_slug}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>{post.score}</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {post.title}
                </p>

                <p className="text-[10px] text-neutral-400 mt-1">
                  {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Footer Links */}
      <div className="px-2 text-[11px] text-neutral-400 dark:text-neutral-500 leading-normal">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          <a href="#" className="hover:underline">User Agreement</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Content Guidelines</a>
        </div>
        <p>© 2026 MiniForum Inc. All rights reserved.</p>
      </div>

    </aside>
  );
}
