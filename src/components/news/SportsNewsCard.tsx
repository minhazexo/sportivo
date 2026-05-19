import { motion } from 'motion/react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import OptimizedImage from './OptimizedImage';

interface SportsNewsCardProps {
  article: {
    title: string;
    description: string;
    image: string;
    url: string;
    source: string;
    publishedAt: string;
  };
  index?: number;
}

export default function SportsNewsCard({ article, index = 0 }: SportsNewsCardProps) {
  const publishDate = article.publishedAt ? parseISO(article.publishedAt) : new Date();
  
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group block overflow-hidden hover:border-accent hover:shadow-lg transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-card-bg)',
        borderColor: 'var(--color-border-primary)',
      }}
    >
      <div className="relative overflow-hidden aspect-video" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="%23999" font-family="system-ui"%3ESports News%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, rgba(220,38,38,0.1), rgba(220,38,38,0.05))' }}>
            <Newspaper className="w-12 h-12" style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
        )}
        
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded inline-block">
            {article.source}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
          {article.title}
        </h3>
        
        <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {article.description}
        </p>

        <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
            {formatDistanceToNow(publishDate, { addSuffix: true })}
          </span>
          <ExternalLink className="w-4 h-4 group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
      </div>
    </motion.a>
  );
}
