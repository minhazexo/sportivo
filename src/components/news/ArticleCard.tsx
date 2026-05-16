import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, User, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useState } from 'react';
import OptimizedImage from './OptimizedImage';
import { useToast } from '../../context/ToastContext';

interface ArticleCardProps {
  article: any;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(
    profile?.bookmarkedArticles?.includes(article.id)
  );

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayRemove(article.id)
        });
        addToast({ type: 'info', title: 'Bookmark removed', message: article.title });
      } else {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayUnion(article.id)
        });
        addToast({ type: 'success', title: 'Article bookmarked', message: article.title });
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Bookmark error:", error);
      addToast({ type: 'error', title: 'Failed to update bookmark' });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group relative bg-white border border-zinc-200 overflow-hidden hover:border-accent transition-all duration-300 ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      {user && (
        <button
          onClick={toggleBookmark}
          className="absolute top-4 right-4 z-30 p-2 bg-white/80 rounded-full hover:bg-white hover:text-accent transition-colors"
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-accent text-accent' : ''}`} />
        </button>
      )}
      
      <Link to={`/article/${article.slug}`} className="block">
        <OptimizedImage
          src={article.thumbnail}
          alt={article.title}
          className={`${featured ? 'md:col-span-2' : ''}`}
        />
        <div className="absolute top-0 left-0 z-20">
          <span className="bg-accent text-white editorial-label px-3 py-1.5 inline-block">
            {article.category}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <h3 className={`editorial-title leading-[0.9] text-editorial-text group-hover:text-accent transition-colors ${
            featured ? 'text-4xl' : 'text-xl'
          }`}>
            {article.title}
          </h3>
          
          <p className="text-zinc-600 text-[13px] font-medium leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          <div className="pt-4 flex items-center justify-between border-t border-zinc-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {article.authorName}
            </span>
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[10px] font-bold uppercase">
                {formatDistanceToNow(new Date(article.createdAt))} ago
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}