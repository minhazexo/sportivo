import { Link } from 'react-router-dom';
import { Trophy, Home, Newspaper, Users, LogIn, User as UserIcon, LogOut, Search, Bookmark, Menu, X, ChevronDown, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

// ─── Navigation Links ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Scores', href: '/fixtures' },
  { label: 'World Cup', href: '/world-cup', icon: Trophy },
  { label: 'Leagues', href: '/leagues' },
  { label: 'Standings', href: '/standings' },
  { label: 'Teams', href: '/teams' },
  { label: 'Tags', href: '/tags' },
];

const SPORT_QUICK_LINKS = [
  { label: 'Premier League', href: '/leagues' },
  { label: 'La Liga', href: '/leagues' },
  { label: 'NBA', href: '/leagues' },
  { label: 'F1', href: '/leagues' },
];

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="text-[11px] font-semibold uppercase tracking-wide text-gray-300 hover:text-white nav-underline transition-colors duration-150 whitespace-nowrap"
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { user, profile, login, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSportLinks, setShowSportLinks] = useState(false);

  return (
    <nav className="bg-espn-dark text-white sticky top-0 z-50 border-b border-gray-800 dark:border-gray-700/30">
      {/* Top Bar - Logo + Navigation + User */}
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo + Primary Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="group-hover:text-accent transition-colors">Sportivo</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-5">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} to={item.href}>
                  {item.label}
                </NavLink>
              ))}

              {/* Leagues dropdown trigger */}
              <div
                className="relative"
                onMouseEnter={() => setShowSportLinks(true)}
                onMouseLeave={() => setShowSportLinks(false)}
              >
                <button className="text-[11px] font-semibold uppercase tracking-wide text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                  Sports <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {showSportLinks && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 mt-2 rounded-sm shadow-lg border py-2 min-w-[180px] z-50"
                      style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
                    >
                      {SPORT_QUICK_LINKS.map((link) => (
                        <Link
                          key={link.label}
                          to={link.href}
                          className="block px-4 py-2 text-[12px] font-semibold hover:text-accent transition-colors uppercase tracking-wide"
                          style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--color-border-primary)' }}>
                        <Link
                          to="/leagues"
                          className="block px-4 py-2 text-[11px] font-bold text-accent hover:bg-gray-100 transition-colors uppercase tracking-wider"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          View All Leagues
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Side - Search + Notifications + User */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-gray-400 hover:text-white transition-colors hidden md:block"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Search bar */}
            <Link
              to="/search"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-sm hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-gray-300"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium tracking-wide">Search sports...</span>
              <span className="text-[8px] text-gray-600 border border-gray-700 px-1.5 py-0.5 rounded">Ctrl+K</span>
            </Link>

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* User Section */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-500 hover:text-accent transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 ml-1">
                  <div className="w-7 h-7 rounded-full bg-gray-800 overflow-hidden border border-gray-700 hover:border-accent/50 transition-colors">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-[10px] font-bold">
                        {(profile?.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-white leading-tight max-w-[80px] truncate">
                      {profile?.displayName || user.displayName}
                    </span>
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">{profile?.role}</span>
                  </div>
                </div>
                <Link
                  to="/bookmarks"
                  className="p-1.5 text-gray-500 hover:text-accent transition-colors relative"
                  title="Saved"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-[9px] font-bold uppercase tracking-wider text-accent hover:text-white transition-colors border border-accent/30 px-2 py-0.5 rounded-sm ml-1"
                  >
                    Admin
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wider hover:bg-accent-dark transition-colors rounded-sm"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-gray-800 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block py-2.5 text-[12px] font-semibold text-gray-300 hover:text-white px-3 rounded transition-colors uppercase tracking-wide"
                  style={{}}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-gray-500" />
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* Sports sub-links in mobile */}
              <div className="pt-2 pb-1 border-t border-gray-800">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600 px-3 mb-1">Quick Links</p>
                {SPORT_QUICK_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="block py-2 px-3 text-[11px] font-medium text-gray-400 hover:text-white rounded transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Mobile search */}
              <Link
                to="/search"
                className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-gray-400 hover:text-white rounded transition-colors mt-2"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="w-3.5 h-3.5" />
                Search articles...
              </Link>

              {/* Mobile user section */}
              <div className="pt-3 mt-2 border-t border-gray-800">
                {user ? (
                  <>
                    {profile?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block py-2 px-3 text-[11px] font-bold text-accent hover:bg-gray-800/50 rounded transition-colors uppercase tracking-wider mb-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/bookmarks"
                      className="flex items-center gap-2 py-2 px-3 text-[12px] text-gray-300 hover:text-white hover:bg-gray-800/50 rounded transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bookmark className="w-3.5 h-3.5 text-gray-500" />
                      Saved Articles
                    </Link>
                    <div className="flex items-center justify-between px-3 py-3 mt-2 bg-gray-800/30 rounded">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-xs font-bold">
                              {(profile?.displayName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">{profile?.displayName || user.displayName}</p>
                          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">{profile?.role || 'user'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="text-[10px] font-bold text-gray-400 hover:text-accent transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => { login(); setMobileMenuOpen(false); }}
                    className="w-full py-3 bg-accent text-white text-[11px] font-bold uppercase tracking-wider hover:bg-accent-dark transition-colors rounded-sm"
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
