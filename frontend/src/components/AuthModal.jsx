import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { 
    authModalOpen, 
    authModalTab, 
    setAuthModalTab, 
    closeAuthModal, 
    login, 
    register 
  } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const isLogin = authModalTab === 'login';

  const handleQuickDemo = () => {
    setIdentifier('demo_user');
    setPassword('password123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        const res = await login(identifier, password);
        if (!res.success) setError(res.error);
      } else {
        const res = await register(username, email, password);
        if (!res.success) setError(res.error);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      
      {/* Click outside */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">
              {isLogin ? 'Log In to MiniForum' : 'Join MiniForum'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-6 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => { setAuthModalTab('login'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
              isLogin
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setAuthModalTab('register'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
              !isLogin
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Content & Form */}
        <div className="p-6 space-y-4">
          
          {/* Quick Demo Autofill Banner for Log In */}
          {isLogin && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Want to test quickly?</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="px-2.5 py-1 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors"
              >
                Auto-Fill Demo
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isLogin ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. demo_user or demo@miniforum.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. tech_enthusiast"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isLogin ? 'Enter password' : 'At least 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white shadow-md shadow-orange-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 flex items-center justify-center gap-2"
            >
              {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{submitting ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-neutral-400 pt-2">
            By continuing, you agree to MiniForum's User Agreement and Privacy Policy.
          </p>

        </div>

      </div>
    </div>
  );
}
