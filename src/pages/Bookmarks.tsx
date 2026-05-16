import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, Trash2 } from 'lucide-react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

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

export default function Bookmarks() {
  const { user, profile } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.bookmarkedArticles) {
      setLoading(false);
      return;
    }

    async function fetchBookmarks() {
      setLoading(true);
      try {
        const bookmarks = profile.bookmarkedArticles;

        const fetchPromises = bookmarks.map((id: string) => getDoc(doc(db, 'articles', id)));
        const snaps = await Promise.all(fetchPromises);
        
        const articlesData = snaps
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, ...snap.data() } as Article));
        
        setArticles(articlesData);
      } catch (error) {
        console.error("Bookmarks error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, [user, profile]);

  async function removeBookmark(articleId: string) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        bookmarkedArticles: arrayRemove(articleId)
      });
      setArticles(articles.filter(a => a.id !== articleId));
    } catch (error) {
      console.error("Remove bookmark error:", error);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <Bookmark className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">Please sign in to view your bookmarks</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b-2 border-black pb-6">
        <div className="flex items-center gap-4">
          <Bookmark className="w-8 h-8 text-accent" />
          <div>
            <h1 className="editorial-title text-4xl">Bookmarks</h1>
            <p className="text-zinc-500 text-[13px] font-medium mt-1">
              Your saved articles
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
          <Bookmark className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">No bookmarks yet. Save articles to read later!</p>
          <Link to="/" className="text-accent hover:underline mt-4 inline-block">
            Browse Articles
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
              className="group relative"
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
              <button
                onClick={() => removeBookmark(article.id)}
                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white hover:text-red-500 transition-colors"
                title="Remove bookmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}