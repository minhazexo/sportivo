import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Users, Eye, Clock, MousePointer, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: string;
  topPages: { path: string; views: number }[];
  topArticles: { title: string; views: number }[];
  trafficSources: { source: string; visitors: number }[];
}

const MOCK_DATA: AnalyticsData = {
  pageViews: 124500,
  uniqueVisitors: 45600,
  avgSessionDuration: '3:42',
  bounceRate: '42%',
  topPages: [
    { path: '/', views: 45000 },
    { path: '/article/arsenal-title-charge', views: 12000 },
    { path: '/leagues', views: 8500 },
    { path: '/teams', views: 6200 },
    { path: '/fixtures', views: 4800 },
  ],
  topArticles: [
    { title: "Arsenal's Title Charge: How Arteta Built a Defensive Fortress", views: 12000 },
    { title: "The Rise of Wemby: How NBA's Alien is Breaking Every Rule", views: 9800 },
    { title: "Mbappé deal finalized; medical scheduled for Monday", views: 8200 },
  ],
  trafficSources: [
    { source: 'Google', visitors: 28500 },
    { source: 'Direct', visitors: 15200 },
    { source: 'Twitter', visitors: 8900 },
    { source: 'Facebook', visitors: 6200 },
    { source: 'Other', visitors: 3800 },
  ]
};

export default function AnalyticsDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [data] = useState<AnalyticsData>(MOCK_DATA);
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7d');

  if (authLoading) return <div className="p-20 text-center uppercase editorial-label text-zinc-400">Loading...</div>;

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-zinc-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-accent" />
            <h1 className="editorial-title text-3xl">Analytics Dashboard</h1>
          </div>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-zinc-200 rounded-lg editorial-label"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 border border-zinc-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-5 h-5 text-zinc-400" />
            <span className="flex items-center gap-1 text-green-500 text-sm font-bold">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <span className="editorial-label text-zinc-400">Page Views</span>
          <p className="text-4xl font-display font-black mt-2">{data.pageViews.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 border border-zinc-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-5 h-5 text-zinc-400" />
            <span className="flex items-center gap-1 text-green-500 text-sm font-bold">
              <TrendingUp className="w-3 h-3" /> +8%
            </span>
          </div>
          <span className="editorial-label text-zinc-400">Unique Visitors</span>
          <p className="text-4xl font-display font-black mt-2">{data.uniqueVisitors.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 border border-zinc-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span className="flex items-center gap-1 text-green-500 text-sm font-bold">
              <TrendingUp className="w-3 h-3" /> +5%
            </span>
          </div>
          <span className="editorial-label text-zinc-400">Avg. Session</span>
          <p className="text-4xl font-display font-black mt-2">{data.avgSessionDuration}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 border border-zinc-200"
        >
          <div className="flex items-center justify-between mb-4">
            <MousePointer className="w-5 h-5 text-zinc-400" />
            <span className="flex items-center gap-1 text-red-500 text-sm font-bold">
              <TrendingDown className="w-3 h-3" /> -2%
            </span>
          </div>
          <span className="editorial-label text-zinc-400">Bounce Rate</span>
          <p className="text-4xl font-display font-black mt-2">{data.bounceRate}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 border border-zinc-200">
          <h3 className="editorial-title text-xl mb-6">Top Pages</h3>
          <div className="space-y-4">
            {data.topPages.map((page, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate max-w-[200px]">{page.path}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent" 
                      style={{ width: `${(page.views / data.topPages[0].views) * 100}%` }} 
                    />
                  </div>
                  <span className="text-sm font-mono text-zinc-500 w-16 text-right">{page.views.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 border border-zinc-200">
          <h3 className="editorial-title text-xl mb-6">Traffic Sources</h3>
          <div className="space-y-4">
            {data.trafficSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium">{source.source}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black" 
                      style={{ width: `${(source.visitors / data.trafficSources[0].visitors) * 100}%` }} 
                    />
                  </div>
                  <span className="text-sm font-mono text-zinc-500 w-16 text-right">{source.visitors.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border border-zinc-200">
        <h3 className="editorial-title text-xl mb-6">Top Articles</h3>
        <div className="space-y-3">
          {data.topArticles.map((article, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-400">
                  {idx + 1}
                </span>
                <span className="font-medium line-clamp-1 max-w-md">{article.title}</span>
              </div>
              <span className="font-mono text-accent font-bold">{article.views.toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}