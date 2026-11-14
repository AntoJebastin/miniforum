/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('miniforum_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('miniforum_token'));
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setUserStats(null);
    localStorage.removeItem('miniforum_token');
    localStorage.removeItem('miniforum_user');
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  // Verify auth on mount if token exists
  useEffect(() => {
    let isMounted = true;
    async function verifyUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (isMounted) {
            setUser(res.data.user);
            setUserStats(res.data.stats);
            localStorage.setItem('miniforum_user', JSON.stringify(res.data.user));
          }
        } catch {
          if (isMounted) {
            logout();
          }
        }
      }
      if (isMounted) setLoading(false);
    }
    verifyUser();
    return () => { isMounted = false; };
  }, [token, logout]);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('miniforum_token', userToken);
      localStorage.setItem('miniforum_user', JSON.stringify(userData));
      setAuthModalOpen(false);
      showToast(`Welcome back, u/${userData.username}!`);
      return { success: true };
    } catch (err) {
      let errorMsg = err.response?.data?.error;
      if (!errorMsg) {
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          errorMsg = 'Cannot connect to backend server. Make sure the Flask backend is running (python app.py).';
        } else {
          errorMsg = 'Login failed. Please check credentials.';
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { username, email, password });
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('miniforum_token', userToken);
      localStorage.setItem('miniforum_user', JSON.stringify(userData));
      setAuthModalOpen(false);
      showToast(`Account created! Welcome to MiniForum, u/${userData.username}!`);
      return { success: true };
    } catch (err) {
      let errorMsg = err.response?.data?.error;
      if (!errorMsg) {
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          errorMsg = 'Cannot connect to backend server. Make sure the Flask backend is running (python app.py).';
        } else {
          errorMsg = 'Registration failed. Please try again.';
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const updateProfile = async (bio, avatar_url) => {
    try {
      const res = await api.put('/auth/profile', { bio, avatar_url });
      setUser(res.data.user);
      localStorage.setItem('miniforum_user', JSON.stringify(res.data.user));
      showToast('Profile updated!');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update profile.' };
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const openProfileModal = () => setProfileModalOpen(true);
  const closeProfileModal = () => setProfileModalOpen(false);

  const openCreatePostModal = (post = null) => {
    if (!user) {
      openAuthModal('login');
      showToast('Please log in or register to create a post.', 'info');
      return;
    }
    setPostToEdit(post);
    setCreatePostModalOpen(true);
  };

  const closeCreatePostModal = () => {
    setPostToEdit(null);
    setCreatePostModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userStats,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        // Modal states
        authModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
        profileModalOpen,
        openProfileModal,
        closeProfileModal,
        createPostModalOpen,
        postToEdit,
        openCreatePostModal,
        closeCreatePostModal,
        // Toast
        toast,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
