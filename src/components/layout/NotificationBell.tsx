import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'match_start': return '⚽';
      case 'team_news': return '📰';
      case 'article_alert': return '📄';
      case 'system': return '🔔';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--color-text-tertiary)] hover:text-accent transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden"
            style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-primary)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-accent hover:underline font-bold uppercase flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <Link
                  to="/notifications/preferences"
                  className="text-[var(--color-text-tertiary)] hover:text-accent transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-[var(--color-text-tertiary)] text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No notifications</div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b transition-colors cursor-pointer ${
                      !notification.read ? '' : ''
                    }`}
                    style={{ 
                      borderColor: 'var(--color-border-primary)',
                      backgroundColor: !notification.read ? 'var(--color-bg-tertiary)' : 'transparent',
                      color: 'var(--color-text-primary)'
                    }}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {notification.title}
                        </p>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {notification.message}
                        </p>
                        <span className="text-[10px] mt-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
                          {formatDistanceToNow(new Date(notification.createdAt))} ago
                        </span>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
