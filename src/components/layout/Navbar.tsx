import { Link } from 'react-router-dom';
import { Trophy, Home, Newspaper, Users, LogIn, User as UserIcon, LogOut, Search, Bookmark, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, profile, login, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="editorial-title text-2xl group-hover:text-accent transition-colors">SPORTIVO</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="editorial-label text-white hover:text-accent transition-colors">
                Home
              </Link>
              <Link to="/leagues" className="editorial-label text-white hover:text-accent transition-colors">
                Leagues
              </Link>
              <Link to="/fixtures" className="editorial-label text-white hover:text-accent transition-colors">
                Fixtures
              </Link>
              <Link to="/standings" className="editorial-label text-white hover:text-accent transition-colors">
                Standings
              </Link>
              <Link to="/teams" className="editorial-label text-white hover:text-accent transition-colors">
                Teams
              </Link>
              <Link to="/tags" className="editorial-label text-white hover:text-accent transition-colors">
                Tags
              </Link>
              <Link to="/search" className="editorial-label text-white hover:text-accent transition-colors flex items-center gap-1">
                <Search className="w-3 h-3" /> Search
              </Link>
              {user && (
                <Link to="/bookmarks" className="editorial-label text-white hover:text-accent transition-colors flex items-center gap-1">
                  <Bookmark className="w-3 h-3" /> Saved
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link to="/admin" className="editorial-label text-accent hover:text-white transition-colors border border-accent/30 px-2 py-1 rounded">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && <NotificationBell />}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-accent transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden lg:flex w-48 h-8 bg-zinc-800 rounded items-center px-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Search sportivo...
            </div>
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">{profile?.displayName || user.displayName}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(user.uid);
                        alert('UID Copied!');
                      }}
                      className="text-[8px] text-accent hover:underline font-bold uppercase transition-all"
                    >
                      Copy UID
                    </button>
                    <span className="text-zinc-600 text-[8px]">•</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">{profile?.role}</span>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-accent transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-full h-full p-2 text-zinc-500" />
                  )}
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={login}
                className="hidden md:block px-6 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-colors"
              >
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-zinc-800 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              <Link to="/" className="block editorial-label text-white hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/leagues" className="block editorial-label text-white hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Leagues
              </Link>
              <Link to="/fixtures" className="block editorial-label text-white hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Fixtures
              </Link>
              <Link to="/standings" className="block editorial-label text-white hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Standings
              </Link>
              <Link to="/teams" className="block editorial-label text-white hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Teams
              </Link>
              <Link to="/tags" className="block editorial-label text-white hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Tags
              </Link>
              <Link to="/search" className="block editorial-label text-white hover:text-accent transition-colors flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                <Search className="w-3 h-3" /> Search
              </Link>
              {user && (
                <>
                  <Link to="/bookmarks" className="block editorial-label text-white hover:text-accent transition-colors flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                    <Bookmark className="w-3 h-3" /> Saved {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="block editorial-label text-accent hover:text-white transition-colors border border-accent/30 px-2 py-1 rounded inline-block" onClick={() => setMobileMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">{profile?.displayName || user.displayName}</span>
                      <button 
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="text-[10px] text-zinc-400 hover:text-accent transition-colors uppercase font-bold"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
              {!user && (
                <button
                  onClick={() => { login(); setMobileMenuOpen(false); }}
                  className="w-full py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
