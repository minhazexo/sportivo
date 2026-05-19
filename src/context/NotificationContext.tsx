import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../lib/apiClient';

export interface Notification {
  id: string;
  userId: string;
  type: 'match_start' | 'team_news' | 'article_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationPreferences {
  matchStartReminders: boolean;
  teamNewsUpdates: boolean;
  articleAlerts: boolean;
  systemNotifications: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  matchStartReminders: true,
  teamNewsUpdates: true,
  articleAlerts: true,
  systemNotifications: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.get('/notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch notifications:', error);
    }
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.get('/notifications/preferences');
      if (data) {
        setPreferences({
          matchStartReminders: !!data.matchStartReminders,
          teamNewsUpdates: !!data.teamNewsUpdates,
          articleAlerts: !!data.articleAlerts,
          systemNotifications: !!data.systemNotifications,
        });
      }
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch notification preferences:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchNotifications(), fetchPreferences()]).finally(() => {
      setLoading(false);
    });

    // Optional: Poll for new notifications every 60 seconds to keep UI fresh without overloading Neon
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications, fetchPreferences]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await apiClient.put(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('[NotificationContext] Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await apiClient.put('/notifications/read-all', {});
    } catch (error) {
      console.error('[NotificationContext] Error marking all notifications as read:', error);
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!user) return;
    setPreferences(prev => ({ ...prev, ...prefs }));
    try {
      const updated = await apiClient.put('/notifications/preferences', prefs);
      if (updated) {
        setPreferences({
          matchStartReminders: !!updated.matchStartReminders,
          teamNewsUpdates: !!updated.teamNewsUpdates,
          articleAlerts: !!updated.articleAlerts,
          systemNotifications: !!updated.systemNotifications,
        });
      }
    } catch (error) {
      console.error('[NotificationContext] Error updating notification preferences:', error);
      fetchPreferences();
    }
  }, [user, fetchPreferences]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      preferences,
      updatePreferences,
      refreshNotifications: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
