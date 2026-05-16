import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Tag, ChevronLeft } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  thumbnail: string;
  authorName: string;
  createdAt: any;
}

export default function TagArticles() {
  const { tag } = useParams<{ tag: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    if (!tag) return;
    
    const decodedTag = decodeURIComponent(tag).replace(/-/g, ' ');
    setTagName(decodedTag);
    
    async function fetchArticles() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        const snapshot = await getDocs(q);
        const results = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((article: any) => {
            const tags = article.tags || [];
            return tags.some((t: string) => 
              t.toLowerCase().includes(decodedTag.toLowerCase())
            );
          }) as Article[];
        
        setArticles(results);
      } catch (error) {
        console.error("Tag articles error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [tag]);

  return (
    <div className="space-y-8">
      <Link 
        to="/tags" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> All Tags
      </Link>

      <header className="border-b-2 border-black pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <Tag className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="editorial-title text-4xl">{tagName}</h1>
            <p className="text-zinc-500 text-[13px] font-medium mt-1">
              {articles.length} articles
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center bg-zinc-50 rounded-2xl">
          <Tag className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">No articles found with this tag.</p>
          <Link to="/" className="text-accent hover:underline mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group"
            >
              <Link to={`/article/${article.slug}`} className="block">
                <div className="aspect-video overflow-hidden rounded-xl mb-4">
                  <img 
                    src={article.thumbnail || 'https://images.unsplash.com/photo-1461896836934- voices-of-the-crowd.jpg?w=800'} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                    {article.category}
                  </span>
                  <h3 className="font-display font-bold text-xl leading-tight group-hover:text-accent transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-2">{article.excerpt}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}