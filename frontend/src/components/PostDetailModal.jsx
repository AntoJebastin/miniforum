import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Clock, 
  Trash2, 
  Send, 
  Share2, 
  Check, 
  Edit3,
  AlertCircle
} from 'lucide-react';
import { formatTimeAgo, formatNumber } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function PostDetailModal({
  postId,
  onClose,
  onPostUpdated,
  onEditPost,
  onDeletePost
}) {
  const { user, isAuthenticated, openAuthModal, showToast } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/comments`),
      ]);
      setPost(postRes.data.post);
      setComments(commentsRes.data.comments);
    } catch {
      showToast('Failed to load post discussion.', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [postId, showToast, onClose]);

  // Load post details & comments
  useEffect(() => {
    if (postId) {
      fetchData();
    }
  }, [postId, fetchData]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Voting handler inside modal
  const handleVote = async (direction) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to vote.', 'info');
      return;
    }
    if (!post) return;

    const prevVote = post.user_vote;
    const prevScore = post.score;
    let targetDirection = direction;
    if (post.user_vote === direction) targetDirection = 0;

    const newScore = prevScore - prevVote + targetDirection;
    setPost({ ...post, user_vote: targetDirection, score: newScore });

    try {
      const res = await api.post(`/posts/${post.id}/vote`, { direction: targetDirection });
      setPost((prev) => ({
        ...prev,
        score: res.data.score,
        user_vote: res.data.user_vote
      }));
      if (onPostUpdated) onPostUpdated();
    } catch {
      setPost({ ...post, user_vote: prevVote, score: prevScore });
      showToast('Voting failed.', 'error');
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: newComment.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
      setPost((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
      showToast('Comment posted successfully!');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post comment.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => ({ ...prev, comment_count: Math.max(0, prev.comment_count - 1) }));
      showToast('Comment deleted.');
      if (onPostUpdated) onPostUpdated();
    } catch {
      showToast('Failed to delete comment.', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isAuthor = user && post && user.id === post.author?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-orange-600 dark:text-orange-400">
              {post?.category ? `r/${post.category.slug}` : 'Discussion'}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-xs text-neutral-500">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading discussion...</p>
            </div>
          ) : post ? (
            <>
              {/* Post Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author?.username}`}
                    alt=""
                    className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        u/{post.author?.username}
                      </span>
                      {post.author?.bio && (
                        <span className="hidden sm:inline text-xs text-neutral-400 truncate max-w-xs">
                          • {post.author.bio}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>
                </div>

                {isAuthor && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onClose();
                        onEditPost(post);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this post permanently?')) {
                          onDeletePost(post.id);
                          onClose();
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Body */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-3 leading-snug">
                  {post.title}
                </h1>
                <div className="text-sm sm:text-base text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-line bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  {post.content}
                </div>
              </div>

              {/* Actions & Voting Bar */}
              <div className="flex items-center gap-3 py-2 border-y border-neutral-200 dark:border-neutral-800">
                {/* Vote Pills */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-1 rounded-full">
                  <button
                    onClick={() => handleVote(1)}
                    className={`p-1 rounded-full transition-colors ${
                      post.user_vote === 1 ? 'text-orange-500 bg-orange-500/20' : 'text-neutral-400 hover:text-orange-500'
                    }`}
                  >
                    <ArrowBigUp className={`w-5 h-5 ${post.user_vote === 1 ? 'fill-orange-500' : ''}`} />
                  </button>
                  <span className={`text-xs font-bold font-mono px-1.5 ${
                    post.user_vote === 1 ? 'text-orange-500' : post.user_vote === -1 ? 'text-blue-500' : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {formatNumber(post.score)}
                  </span>
                  <button
                    onClick={() => handleVote(-1)}
                    className={`p-1 rounded-full transition-colors ${
                      post.user_vote === -1 ? 'text-blue-500 bg-blue-500/20' : 'text-neutral-400 hover:text-blue-500'
                    }`}
                  >
                    <ArrowBigDown className={`w-5 h-5 ${post.user_vote === -1 ? 'fill-blue-500' : ''}`} />
                  </button>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span>Comments ({comments.length})</span>
                </h3>

                {/* Comment Box */}
                {isAuthenticated ? (
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <p className="text-xs text-neutral-500">
                      Comment as <strong className="text-neutral-700 dark:text-neutral-300">u/{user.username}</strong>
                    </p>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="What are your thoughts?"
                        className="w-full p-3 text-sm rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white disabled:text-neutral-500 shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-center">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                      Log in or create an account to participate in this discussion.
                    </p>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-transform active:scale-95"
                    >
                      Log In to Comment
                    </button>
                  </div>
                )}

                {/* Comment Thread */}
                <div className="space-y-3 pt-2">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                      No comments yet. Be the first to share your thoughts!
                    </div>
                  ) : (
                    comments.map((cmt) => {
                      const isCommentOwner = user && user.id === cmt.author?.id;
                      return (
                        <div
                          key={cmt.id}
                          className="p-3.5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 space-y-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={cmt.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cmt.author?.username}`}
                                alt=""
                                className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 object-cover"
                              />
                              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                u/{cmt.author?.username}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                • {formatTimeAgo(cmt.created_at)}
                              </span>
                            </div>

                            {isCommentOwner && (
                              <button
                                onClick={() => handleDeleteComment(cmt.id)}
                                disabled={deletingCommentId === cmt.id}
                                className="p-1 rounded text-neutral-400 hover:text-rose-500 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed pl-8 whitespace-pre-line">
                            {cmt.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            </>
          ) : (
            <div className="py-20 text-center text-neutral-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <p>Post not found or has been removed.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
