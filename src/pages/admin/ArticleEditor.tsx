import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Save, ChevronLeft, Image as ImageIcon, Layout, FileEdit, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    category: 'Football',
    status: 'draft',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (id) {
      async function fetchArticle() {
        const docRef = doc(db, 'articles', id!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        }
      }
      fetchArticle();
    }
  }, [id, profile, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...formData,
        authorId: user?.uid,
        authorName: profile?.displayName || user?.displayName,
        updatedAt: serverTimestamp(),
      };

      if (id) {
        await setDoc(doc(db, 'articles', id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'articles'), {
          ...data,
          createdAt: serverTimestamp(),
          views: 0
        });
      }
      navigate('/admin');
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateWithAI() {
    if (!formData.title) {
      alert('Please enter a title first');
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a sports article about: ${formData.title}. Include an engaging introduction, key points, and conclusion. Use proper markdown formatting.`,
          type: 'article'
        })
      });
      const data = await response.json();
      if (data.text) {
        setFormData(prev => ({ ...prev, content: data.text }));
      } else if (data.error) {
        alert('AI generation failed: ' + data.error);
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert('Failed to generate content');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/admin')} className="p-2 bg-white border border-zinc-200 hover:border-accent transition-colors rounded-lg">
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <h1 className="editorial-title text-4xl">{id ? 'Edit Story' : 'New Story'}</h1>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-black text-white editorial-label hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Article'}
        </button>
      </header>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="editorial-label text-zinc-400">Article Title</label>
              <button
                type="button"
                onClick={generateWithAI}
                disabled={aiLoading}
                className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <input 
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-4xl font-display font-black p-0 border-none bg-transparent focus:ring-0 outline-none placeholder:text-zinc-200"
              placeholder="The Headlines Start Here..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="editorial-label text-zinc-400">Content (Markdown)</label>
            <textarea 
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-[600px] bg-white border border-zinc-200 p-8 text-lg font-medium leading-relaxed font-sans focus:border-accent outline-none transition-colors no-scrollbar"
              placeholder="Draft your story using markdown syntax..."
              required
            />
          </div>
        </div>

        <aside className="space-y-10">
          <div className="bg-white p-8 border border-zinc-200 space-y-6">
            <h3 className="editorial-label text-zinc-400 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <Layout className="w-4 h-4" /> Publishing Info
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="editorial-label text-[9px] text-zinc-500 mb-1 block">URL Slug</label>
                <input 
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                  className="w-full p-2 bg-zinc-50 border border-zinc-100 text-xs font-mono"
                  placeholder="arsenal-match-report"
                />
              </div>

              <div>
                <label className="editorial-label text-[9px] text-zinc-500 mb-1 block">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 bg-zinc-50 border border-zinc-100 text-xs font-bold uppercase tracking-widest"
                >
                  <option>Football</option>
                  <option>Basketball</option>
                  <option>Tennis</option>
                  <option>Cricket</option>
                  <option>Formula 1</option>
                </select>
              </div>

              <div>
                <label className="editorial-label text-[9px] text-zinc-500 mb-1 block">Status</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`flex-1 py-2 editorial-label text-[9px] text-center border ${formData.status === 'draft' ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-400 border-zinc-200'}`}
                  >
                    Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'published' })}
                    className={`flex-1 py-2 editorial-label text-[9px] text-center border ${formData.status === 'published' ? 'bg-accent text-white border-accent' : 'bg-transparent text-zinc-400 border-zinc-200'}`}
                  >
                    Publish
                  </button>
                </div>
              </div>

              <div>
                <label className="editorial-label text-[9px] text-zinc-500 mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-[9px] font-bold uppercase">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      if (!formData.tags.includes(tagInput.trim())) {
                        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                      }
                      setTagInput('');
                    }
                  }}
                  className="w-full p-2 bg-zinc-50 border border-zinc-100 text-xs"
                  placeholder="Type and press Enter..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 border border-zinc-200 space-y-6">
            <h3 className="editorial-label text-zinc-400 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Media
            </h3>
            <div className="space-y-4">
              <input 
                type="text"
                value={formData.thumbnail}
                onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full p-2 bg-zinc-50 border border-zinc-100 text-xs"
                placeholder="Thumbnail URL..."
              />
              {formData.thumbnail && (
                <div className="aspect-video relative overflow-hidden group">
                  <img src={formData.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Preview" />
                </div>
              )}
              <textarea 
                value={formData.excerpt}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full h-24 p-4 bg-zinc-50 border border-zinc-100 text-xs leading-relaxed"
                placeholder="Short excerpt for card preview..."
              />
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
