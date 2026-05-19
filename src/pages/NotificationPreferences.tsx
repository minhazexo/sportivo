import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function NotificationPreferences() {
  const { preferences, updatePreferences, loading } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const settings = [
    {
      key: 'matchStartReminders' as const,
      title: 'Match Start Reminders',
      description: 'Get notified when your followed teams are about to play',
    },
    {
      key: 'teamNewsUpdates' as const,
      title: 'Team News Updates',
      description: 'Receive updates about transfers, injuries, and team announcements',
    },
    {
      key: 'articleAlerts' as const,
      title: 'Article Alerts',
      description: 'Get notified when new articles are published about your followed teams',
    },
    {
      key: 'systemNotifications' as const,
      title: 'System Notifications',
      description: 'Important updates about your account and the platform',
    },
  ];

  async function toggleSetting(key: typeof settings[number]['key']) {
    setSaving(true);
    await updatePreferences({ [key]: !preferences[key] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="text-[var(--color-text-tertiary)] hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-black uppercase tracking-tight">Notification Preferences</h1>
        </div>
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700"
        >
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm font-bold text-green-700">Preferences saved successfully</span>
        </motion.div>
      )}

      <div className="bg-[var(--color-card-bg)] rounded-lg border border-[var(--color-border-primary)] divide-y divide-[var(--color-border-primary)]">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className="p-6 flex items-center justify-between hover:bg-[var(--color-card-hover)] transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-bold text-editorial-text">{setting.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{setting.description}</p>
            </div>
            <button
              onClick={() => toggleSetting(setting.key)}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences[setting.key] ? 'bg-accent' : 'bg-[var(--color-text-tertiary)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--color-card-bg)] rounded-full shadow transition-transform ${
                  preferences[setting.key] ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
