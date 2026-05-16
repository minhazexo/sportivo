import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  type: 'match_start' | 'team_news' | 'article_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

export interface NotificationPreferences {
  matchStartReminders: boolean;
  teamNewsUpdates: boolean;
  articleAlerts: boolean;
  systemNotifications: boolean;
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

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const path = 'notifications';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        console.error("Failed to handle firestore error", e);
      }
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function fetchPreferences() {
      try {
        const q = query(
          collection(db, 'notificationPreferences'),
          where('userId', '==', user.uid),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const prefs = snapshot.docs[0].data() as NotificationPreferences;
          setPreferences({ ...defaultPreferences, ...prefs });
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      }
    }

    fetchPreferences();
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(n => 
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user, notifications]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notificationPreferences'),
        where('userId', '==', user.uid),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      const newPrefs = { ...preferences, ...prefs, userId: user.uid, updatedAt: serverTimestamp() };
      
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'notificationPreferences', snapshot.docs[0].id), newPrefs);
      } else {
        await addDoc(collection(db, 'notificationPreferences'), newPrefs);
      }
      setPreferences(prev => ({ ...prev, ...prefs }));
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    }
  }, [user, preferences]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      preferences,
      updatePreferences,
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
