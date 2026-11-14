import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  Flame, 
  MessageSquare, 
  FileText,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo, formatNumber } from '../utils/format';
import api from '../api';

export default function ProfileModal({ onSelectPost }) {
  const { 
    user, 
    userStats, 
    profileModalOpen, 
    closeProfileModal, 
    updateProfile, 
    showToast 
  } = useAuth();

  const [bio, setBio] = useState(user?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Load user's posts
  useEffect(() => {
    let isMounted = true;
    if (profileModalOpen && user) {
      async function fetchMyPosts() {
        setLoadingPosts(true);
        try {
          const res = await api.get(`/posts?user_id=${user.id}`);
          if (isMounted) setMyPosts(res.data.posts);
        } catch (err) {
          console.error('Error fetching user posts:', err);
        } finally {
          if (isMounted) setLoadingPosts(false);
        }
      }
      fetchMyPosts();
    }
    return () => { isMounted = false; };
  }, [profileModalOpen, user]);

  if (!profileModalOpen || !user) return null;

  const handleSaveBio = async () => {
    setSavingBio(true);
    const res = await updateProfile(bio, user.avatar_url);
    setSavingBio(false);
    if (res.success) {
      setIsEditingBio(false);
    }
  };

  const handleDeletePost = async (postId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Post deleted.');
    } catch {
      showToast('Failed to delete post.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      
      {/* Click outside */}
      <div className="absolute inset-0" onClick={closeProfileModal} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Banner & Header */}
        <div className="h-28 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 relative">
          <button
            onClick={closeProfileModal}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 pb-6 pt-0 overflow-y-auto flex-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-3.5">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-20 h-20 rounded-2xl bg-white dark:bg-neutral-800 p-1 shadow-lg object-cover border-2 border-white dark:border-neutral-800"
              />
              <div className="mb-1">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white leading-tight">
                  u/{user.username}
                </h2>
                <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <div className="text-xs text-neutral-400 flex items-center gap-1 sm:self-end mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-0.5">
                <Flame className="w-4 h-4" />
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                  {formatNumber(userStats?.karma || 0)}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Post Karma</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-0.5">
                <FileText className="w-4 h-4" />
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                  {formatNumber(userStats?.posts ?? myPosts.length)}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Discussions</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-0.5">
                <MessageSquare className="w-4 h-4" />
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                  {formatNumber(userStats?.comments || 0)}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Comments</p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                About Me / Bio
              </span>
              {!isEditingBio ? (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveBio}
                  disabled={savingBio}
                  className="flex items-center gap-1 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded-lg shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingBio ? 'Saving...' : 'Save'}</span>
                </button>
              )}
            </div>

            {isEditingBio ? (
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:border-orange-500 focus:outline-none resize-none"
                placeholder="Write a brief bio about your interests..."
              />
            ) : (
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                {user.bio || 'No bio provided yet. Click edit to add one!'}
              </p>
            )}
          </div>

          {/* My Discussions Tab */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
              My Discussions ({myPosts.length})
            </h4>

            {loadingPosts ? (
              <p className="text-xs text-neutral-400 py-4 text-center">Loading discussions...</p>
            ) : myPosts.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">
                You haven't posted any discussions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myPosts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      closeProfileModal();
                      onSelectPost(p.id);
                    }}
                    className="group flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 hover:border-orange-500/50 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          r/{p.category?.slug}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          • {formatTimeAgo(p.created_at)}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-orange-500">
                        {p.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-neutral-500 font-mono">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{p.score}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeletePost(p.id, e)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-500 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
