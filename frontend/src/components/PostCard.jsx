import React, { useState } from 'react';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Share2, 
  Edit3, 
  Trash2, 
  Check,
  Clock
} from 'lucide-react';
import { formatTimeAgo, formatNumber } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function PostCard({
  post,
  onOpenDetail,
  onEdit,
  onDelete,
}) {
  const { user, isAuthenticated, openAuthModal, showToast } = useAuth();

  // Optimistic voting state
  const [userVote, setUserVote] = useState(post.user_vote || 0);
  const [score, setScore] = useState(post.score || 0);
  const [isVoting, setIsVoting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAuthor = user && user.id === post.author?.id;

  const handleVote = async (e, direction) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to vote on posts.', 'info');
      return;
    }

    if (isVoting) return;

    // Save previous state for rollback
    const prevVote = userVote;
    const prevScore = score;

    let targetDirection = direction;
    // Toggle off if already voted this direction
    if (userVote === direction) {
      targetDirection = 0;
    }

    // Calculate optimistic score
    const newScore = prevScore - prevVote + targetDirection;
    setUserVote(targetDirection);
    setScore(newScore);
    setIsVoting(true);

    try {
      const res = await api.post(`/posts/${post.id}/vote`, { direction: targetDirection });
      setScore(res.data.score);
      setUserVote(res.data.user_vote);
    } catch {
      // Rollback on error
      setUserVote(prevVote);
      setScore(prevScore);
      showToast('Failed to record vote. Please try again.', 'error');
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}#post-${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article 
      onClick={() => onOpenDetail(post.id)}
      className="group relative flex rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer overflow-hidden shadow-xs hover:shadow-md"
    >
      {/* 1. Left Vote Column (Reddit Style) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-11 sm:w-12 shrink-0 py-3 flex flex-col items-center bg-neutral-50/70 dark:bg-neutral-900/40 border-r border-neutral-100 dark:border-neutral-800/80"
      >
        <button
          onClick={(e) => handleVote(e, 1)}
          aria-label="Upvote"
          className={`p-1 rounded-md transition-colors ${
            userVote === 1
              ? 'text-orange-500 bg-orange-500/10'
              : 'text-neutral-400 hover:text-orange-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
          }`}
        >
          <ArrowBigUp className={`w-6 h-6 ${userVote === 1 ? 'fill-orange-500' : ''}`} />
        </button>

        <span
          className={`my-1 text-xs font-bold font-mono transition-colors ${
            userVote === 1
              ? 'text-orange-500'
              : userVote === -1
              ? 'text-blue-500'
              : 'text-neutral-700 dark:text-neutral-300'
          }`}
        >
          {formatNumber(score)}
        </span>

        <button
          onClick={(e) => handleVote(e, -1)}
          aria-label="Downvote"
          className={`p-1 rounded-md transition-colors ${
            userVote === -1
              ? 'text-blue-500 bg-blue-500/10'
              : 'text-neutral-400 hover:text-blue-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
          }`}
        >
          <ArrowBigDown className={`w-6 h-6 ${userVote === -1 ? 'fill-blue-500' : ''}`} />
        </button>
      </div>

      {/* 2. Main Post Content */}
      <div className="flex-1 p-3.5 sm:p-4 min-w-0 flex flex-col justify-between">
        
        {/* Post Metadata Header */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400 mb-1.5">
          {post.category && (
            <span className="font-bold text-orange-600 dark:text-orange-400 hover:underline">
              r/{post.category.slug}
            </span>
          )}
          <span>•</span>
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <img
              src={post.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author?.username}`}
              alt=""
              className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 object-cover"
            />
            <span>Posted by <strong className="text-neutral-700 dark:text-neutral-300">u/{post.author?.username}</strong></span>
          </div>
          <span>•</span>
          <span className="flex items-center gap-1" title={post.created_at}>
            <Clock className="w-3 h-3 text-neutral-400" />
            {formatTimeAgo(post.created_at)}
          </span>
          {post.updated_at && post.updated_at !== post.created_at && (
            <span className="text-[10px] text-neutral-400 italic">(edited)</span>
          )}
        </div>

        {/* Post Title */}
        <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-2 leading-snug">
          {post.title}
        </h2>

        {/* Post Content Snippet */}
        <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 mb-3 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80">
          
          {/* Comments Button */}
          <button
            onClick={() => onOpenDetail(post.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Author Specific Actions */}
          {isAuthor && (
            <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onEdit(post)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                title="Edit Post"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </article>
  );
}
