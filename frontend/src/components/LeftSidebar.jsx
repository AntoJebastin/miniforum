import React from 'react';
import { 
  Home, 
  Flame, 
  Clock, 
  Cpu, 
  Code, 
  Globe, 
  HelpCircle, 
  Gamepad2, 
  Palette, 
  Hash, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Map icon string names to Lucide icon components
const ICON_MAP = {
  Cpu: Cpu,
  Code: Code,
  Globe: Globe,
  HelpCircle: HelpCircle,
  Gamepad2: Gamepad2,
  Palette: Palette,
  Hash: Hash,
};

const COLOR_MAP = {
  orange: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  blue: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  purple: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  rose: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  amber: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
};

export default function LeftSidebar({
  categories = [],
  activeCategory,
  setActiveCategory,
  activeFeed,
  setActiveFeed,
  isOpen,
  onClose,
}) {
  const { openCreatePostModal } = useAuth();

  const handleSelectFeed = (feed) => {
    setActiveFeed(feed);
    setActiveCategory(null);
    if (onClose) onClose();
  };

  const handleSelectCategory = (slug) => {
    setActiveCategory(slug === activeCategory ? null : slug);
    if (onClose) onClose();
  };

  const content = (
    <div className="flex flex-col h-full py-4 px-3 space-y-6 overflow-y-auto">
      
      {/* Feeds Section */}
      <div>
        <p className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Feeds
        </p>
        <div className="space-y-1">
          <button
            onClick={() => handleSelectFeed('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFeed === 'all' && !activeCategory
                ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
            }`}
          >
            <Home className="w-4 h-4 text-orange-500" />
            <span>Home (All Posts)</span>
          </button>

          <button
            onClick={() => handleSelectFeed('popular')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFeed === 'popular' && !activeCategory
                ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Popular Discussions</span>
          </button>

          <button
            onClick={() => handleSelectFeed('latest')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFeed === 'latest' && !activeCategory
                ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Latest Posts</span>
          </button>
        </div>
      </div>

      {/* Communities / Categories Section */}
      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Communities
          </p>
          <span className="text-[11px] font-semibold text-neutral-400">
            {categories.length}
          </span>
        </div>

        <div className="space-y-1">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Hash;
            const colorClass = COLOR_MAP[cat.color] || COLOR_MAP.orange;
            const isSelected = activeCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all group ${
                  isSelected
                    ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${colorClass}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="truncate text-xs font-semibold">r/{cat.slug}</span>
                    <span className="text-[10px] text-neutral-400 truncate">{cat.name}</span>
                  </div>
                </div>

                <span className="text-xs text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono">
                  {cat.post_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick CTA Box */}
      <div className="mt-auto pt-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Have a thought?</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Start a discussion in your favorite community!
          </p>
          <button
            onClick={() => {
              if (onClose) onClose();
              openCreatePostModal();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Discussion</span>
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0b1416]/50">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-[#0b1416] border-r border-neutral-200 dark:border-neutral-800 shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
