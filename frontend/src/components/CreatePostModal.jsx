import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function CreatePostModal({
  categories = [],
  initialCategory,
  onPostCreated
}) {
  const { postToEdit, closeCreatePostModal, showToast } = useAuth();
  
  const isEditing = !!postToEdit;

  // Initialize state directly from props/context
  const getInitialCategoryId = () => {
    if (postToEdit?.category?.id) return postToEdit.category.id;
    if (initialCategory) {
      const match = categories.find((c) => c.slug === initialCategory);
      if (match) return match.id;
    }
    return categories.length > 0 ? categories[0].id : '';
  };

  const [title, setTitle] = useState(postToEdit?.title || '');
  const [content, setContent] = useState(postToEdit?.content || '');
  const [categoryId, setCategoryId] = useState(getInitialCategoryId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle ESC key
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeCreatePostModal();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCreatePostModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (content.trim().length < 5) {
      setError('Content must be at least 5 characters long.');
      return;
    }
    if (!categoryId) {
      setError('Please select a community for your post.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/posts/${postToEdit.id}`, {
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId,
        });
        showToast('Post updated successfully!');
      } else {
        await api.post('/posts', {
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId,
        });
        showToast('Discussion posted to community!');
      }
      if (onPostCreated) onPostCreated();
      closeCreatePostModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={closeCreatePostModal} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              {isEditing ? 'Edit Discussion' : 'Create a Discussion'}
            </h2>
          </div>
          <button
            onClick={closeCreatePostModal}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Community / Category selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Choose a Community
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  r/{c.slug} – {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Title
              </label>
              <span className={`text-[11px] font-mono ${title.length > 250 ? 'text-rose-500' : 'text-neutral-400'}`}>
                {title.length}/250
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={250}
              placeholder="An interesting, descriptive title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors placeholder:text-neutral-400"
            />
          </div>

          {/* Content textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Discussion Text (Markdown & Plain Text)
            </label>
            <textarea
              required
              rows={6}
              placeholder="Share context, code snippets, thoughts, questions, or ideas..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors placeholder:text-neutral-400 resize-none leading-relaxed"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeCreatePostModal}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : isEditing ? 'Update Post' : 'Post to Community'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
