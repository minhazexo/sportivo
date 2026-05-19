import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LayoutDashboard, FileText, Settings, BarChart3, Users, Database, RefreshCw, CheckCircle, XCircle, Clock, Newspaper, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import apiClient from '../../lib/apiClient';

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="p-3 border border-[var(--color-border-primary)] hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-accent" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      </div>
      <p className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    async function fetchArticles() {
      try {
        const data = await apiClient.get('/articles');
        setArticles(data || []);
      } catch (error) {
        console.error('[AdminDashboard] Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (profile?.role === 'admin') {
      fetchArticles();
      fetchDbStats();
    }

    async function fetchDbStats() {
      try {
        const data = await apiClient.get('/admin/db-stats');
        setDbStats(data);
      } catch (error) {
        console.error('[AdminDashboard] Failed to fetch DB stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
  }, [profile, authLoading, navigate]);

  async function handleDelete(id: string) {
    if (window.confirm('Are you absolutely sure you want to delete this article? This action is irreversible.')) {
      try {
        await apiClient.delete(`/articles/${id}`);
        setArticles(prev => prev.filter(a => a.id !== id));
      } catch (error) {
        console.error('[AdminDashboard] Failed to delete article:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete article');
      }
    }
  }

  async function handleIngest() {
    if (ingesting) return;
    setIngesting(true);
    setIngestResult(null);
    try {
      await apiClient.post('/admin/ingest', {});
      setIngestResult('started');
      // Poll stats every 3s for 20 seconds to refresh dashboard after ingestion
      let pollCount = 0;
      const maxPolls = 7;
      const pollInterval = setInterval(async () => {
        pollCount++;
        try {
          const data = await apiClient.get('/admin/db-stats');
          setDbStats(data);
        } catch {}
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIngesting(false);
        }
      }, 3000);
    } catch (error) {
      console.error('[AdminDashboard] Ingestion failed:', error);
      setIngestResult('failed');
      setIngesting(false);
    }
  }

  if (authLoading || loading) return <div className="p-20 text-center uppercase editorial-label text-[var(--color-text-tertiary)]">Loading Dashboard...</div>;

  // Calculate views sum
  const totalViews = articles.reduce((sum, art) => sum + (art.views || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="bg-black text-white p-6">
          <h2 className="editorial-title text-xl mb-6">Control Panel</h2>
          <nav className="space-y-4">
            <Link to="/admin" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-accent">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </Link>
            <Link to="/admin" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[var(--color-navbar-text)] hover:text-white transition-colors">
              <FileText className="w-4 h-4" /> Articles
            </Link>
            <Link to="/admin/users" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[var(--color-navbar-text)] hover:text-white transition-colors">
              <Users className="w-4 h-4" /> Users
            </Link>
            <Link to="/admin/analytics" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[var(--color-navbar-text)] hover:text-white transition-colors">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[var(--color-navbar-text)] hover:text-white transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Stats & Management */}
      <div className="md:col-span-3 space-y-8">
        <header className="flex justify-between items-center border-b border-[var(--color-border-primary)] pb-4">
          <h1 className="editorial-title text-3xl">Manage Content</h1>
          <Link 
            to="/admin/articles/new"
            className="flex items-center gap-2 px-6 py-2 bg-accent text-white editorial-label hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4" /> New Article
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--color-card-bg)] p-6 border border-[var(--color-border-primary)]">
            <span className="editorial-label text-[var(--color-text-tertiary)]">Total Articles</span>
            <p className="text-4xl font-display font-black mt-2">{articles.length}</p>
          </div>
          <div className="bg-[var(--color-card-bg)] p-6 border border-[var(--color-border-primary)]">
            <span className="editorial-label text-[var(--color-text-tertiary)]">Total Views</span>
            <p className="text-4xl font-display font-black mt-2">{totalViews}</p>
          </div>
          <div className="bg-[var(--color-card-bg)] p-6 border border-[var(--color-border-primary)]">
            <span className="editorial-label text-[var(--color-text-tertiary)]">Status Distribution</span>
            <p className="text-lg font-display font-bold mt-2 text-[var(--color-text-secondary)]">
              {articles.filter(a => a.status === 'published').length} Pub / {articles.filter(a => a.status !== 'published').length} Draft
            </p>
          </div>
        </div>

        {/* Data Ingestion Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-card-bg)] p-6 border border-[var(--color-border-primary)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-accent" />
              <h2 className="editorial-title text-lg">Data Ingestion</h2>
            </div>
            <button
              onClick={handleIngest}
              disabled={ingesting}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wider hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            >
              <RefreshCw className={`w-4 h-4 ${ingesting ? 'animate-spin' : ''}`} />
              {ingesting ? 'Ingesting...' : 'Ingest Data Now'}
            </button>
          </div>

          <p className="text-xs text-[var(--color-text-tertiary)] mb-5 leading-relaxed">
            Fetches free sports data from <strong>TheSportsDB</strong> (scores, fixtures, standings, teams). 
            Data is cached in your database and served automatically. Runs with rate limiting.
          </p>

          {ingestResult === 'started' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 border border-green-600/30 bg-green-600/10 text-green-600 text-xs font-bold uppercase tracking-wider"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              Ingestion started! Data will appear in a few moments.
            </motion.div>
          )}

          {ingestResult === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 border border-red-600/30 bg-red-600/10 text-red-600 text-xs font-bold uppercase tracking-wider"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              Ingestion failed. Check server logs.
            </motion.div>
          )}

          {/* Database Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statsLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-3 border border-[var(--color-border-primary)] animate-pulse">
                  <div className="h-3 w-16 mb-2 rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                  <div className="h-6 w-8 rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                </div>
              ))
            ) : dbStats ? (
              <>
                <StatCard icon={FileText} label="Articles" value={dbStats.counts.articles} />
                <StatCard icon={Trophy} label="Scores & Fixtures" value={dbStats.counts.scoresFixtures} />
                <StatCard icon={Users} label="Teams" value={dbStats.counts.teams} />
                <StatCard icon={BarChart3} label="Standings" value={dbStats.counts.standings} />
                <StatCard icon={Newspaper} label="News Articles" value={dbStats.counts.news} />
                <StatCard icon={Users} label="Users" value={dbStats.counts.users} />
              </>
            ) : (
              <div className="col-span-6 text-center py-4 text-xs text-[var(--color-text-tertiary)]">
                Unable to load database stats
              </div>
            )}
          </div>

          {/* Last Ingested Timestamps */}
          {dbStats?.lastIngested && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
              <div className="flex flex-wrap gap-4 text-[10px] text-[var(--color-text-tertiary)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Scores: {dbStats.lastIngested.scores ? new Date(dbStats.lastIngested.scores).toLocaleString() : 'Never'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Fixtures: {dbStats.lastIngested.fixtures ? new Date(dbStats.lastIngested.fixtures).toLocaleString() : 'Never'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Standings: {dbStats.lastIngested.standings ? new Date(dbStats.lastIngested.standings).toLocaleString() : 'Never'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Teams: {dbStats.lastIngested.teams ? new Date(dbStats.lastIngested.teams).toLocaleString() : 'Never'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  News: {dbStats.lastIngested.news ? new Date(dbStats.lastIngested.news).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        <div className="bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
              <tr>
                <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Title</th>
                <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Category</th>
                <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Views</th>
                <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Status</th>
                <th className="p-4 editorial-label text-[var(--color-text-secondary)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-[var(--color-border-primary)] hover:bg-[var(--color-card-hover)] transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-black text-[var(--color-text-primary)] line-clamp-1">{article.title}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono mt-1">{article.slug}</p>
                  </td>
                  <td className="p-4">
                    <span className="editorial-label text-[9px] bg-[var(--color-bg-tertiary)] px-2 py-1">{article.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-mono text-[var(--color-text-secondary)]">{article.views || 0}</span>
                  </td>
                  <td className="p-4">
                    <span className={`editorial-label text-[9px] ${article.status === 'published' ? 'text-green-600 font-black' : 'text-[var(--color-text-tertiary)] font-medium'}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                        className="p-2 text-[var(--color-text-tertiary)] hover:text-accent transition-colors"
                        title="Edit Article"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)}
                        className="p-2 text-[var(--color-text-tertiary)] hover:text-red-600 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--color-text-tertiary)] font-medium">
                    No articles found. Click "New Article" to create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
