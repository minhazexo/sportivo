import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, DollarSign, Plus, Trash2, Edit2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface AdPlacement {
  id: string;
  name: string;
  location: string;
  adClient: string;
  adSlot: string;
  active: boolean;
  impressions: number;
  clicks: number;
}

const MOCK_ADS: AdPlacement[] = [
  { id: '1', name: 'Header Banner', location: 'header', adClient: 'ca-pub-123456', adSlot: '1234567890', active: true, impressions: 45000, clicks: 1200 },
  { id: '2', name: 'Sidebar Rectangle', location: 'sidebar', adClient: 'ca-pub-123456', adSlot: '1234567891', active: true, impressions: 32000, clicks: 850 },
  { id: '3', name: 'In-Article Ad', location: 'article', adClient: 'ca-pub-123456', adSlot: '1234567892', active: true, impressions: 28000, clicks: 620 },
  { id: '4', name: 'Footer Banner', location: 'footer', adClient: 'ca-pub-123456', adSlot: '1234567893', active: false, impressions: 15000, clicks: 180 },
];

export default function AdManagement() {
  const { profile, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<AdPlacement[]>(MOCK_ADS);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    location: 'sidebar',
    adClient: '',
    adSlot: ''
  });

  useState(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
    }
  });

  function toggleAd(id: string) {
    setAds(ads.map(ad => ad.id === id ? { ...ad, active: !ad.active } : ad));
  }

  function deleteAd(id: string) {
    if (!window.confirm('Delete this ad placement?')) return;
    setAds(ads.filter(a => a.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newAd: AdPlacement = {
      id: Date.now().toString(),
      ...formData,
      active: true,
      impressions: 0,
      clicks: 0
    };
    setAds([...ads, newAd]);
    setShowForm(false);
    setFormData({ name: '', location: 'sidebar', adClient: '', adSlot: '' });
  }

  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-zinc-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-accent" />
            <h1 className="editorial-title text-3xl">Ad Management</h1>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white editorial-label hover:bg-black transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Ad
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 border border-zinc-200 rounded-2xl space-y-4">
          <h3 className="editorial-title text-xl">New Ad Placement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="editorial-label text-zinc-400 mb-1 block">Ad Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-zinc-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="editorial-label text-zinc-400 mb-1 block">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2 border border-zinc-200 rounded-lg"
              >
                <option value="header">Header</option>
                <option value="sidebar">Sidebar</option>
                <option value="article">In-Article</option>
                <option value="footer">Footer</option>
              </select>
            </div>
            <div>
              <label className="editorial-label text-zinc-400 mb-1 block">Ad Client (pub-)</label>
              <input
                type="text"
                value={formData.adClient}
                onChange={(e) => setFormData({ ...formData, adClient: e.target.value })}
                className="w-full p-2 border border-zinc-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="editorial-label text-zinc-400 mb-1 block">Ad Slot ID</label>
              <input
                type="text"
                value={formData.adSlot}
                onChange={(e) => setFormData({ ...formData, adSlot: e.target.value })}
                className="w-full p-2 border border-zinc-200 rounded-lg"
                required
              />
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-black text-white editorial-label hover:bg-accent transition-colors">
            Save Ad
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 border border-zinc-200">
          <span className="editorial-label text-zinc-400">Total Impressions</span>
          <p className="text-4xl font-display font-black mt-2">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200">
          <span className="editorial-label text-zinc-400">Total Clicks</span>
          <p className="text-4xl font-display font-black mt-2">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200">
          <span className="editorial-label text-zinc-400">Average CTR</span>
          <p className="text-4xl font-display font-black mt-2">{avgCTR}%</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="p-4 editorial-label text-zinc-500">Ad Name</th>
              <th className="p-4 editorial-label text-zinc-500">Location</th>
              <th className="p-4 editorial-label text-zinc-500">Ad Client</th>
              <th className="p-4 editorial-label text-zinc-500">Status</th>
              <th className="p-4 editorial-label text-zinc-500">Stats</th>
              <th className="p-4 editorial-label text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <motion.tr
                key={ad.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-zinc-50 hover:bg-zinc-50/50"
              >
                <td className="p-4 font-medium">{ad.name}</td>
                <td className="p-4">
                  <span className="editorial-label text-[9px] bg-zinc-100 px-2 py-1">{ad.location}</span>
                </td>
                <td className="p-4 text-sm text-zinc-500 font-mono">{ad.adClient}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleAd(ad.id)}
                    className={`flex items-center gap-1 text-xs font-bold uppercase ${ad.active ? 'text-green-600' : 'text-zinc-400'}`}
                  >
                    {ad.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {ad.active ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td className="p-4 text-sm">
                  <span className="text-zinc-500">{ad.impressions.toLocaleString()} imp</span>
                  <span className="text-zinc-300 mx-2">•</span>
                  <span className="text-accent">{ad.clicks.toLocaleString()} clicks</span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}