import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LayoutDashboard, FileText, Settings, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    async function fetchArticles() {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchArticles();
  }, [profile, authLoading, navigate]);

  async function handleDelete(id: string) {
    if (window.confirm('Delete this article?')) {
      await deleteDoc(doc(db, 'articles', id));
      setArticles(articles.filter(a => a.id !== id));
    }
  }

  if (authLoading || loading) return <div className="p-20 text-center uppercase editorial-label text-zinc-400">Loading Dashboard...</div>;

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
            <Link to="/admin/articles/new" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              <FileText className="w-4 h-4" /> Articles
            </Link>
            <Link to="#" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
            <Link to="#" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Stats & Management */}
      <div className="md:col-span-3 space-y-8">
        <header className="flex justify-between items-center border-b border-zinc-200 pb-4">
          <h1 className="editorial-title text-3xl">Manage Content</h1>
          <Link 
            to="/admin/articles/new"
            className="flex items-center gap-2 px-6 py-2 bg-accent text-white editorial-label hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4" /> New Article
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 border border-zinc-200">
            <span className="editorial-label text-zinc-400">Total Articles</span>
            <p className="text-4xl font-display font-black mt-2">{articles.length}</p>
          </div>
          <div className="bg-white p-6 border border-zinc-200">
            <span className="editorial-label text-zinc-400">Total Views</span>
            <p className="text-4xl font-display font-black mt-2">12.4K</p>
          </div>
          <div className="bg-white p-6 border border-zinc-200">
            <span className="editorial-label text-zinc-400">Engagement</span>
            <p className="text-4xl font-display font-black mt-2">8.2%</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="p-4 editorial-label text-zinc-500">Title</th>
                <th className="p-4 editorial-label text-zinc-500">Category</th>
                <th className="p-4 editorial-label text-zinc-500">Status</th>
                <th className="p-4 editorial-label text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-black text-editorial-text line-clamp-1">{article.title}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-1">{article.slug}</p>
                  </td>
                  <td className="p-4">
                    <span className="editorial-label text-[9px] bg-zinc-100 px-2 py-1">{article.category}</span>
                  </td>
                  <td className="p-4">
                    <span className={`editorial-label text-[9px] ${article.status === 'published' ? 'text-green-600' : 'text-zinc-400'}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                        className="p-2 text-zinc-400 hover:text-accent transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
