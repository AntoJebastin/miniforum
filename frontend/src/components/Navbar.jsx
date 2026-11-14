import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, 
  Plus, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  onToggleMobileSidebar,
  isMobileSidebarOpen
}) {
  const { user, isAuthenticated, logout, openAuthModal, openProfileModal, openCreatePostModal } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0b1416]/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={onToggleMobileSidebar}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a href="#" className="flex items-center gap-2 group">
            {/* Reddit-style Alien Orb Logo */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Mini<span className="text-neutral-900 dark:text-white">Forum</span>
              </span>
            </div>
          </a>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search MiniForum posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-full text-sm bg-neutral-100 dark:bg-neutral-800/80 border border-transparent dark:border-neutral-700/60 focus:border-orange-500 dark:focus:border-orange-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-600" />}
          </button>

          {/* Create Post Button */}
          <button
            onClick={() => openCreatePostModal()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300/80 dark:border-neutral-700 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Create</span>
          </button>

          {/* Auth State */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full sm:rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 object-cover border border-orange-500/50"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight truncate max-w-[100px] text-neutral-900 dark:text-neutral-100">
                    u/{user.username}
                  </span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Online</span>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Signed in as</p>
                    <p className="text-sm font-semibold truncate text-neutral-900 dark:text-white">u/{user.username}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openCreatePostModal();
                    }}
                    className="sm:hidden w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  >
                    <Plus className="w-4 h-4 text-orange-500" />
                    <span>Create a Post</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openProfileModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  >
                    <User className="w-4 h-4 text-neutral-500" />
                    <span>My Profile & Stats</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
