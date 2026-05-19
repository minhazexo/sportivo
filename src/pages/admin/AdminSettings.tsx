import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, ChevronLeft, Save, User, Globe, Activity, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import apiClient from '../../lib/apiClient';

interface SiteConfig {
  id: string;
  siteName: string;
  siteDescription: string;
  socialTwitter: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  contactEmail: string | null;
}

interface AdminProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

interface ApiStatus {
  gemini: boolean;
  newsapi: boolean;
  apiFootball: boolean;
  sportmonks: boolean;
  googleAnalytics: boolean;
  googleAdsense: boolean;
  siteUrl: string;
  appUrl: string;
}

export default function AdminSettings() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    id: 'default',
    siteName: '',
    siteDescription: '',
    socialTwitter: '',
    socialFacebook: '',
    socialInstagram: '',
    contactEmail: '',
  });
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [siteSaved, setSiteSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    async function fetchSettings() {
      try {
        const [settingsData, apiStatusData] = await Promise.all([
          apiClient.get('/admin/settings'),
          apiClient.get('/admin/settings/api-status'),
        ]);

        if (settingsData) {
          setSiteConfig(settingsData.siteConfig || siteConfig);
          setAdminProfile(settingsData.adminProfile || null);
          setDisplayName(settingsData.adminProfile?.displayName || '');
          setPhotoURL(settingsData.adminProfile?.photoURL || '');
        }
        if (apiStatusData) {
          setApiStatus(apiStatusData);
        }
      } catch (error) {
        console.error('[AdminSettings] Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.role === 'admin') {
      fetchSettings();
    }
  }, [profile, authLoading, navigate]);

  async function handleSaveSiteConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingSite(true);
    setSiteSaved(false);
    try {
      const updated = await apiClient.put('/admin/settings', siteConfig);
      if (updated) setSiteConfig(updated);
      setSiteSaved(true);
      setTimeout(() => setSiteSaved(false), 3000);
    } catch (error) {
      console.error('[AdminSettings] Failed to save site config:', error);
      alert(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSavingSite(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await apiClient.post('/users/profile', { displayName, photoURL });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error) {
      console.error('[AdminSettings] Failed to save profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-accent animate-spin" />
        <span className="ml-3 uppercase editorial-label text-[var(--color-text-tertiary)]">Loading Settings...</span>
      </div>
    );
  }

  const apiServices = apiStatus ? [
    { key: 'gemini', label: 'Google Gemini AI', configured: apiStatus.gemini },
    { key: 'newsapi', label: 'NewsAPI.org', configured: apiStatus.newsapi },
    { key: 'apiFootball', label: 'API-Football', configured: apiStatus.apiFootball },
    { key: 'sportmonks', label: 'SportMonks', configured: apiStatus.sportmonks },
    { key: 'googleAnalytics', label: 'Google Analytics', configured: apiStatus.googleAnalytics },
    { key: 'googleAdsense', label: 'Google AdSense', configured: apiStatus.googleAdsense },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-[var(--color-card-hover)] rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-accent" />
            <h1 className="editorial-title text-3xl">Settings</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ===== Site Configuration ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)]"
        >
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-5 h-5 text-accent" />
            <h2 className="editorial-title text-xl">Site Configuration</h2>
          </div>

          <form onSubmit={handleSaveSiteConfig} className="space-y-5">
            <div>
              <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Site Name</label>
              <input
                type="text"
                value={siteConfig.siteName}
                onChange={(e) => setSiteConfig({ ...siteConfig, siteName: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-sm font-medium focus:border-accent outline-none transition-colors"
                placeholder="Sportivo"
              />
            </div>

            <div>
              <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Site Description</label>
              <textarea
                value={siteConfig.siteDescription}
                onChange={(e) => setSiteConfig({ ...siteConfig, siteDescription: e.target.value })}
                className="w-full h-24 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-sm leading-relaxed focus:border-accent outline-none transition-colors"
                placeholder="Your premier destination for sports news..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Twitter URL</label>
                <input
                  type="text"
                  value={siteConfig.socialTwitter || ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, socialTwitter: e.target.value })}
                  className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-mono focus:border-accent outline-none transition-colors"
                  placeholder="https://twitter.com/sportivo"
                />
              </div>
              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Facebook URL</label>
                <input
                  type="text"
                  value={siteConfig.socialFacebook || ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, socialFacebook: e.target.value })}
                  className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-mono focus:border-accent outline-none transition-colors"
                  placeholder="https://facebook.com/sportivo"
                />
              </div>
              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Instagram URL</label>
                <input
                  type="text"
                  value={siteConfig.socialInstagram || ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, socialInstagram: e.target.value })}
                  className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-mono focus:border-accent outline-none transition-colors"
                  placeholder="https://instagram.com/sportivo"
                />
              </div>
              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Contact Email</label>
                <input
                  type="email"
                  value={siteConfig.contactEmail || ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, contactEmail: e.target.value })}
                  className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-mono focus:border-accent outline-none transition-colors"
                  placeholder="contact@sportivo.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSite}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white editorial-label hover:bg-accent transition-colors disabled:opacity-50 text-xs"
            >
              <Save className="w-4 h-4" />
              {savingSite ? 'Saving...' : 'Save Site Settings'}
            </button>

            {siteSaved && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-600 text-xs font-bold uppercase tracking-wider"
              >
                ✓ Site settings saved successfully
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* ===== Admin Profile ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)]"
        >
          <div className="flex items-center gap-3 mb-8">
            <User className="w-5 h-5 text-accent" />
            <h2 className="editorial-title text-xl">Admin Profile</h2>
          </div>

          {adminProfile && (
            <div className="mb-8 flex items-center gap-4 p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
              <div className="w-14 h-14 rounded-full bg-[var(--color-skeleton)] overflow-hidden flex-shrink-0">
                {adminProfile.photoURL ? (
                  <img src={adminProfile.photoURL} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] font-bold text-lg">
                    {(adminProfile.displayName || adminProfile.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-sm">{adminProfile.displayName || 'No Name'}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{adminProfile.email}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-sm font-medium focus:border-accent outline-none transition-colors"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-widest font-bold">Profile Photo URL</label>
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-mono focus:border-accent outline-none transition-colors"
                placeholder="https://example.com/photo.jpg"
              />
              {photoURL && (
                <div className="mt-3 w-16 h-16 rounded-full overflow-hidden border border-[var(--color-border-primary)]">
                  <img src={photoURL} alt="Preview" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white editorial-label hover:bg-accent transition-colors disabled:opacity-50 text-xs"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Updating...' : 'Update Profile'}
            </button>

            {profileSaved && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-600 text-xs font-bold uppercase tracking-wider"
              >
                ✓ Profile updated successfully
              </motion.p>
            )}
          </form>
        </motion.div>
      </div>

      {/* ===== API Status ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)]"
      >
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="editorial-title text-xl">API & Service Status</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiServices.map((service, idx) => (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="flex items-center justify-between p-4 border border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)] transition-colors"
            >
              <span className="text-sm font-medium">{service.label}</span>
              {service.configured ? (
                <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs font-bold uppercase tracking-wider">
                  <XCircle className="w-4 h-4" />
                  Not Set
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {apiStatus && (
          <div className="mt-6 p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)] font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Site URL:</span> {apiStatus.siteUrl}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-1">
              <span className="font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">App URL:</span> {apiStatus.appUrl}
            </p>
            <p className="mt-3 flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">
              <AlertCircle className="w-3 h-3" />
              API keys are managed via environment variables (.env file)
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
