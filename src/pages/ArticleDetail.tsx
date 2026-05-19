import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { Calendar, User, MessageCircle, Share2, ChevronLeft, Tag } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../lib/apiClient';
import AdPromo from '../components/ads/AdPromo';

const MOCK_ARTICLE = {
  id: '1',
  title: "Arsenal's Title Charge: How Arteta Built a Defensive Fortress",
  slug: 'arsenal-title-charge',
  category: 'Football',
  thumbnail: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2000&auto=format&fit=crop',
  content: `
# The Defensive Evolution

For years, Arsenal were criticized for their "soft underbelly." But under Mikel Arteta, the Gunners have transformed into the Premier League's most disciplined defensive unit.

## The Saliba-Gabriel Partnership
At the heart of this transformation is the partnership between William Saliba and Gabriel Magalhães. The duo has played more minutes together than any other center-back pairing in the league, creating a level of telepathy rarely seen in modern football.

### Tactical Discipline
Arteta's tactical shift to a mid-block press has also played a crucial role. By reducing the space between the midfield and the defensive line, Arsenal have effectively neutralized some of the world's best attackers.

> "Attack wins you games, but defense wins you titles." - Sir Alex Ferguson

As we approach the final stretch of the season, the stats are clear: Arsenal's defense is not just a platform; it's their greatest weapon.
  `,
  authorName: "James Wilson",
  createdAt: new Date().toISOString(),
};

export default function ArticleDetail() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        if (!slug) return;
        const artData = await apiClient.get('/articles/' + slug);
        if (artData) {
          setArticle(artData);
          fetchComments(artData.id);
        } else if (slug === 'arsenal-title-charge') {
          setArticle(MOCK_ARTICLE);
        }
      } catch (error: any) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  async function fetchComments(articleId: string) {
    // This would need to be implemented with Prisma/Comments API
    // For now, return empty array or implement comments separately
    setComments([]);
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user || !article) return;
    
    // Comment functionality would need to be reimplemented with Prisma
    setNewComment('');
    fetchComments(article.id);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto" /></div>;
  if (!article) return <div className="text-center py-20 font-display text-2xl">Article Not Found</div>;

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </Link>

      <header className="mb-12 space-y-6">
        <div className="flex gap-2">
          <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
            {article.category}
          </span>
        </div>
        <h1 className="font-display font-black text-4xl md:text-6xl tracking-tight leading-[1.1]" style={{ color: 'var(--color-text-primary)' }}>
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 pt-4 py-6" style={{ borderTop: '1px solid var(--color-border-primary)', borderBottom: '1px solid var(--color-border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <User className="w-full h-full p-2" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-primary)' }}>{article.authorName}</p>
              <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Senior writer</p>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{format(new Date(article.createdAt), 'MMMM dd, yyyy')}</span>
          </div>
          <div className="flex-1" />
          <div className="flex gap-4">
            <button className="p-2 rounded-full transition-colors" style={{ color: 'var(--color-text-tertiary)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; e.currentTarget.style.color = '#3B82F6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}><Share2 className="w-5 h-5" /></button>
            <button className="p-2 rounded-full transition-colors" style={{ color: 'var(--color-text-tertiary)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; e.currentTarget.style.color = '#DC2626'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}><MessageCircle className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl">
        <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* In-article Ad */}
      <div className="mb-12">
        <AdPromo size="leaderboard" id="article-inline-ad" variant="dark" />
      </div>

      <div className="markdown-body max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl prose-blockquote:border-red-600 prose-blockquote:p-6 prose-blockquote:rounded-xl" style={{ color: 'var(--color-text-primary)' }}>
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <Tag className="w-4 h-4 mt-1" style={{ color: 'var(--color-text-tertiary)' }} />
          {article.tags.map((tag: string, idx: number) => (
            <Link 
              key={idx}
              to={`/tag/${encodeURIComponent(tag.toLowerCase().replace(/ /g, '-'))}`}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-colors"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Comments Section */}
      <section className="mt-20 pt-12" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        {/* Ad before comments */}
        <div className="mb-8">
          <AdPromo size="banner" id="article-before-comments" />
        </div>

        <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-red-600" />
          <span style={{ color: 'var(--color-text-primary)' }}>Comments (0)</span>
        </h3>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-12">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion..."
              className="w-full p-4 rounded-2xl text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button 
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg"
                style={{ boxShadow: '0 10px 15px -3px rgba(220,38,38,0.3)' }}
              >
                Post Comment
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 rounded-2xl text-center mb-12" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Please sign in to join the conversation.</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Comments would be fetched here */}
          <div className="text-center" style={{ color: 'var(--color-text-tertiary)' }}>No comments yet. Be the first to comment!</div>
        </div>
      </section>
    </motion.article>
  );
}
