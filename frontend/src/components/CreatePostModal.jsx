import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Technology', slug: 'technology' },
  { id: 2, name: 'Programming', slug: 'programming' },
  { id: 3, name: 'Web Development', slug: 'webdev' },
  { id: 4, name: 'Ask Reddit', slug: 'askreddit' },
  { id: 5, name: 'Gaming', slug: 'gaming' },
  { id: 6, name: 'UI / UX Design', slug: 'design' },
];

export default function CreatePostModal({
  categories = [],
  initialCategory,
  onPostCreated
}) {
  const { createPostModalOpen, postToEdit, closeCreatePostModal, showToast } = useAuth();
  
  const isEditing = !!postToEdit;
  const availableCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(() => availableCategories[0]?.id || 1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Whenever the modal opens, reset form values and ensure categoryId is populated
  useEffect(() => {
    if (createPostModalOpen) {
      if (postToEdit) {
        setTitle(postToEdit.title || '');
        setContent(postToEdit.content || '');
        setCategoryId(postToEdit.category?.id || availableCategories[0]?.id || 1);
      } else {
        setTitle('');
        setContent('');
        if (initialCategory) {
          const match = availableCategories.find((c) => c.slug === initialCategory);
          setCategoryId(match ? match.id : (availableCategories[0]?.id || 1));
        } else {
          setCategoryId(availableCategories[0]?.id || 1);
        }
      }
      setError('');
    }
  }, [createPostModalOpen, postToEdit, initialCategory, availableCategories]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeCreatePostModal();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCreatePostModal]);

  if (!createPostModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const targetCategoryId = Number(categoryId) || availableCategories[0]?.id || 1;

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (content.trim().length < 5) {
      setError('Content must be at least 5 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/posts/${postToEdit.id}`, {
          title: title.trim(),
          content: content.trim(),
          category_id: targetCategoryId,
        });
        showToast('Post updated successfully!');
      } else {
        await api.post('/posts', {
          title: title.trim(),
          content: content.trim(),
          category_id: targetCategoryId,
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
              value={categoryId || availableCategories[0]?.id || 1}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors cursor-pointer"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
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
