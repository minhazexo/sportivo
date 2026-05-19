import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, X, Eye, EyeOff, Sparkles, LogIn, ChevronRight } from 'lucide-react';
import apiClient from '../lib/apiClient';

interface UserType {
  id: string;
  uid: string; // Firebase compatibility alias
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  favoriteTeams: string[];
  bookmarkedArticles: string[];
}

interface AuthContextType {
  user: UserType | null;
  profile: UserType | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiClient.get('/users/profile');
      if (data) {
        // Map backend User schema back to standard auth context
        const userObj: UserType = {
          id: data.id,
          uid: data.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role,
          favoriteTeams: data.favoriteTeams || [],
          bookmarkedArticles: data.bookmarkedArticles || []
        };
        setProfile(userObj);
        setUser(userObj);
      }
    } catch (error) {
      console.error('[AuthContext] Session invalid or failed:', error);
      // Clear expired session
      localStorage.removeItem('sportivo_auth_token');
      setProfile(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sportivo_auth_token');
    if (token) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = () => {
    setAuthModalOpen(true);
  };

  const logout = async () => {
    localStorage.removeItem('sportivo_auth_token');
    setProfile(null);
    setUser(null);
    setAuthModalOpen(false);
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('sportivo_auth_token');
    if (token) {
      await fetchProfile();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login,
      logout,
      refreshProfile,
      isAuthModalOpen,
      setAuthModalOpen
    }}>
      {children}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setAuthModalOpen(false)}
            onSuccess={(userData, token) => {
              localStorage.setItem('sportivo_auth_token', token);
              const userObj: UserType = {
                id: userData.id,
                uid: userData.id,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                role: userData.role,
                favoriteTeams: userData.favoriteTeams || [],
                bookmarkedArticles: userData.bookmarkedArticles || []
              };
              setUser(userObj);
              setProfile(userObj);
              setAuthModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ----------------------------------------------------
// 🌟 Premium Credentials Login & Sign-Up Modal
// ----------------------------------------------------
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType, token: string) => void;
}

function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!email || !password) {
      setErrorMsg("All fields are required");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Register in Neon PostgreSQL
        const data = await apiClient.post('/auth/register', {
          email,
          password,
          displayName: name || null,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}` // Beautiful dynamic robot avatar!
        });
        onSuccess(data.user, data.token);
      } else {
        // Login in Neon PostgreSQL
        const data = await apiClient.post('/auth/login', { email, password });
        onSuccess(data.user, data.token);
      }
    } catch (err) {
      console.error('[AuthModal] Submission failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-8 text-white z-10"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 text-accent">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="editorial-title text-3xl font-black uppercase tracking-wider mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
            {isSignUp ? 'Get started with Sportivo & Neon' : 'Sign in to manage your Sportivo experience'}
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider text-center"
            >
              ⚠️ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Display Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Saiful Islam"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-accent focus:bg-zinc-900 outline-none transition-all placeholder-zinc-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-accent focus:bg-zinc-900 outline-none transition-all placeholder-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-12 pr-12 py-3 text-sm focus:border-accent focus:bg-zinc-900 outline-none transition-all placeholder-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-white text-black hover:bg-accent hover:text-white transition-colors rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Toggle link */}
        <div className="mt-8 text-center text-zinc-500 text-xs font-semibold uppercase tracking-widest">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-white hover:text-accent font-black transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
