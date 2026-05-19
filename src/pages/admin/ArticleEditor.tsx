import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Save, ChevronLeft, Image as ImageIcon, Layout, Sparkles, Upload, X } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (id && profile?.role === 'admin') {
      async function fetchArticle() {
        try {
          const article = await apiClient.get(`/articles/id/${id}`);
          if (article) {
            setFormData({
              title: article.title || '',
              slug: article.slug || '',
              content: article.content || '',
              excerpt: article.excerpt || '',
              thumbnail: article.thumbnail || '',
              category: article.category || 'Football',
              status: article.status || 'draft',
              tags: article.tags || [],
            });
          }
        } catch (error) {
          console.error('[ArticleEditor] Failed to fetch article:', error);
          alert('Failed to load article details.');
        }
      }
      fetchArticle();
    }
  }, [id, profile, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Title and Content are required.');
      return;
    }
    setLoading(true);
    
    try {
      if (id) {
        await apiClient.put(`/articles/${id}`, formData);
      } else {
        await apiClient.post('/articles', formData);
      }
      navigate('/admin');
    } catch (error) {
      console.error("[ArticleEditor] Save Error:", error);
      alert(error instanceof Error ? error.message : "Failed to save article");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, WebP, SVG).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.upload('/upload', file);
      setFormData(prev => ({ ...prev, thumbnail: result.url }));
    } catch (error) {
      console.error('[ArticleEditor] Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function removeThumbnail() {
    setFormData(prev => ({ ...prev, thumbnail: '' }));
  }

  function triggerFileUpload() {
    fileInputRef.current?.click();
  }

  async function generateWithAI() {
    if (!formData.title) {
      alert('Please enter a title first');
      return;
    }
    setAiLoading(true);
    try {
      const data = await apiClient.post('/ai/generate', {
        prompt: `Write an engaging sports article with title "${formData.title}". Use proper markdown structure, subheadings, and analysis. Do not include frontmatter.`,
        type: 'article'
      });
      if (data && data.text) {
        setFormData(prev => ({ ...prev, content: data.text }));
      } else {
        alert('AI generation failed to return text.');
      }
    } catch (error) {
      console.error("[ArticleEditor] AI generation error:", error);
      alert(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setAiLoading(false);
    }
  }

  if (authLoading) return <div className="p-20 text-center uppercase editorial-label text-[var(--color-text-tertiary)] font-mono">Loading Authorization...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/admin')} className="p-2 bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] hover:border-accent transition-colors rounded-lg">
            <ChevronLeft className="w-5 h-5 text-[var(--color-text-tertiary)]" />
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="editorial-label text-[var(--color-text-tertiary)]">Article Title</label>
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
              className="w-full text-4xl font-display font-black p-0 border-none bg-transparent focus:ring-0 outline-none placeholder:text-[var(--color-text-tertiary)]"
              placeholder="The Headlines Start Here..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="editorial-label text-[var(--color-text-tertiary)]">Content (Markdown)</label>
            <textarea 
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-[600px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] p-8 text-lg font-medium leading-relaxed font-sans focus:border-accent outline-none transition-colors no-scrollbar"
              placeholder="Draft your story using markdown syntax..."
              required
            />
          </div>
        </div>

        <aside className="space-y-10">
          <div className="bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)] space-y-6">
            <h3 className="editorial-label text-[var(--color-text-tertiary)] border-b border-[var(--color-border-primary)] pb-3 flex items-center gap-2">
              <Layout className="w-4 h-4" /> Publishing Info
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1 block">URL Slug</label>
                <input 
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                  className="w-full p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-mono"
                  placeholder="arsenal-match-report"
                />
              </div>

              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1 block">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs font-bold uppercase tracking-widest"
                >
                  <option>Football</option>
                  <option>Basketball</option>
                  <option>Tennis</option>
                  <option>Cricket</option>
                  <option>Formula 1</option>
                </select>
              </div>

              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1 block">Status</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`flex-1 py-2 editorial-label text-[9px] text-center border ${formData.status === 'draft' ? 'bg-black text-white border-black font-black' : 'bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]'}`}
                  >
                    Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'published' })}
                    className={`flex-1 py-2 editorial-label text-[9px] text-center border ${formData.status === 'published' ? 'bg-accent text-white border-accent font-black' : 'bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]'}`}
                  >
                    Publish
                  </button>
                </div>
              </div>

              <div>
                <label className="editorial-label text-[9px] text-[var(--color-text-secondary)] mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-tertiary)] text-[9px] font-bold uppercase">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                        className="text-[var(--color-text-tertiary)] hover:text-red-500 font-bold"
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
                  className="w-full p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs"
                  placeholder="Type and press Enter..."
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)] space-y-6">
            <h3 className="editorial-label text-[var(--color-text-tertiary)] border-b border-[var(--color-border-primary)] pb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Media
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={formData.thumbnail}
                  onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="flex-1 min-w-0 p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs"
                  placeholder="Image URL..."
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white editorial-label text-[10px] hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">Uploading image...</span>
                </div>
              )}

              {formData.thumbnail && (
                <div className="aspect-video relative overflow-hidden group">
                  <img src={formData.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Preview" />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <textarea 
                value={formData.excerpt}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full h-24 p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] text-xs leading-relaxed"
                placeholder="Short excerpt for card preview..."
              />
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
