import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../lib/apiClient';

interface ArticleCardProps {
  article: any;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (profile?.bookmarkedArticles && article?.id) {
      setIsBookmarked(profile.bookmarkedArticles.includes(article.id));
    } else {
      setIsBookmarked(false);
    }
  }, [profile, article]);

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    if (!user || !article?.id) return;

    try {
      if (isBookmarked) {
        await apiClient.delete(`/users/bookmarks/${article.id}`);
        addToast({ type: 'info', title: 'Bookmark removed', message: article.title });
        setIsBookmarked(false);
      } else {
        await apiClient.post('/users/bookmarks', { articleId: article.id });
        addToast({ type: 'success', title: 'Article bookmarked', message: article.title });
        setIsBookmarked(true);
      }
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error("[ArticleCard] Bookmark update error:", error);
      addToast({ type: 'error', title: 'Failed to update bookmark' });
    }
  }

  // ESPN-style card layout
  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="group relative bg-white dark:bg-[var(--color-card-bg)] border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 md:col-span-2"
      >
        {user && (
          <button
            onClick={toggleBookmark}
            className="absolute top-4 right-4 z-30 p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-sm hover:text-accent transition-colors shadow-sm"
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-accent text-accent' : 'text-gray-400'}`} />
          </button>
        )}
        
        <Link to={`/article/${article.slug}`} className="block md:flex md:flex-row-reverse">
          <div className="md:w-1/2 relative overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[200px] md:min-h-[320px]">
            <OptimizedImage
              src={article.thumbnail}
              alt={article.title}
              className="absolute inset-0"
            />
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-block bg-accent text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                {article.category || 'Featured'}
              </span>
            </div>
          </div>

          <div className="md:w-1/2 p-5 lg:p-7 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2">
              {article.category || 'Top Story'}
            </span>
            <h3 className="text-xl lg:text-2xl font-extrabold leading-tight group-hover:text-accent transition-colors mb-3 line-clamp-3" style={{ color: 'var(--color-text-primary)' }}>
              {article.title}
            </h3>
            <p className="text-[13px] leading-relaxed line-clamp-3 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {article.excerpt}
            </p>
            <div className="flex items-center justify-between text-[10px] font-medium border-t pt-3" style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-primary)' }}>
              <span className="flex items-center gap-1">
                {article.authorName}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(article.createdAt))} ago
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Standard card layout
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group relative espn-card"
    >
      {user && (
        <button
          onClick={toggleBookmark}
          className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-sm hover:text-accent transition-colors shadow-sm"
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-accent text-accent' : 'text-gray-400'}`} />
        </button>
      )}
      
      <Link to={`/article/${article.slug}`} className="block">
        <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[16/10]">
          <OptimizedImage
            src={article.thumbnail}
            alt={article.title}
            className="absolute inset-0"
          />
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block bg-accent text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
              {article.category || 'News'}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-[15px] font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {article.title}
          </h3>
          
          <p className="text-[12px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between text-[10px] font-medium border-t pt-2.5" style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-primary)' }}>
            <span className="truncate max-w-[120px]">
              {article.authorName}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(article.createdAt))} ago
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}