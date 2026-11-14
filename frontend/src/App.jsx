import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PostCard from './components/PostCard';
import PostDetailModal from './components/PostDetailModal';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { useAuth } from './context/AuthContext';
import api from './api';
import { 
  Flame, 
  Clock, 
  TrendingUp, 
  Image as ImageIcon, 
  Sparkles, 
  X,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const { 
    user, 
    isAuthenticated, 
    openCreatePostModal, 
    toast,
    showToast 
  } = useAuth();

  // Navigation and filter states
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFeed, setActiveFeed] = useState('all'); // 'all', 'popular', 'latest'
  const [sortOption, setSortOption] = useState('popular'); // 'popular', 'latest', 'top'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [posts, setPosts] = useState([]);
  const [trendingData, setTrendingData] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modal states
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load Categories & Trending on mount
  const fetchMetadata = useCallback(async () => {
    try {
      const [catRes, trendRes] = await Promise.all([
        api.get('/categories'),
        api.get('/trending')
      ]);
      setCategories(catRes.data.categories || []);
      setTrendingData(trendRes.data || null);
    } catch (err) {
      console.error('Error fetching categories or trending:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Load Posts based on filters
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const params = {};
      if (activeCategory) params.category = activeCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      // Determine sort parameter
      if (activeFeed === 'popular') params.sort = 'popular';
      else if (activeFeed === 'latest') params.sort = 'latest';
      else params.sort = sortOption;

      const res = await api.get('/posts', { params });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      showToast('Could not load discussions.', 'error');
    } finally {
      setLoadingPosts(false);
    }
  }, [activeCategory, activeFeed, sortOption, searchQuery, showToast]);

  // Debounced/responsive search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const handleEditPost = (post) => {
    openCreatePostModal(post);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Discussion deleted successfully.');
      fetchMetadata();
    } catch {
      showToast('Failed to delete post.', 'error');
    }
  };

  const currentCategoryInfo = categories.find((c) => c.slug === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-[#0b1416] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      
      {/* 1. Main Navigation Bar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* 2. Main Page Layout (Left Sidebar, Center Feed, Right Sidebar) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-6 px-2 sm:px-4">
        
        {/* Left Sidebar */}
        <LeftSidebar
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeFeed={activeFeed}
          setActiveFeed={setActiveFeed}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Feed */}
        <main className="flex-1 py-4 min-w-0 max-w-3xl space-y-4">
          
          {/* Active Category Header Banner (If filtering by category) */}
          {activeCategory && currentCategoryInfo && (
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-500/30">
                  r/
                </div>
                <div>
                  <h1 className="font-extrabold text-base text-neutral-900 dark:text-white">
                    r/{currentCategoryInfo.slug}
                  </h1>
                  <p className="text-xs text-neutral-500">
                    {currentCategoryInfo.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          )}

          {/* Quick Create Post Bar (Reddit Style) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3">
            <img
              src={user ? (user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`) : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
              alt=""
              className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 object-cover"
            />
            <input
              type="text"
              readOnly
              onClick={() => openCreatePostModal()}
              placeholder={isAuthenticated ? `What's on your mind, u/${user.username}? Create a post...` : "Log in or sign up to create a discussion..."}
              className="flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer focus:outline-none transition-all"
            />
            <button
              onClick={() => openCreatePostModal()}
              className="p-2 rounded-xl text-neutral-500 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Add Image or Code"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filter & Sorting Controls */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSortOption('popular')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sortOption === 'popular'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Popular</span>
              </button>

              <button
                onClick={() => setSortOption('latest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sortOption === 'latest'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Latest</span>
              </button>

              <button
                onClick={() => setSortOption('top')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sortOption === 'top'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Top</span>
              </button>
            </div>

            <span className="text-xs text-neutral-400 px-3 font-mono">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          {/* Search Query indicator badge if active */}
          {searchQuery && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-xs text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40">
              <span>Showing search results for &quot;<strong>{searchQuery}</strong>&quot;</span>
              <button
                onClick={() => setSearchQuery('')}
                className="font-bold underline hover:opacity-80"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-3">
            {loadingPosts ? (
              <div className="py-24 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Fetching community discussions...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 p-8 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  No discussions found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {searchQuery 
                    ? `No posts matched "${searchQuery}". Try a different keyword.` 
                    : activeCategory 
                    ? `There are no posts in r/${activeCategory} yet. Be the first to start a discussion!`
                    : "There are no posts available right now."}
                </p>
                <button
                  onClick={() => openCreatePostModal()}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-all hover:scale-105"
                >
                  Create Discussion
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenDetail={(id) => setSelectedPostId(id)}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>

        </main>

        {/* Right Sidebar */}
        <RightSidebar
          trendingData={trendingData}
          onSelectPost={(id) => setSelectedPostId(id)}
        />

      </div>

      {/* 3. Modals */}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onPostUpdated={() => {
            fetchPosts();
            fetchMetadata();
          }}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
        />
      )}

      {/* Create / Edit Post Modal */}
      <CreatePostModal
        categories={categories}
        initialCategory={activeCategory}
        onPostCreated={() => {
          fetchPosts();
          fetchMetadata();
        }}
      />

      {/* Authentication Modal (Log In / Sign Up) */}
      <AuthModal />

      {/* User Profile & My Posts Modal */}
      <ProfileModal
        onSelectPost={(id) => setSelectedPostId(id)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
