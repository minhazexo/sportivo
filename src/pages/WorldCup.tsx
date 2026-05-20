import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Newspaper, ExternalLink, Clock, Trophy, Calendar, ChevronRight, Globe, TrendingUp, Filter, Award } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { getWorldCupNews } from '../lib/sportsApi';
import AdPromo from '../components/ads/AdPromo';
import SEO, { generateOrganizationJsonLd } from '../components/SEO';

interface WorldCupArticle {
  id?: string;
  title: string;
  description: string;
  image: string;
  url: string;
  source: string;
  publishedAt: string;
}

// FIFA World Cup 2026 host nations
const HOST_NATIONS = [
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Mexico', flag: '🇲🇽' },
];

const QUICK_FACTS = [
  { label: 'Host Nations', value: 'USA • Canada • Mexico' },
  { label: 'Teams', value: '48 (expanded)' },
  { label: 'Matches', value: '104' },
  { label: 'Dates', value: 'June 11 – July 19, 2026' },
];

export default function WorldCup() {
  const [articles, setArticles] = useState<WorldCupArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fifa' | 'news' | 'features'>('all');

  useEffect(() => {
    async function fetchWorldCupNews() {
      try {
        setLoading(true);
        const data = await getWorldCupNews(30);
        if (data?.articles) {
          setArticles(data.articles);
        }
      } catch (err) {
        console.error('[WorldCup] Failed to fetch news:', err);
        setError('Unable to load World Cup news at this time.');
      } finally {
        setLoading(false);
      }
    }
    fetchWorldCupNews();
  }, []);

  const filteredArticles = activeFilter === 'all'
    ? articles
    : activeFilter === 'fifa'
      ? articles.filter(a => a.source === 'FIFA' || a.title.toLowerCase().includes('fifa'))
      : activeFilter === 'news'
        ? articles.filter(a => a.source !== 'FIFA')
        : articles;

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  return (
    <>
      <SEO
        title="FIFA World Cup 2026"
        description="Latest FIFA World Cup news, updates, qualifiers, and in-depth coverage. Stay informed with trending World Cup stories, match reports, and analysis."
        jsonLd={generateOrganizationJsonLd()}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden mb-10 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-sm">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white/20 rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/5 rounded-full" />
        </div>
        <div className="relative z-10 px-6 py-10 md:py-16 md:px-12">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest">World Cup Central</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            FIFA World Cup 2026
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mb-6">
            The biggest sporting event on Earth is coming to North America. Stay ahead with 
            trending news, qualifying updates, and in-depth coverage from around the world.
          </p>
          <div className="flex flex-wrap gap-4">
            {HOST_NATIONS.map((nation) => (
              <span key={nation.name} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded text-white text-sm font-medium">
                <span className="text-lg">{nation.flag}</span>
                {nation.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Facts Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {QUICK_FACTS.map((fact) => (
          <div key={fact.label} className="p-4 border rounded-sm text-center transition-colors hover:border-accent" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>{fact.label}</p>
            <p className="text-sm font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{fact.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
        <Filter className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
        {[
          { key: 'all' as const, label: 'All World Cup News' },
          { key: 'fifa' as const, label: 'FIFA Official' },
          { key: 'news' as const, label: 'Media Coverage' },
          { key: 'features' as const, label: 'Features & Analysis' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap rounded-sm transition-all ${
              activeFilter === filter.key
                ? 'bg-accent text-white'
                : 'border hover:bg-[var(--color-bg-tertiary)]'
            }`}
            style={activeFilter !== filter.key ? { backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)', color: 'var(--color-text-secondary)' } : {}}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse" style={{ backgroundColor: 'var(--color-card-bg)' }}>
              <div className="aspect-video" style={{ backgroundColor: 'var(--color-skeleton)' }} />
              <div className="p-4 space-y-3">
                <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                <div className="h-5 rounded w-full" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                <div className="h-5 rounded w-3/4" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="border-l-4 border-red-500 p-6 mb-8 rounded-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Articles from our database will still be shown below.</p>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filteredArticles.length === 0 && (
        <div className="text-center py-16" style={{ backgroundColor: 'var(--color-card-bg)' }}>
          <Globe className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>No World Cup News Yet</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            FIFA World Cup news will appear here once ingested. In the meantime, check out our featured coverage below.
          </p>
        </div>
      )}

      {/* Featured Article */}
      {!loading && featuredArticle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href={featuredArticle.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block md:flex md:flex-row-reverse overflow-hidden rounded-sm border transition-all hover:shadow-lg"
            style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
          >
            <div className="md:w-1/2 relative overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[250px]">
              {featuredArticle.image ? (
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.05))' }}>
                  <Trophy className="w-16 h-16 text-yellow-500/30" />
                </div>
              )}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 bg-accent text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
                  <TrendingUp className="w-3 h-3" /> Top Story
                </span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 lg:p-8 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                <Award className="w-3 h-3 text-accent" />
                {featuredArticle.source}
              </span>
              <h2 className="text-xl lg:text-2xl font-extrabold leading-tight group-hover:text-accent transition-colors mb-3 line-clamp-3" style={{ color: 'var(--color-text-primary)' }}>
                {featuredArticle.title}
              </h2>
              <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {featuredArticle.description}
              </p>
              <div className="flex items-center justify-between text-xs font-medium mt-auto pt-4 border-t" style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-primary)' }}>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {featuredArticle.publishedAt ? formatDistanceToNow(parseISO(featuredArticle.publishedAt), { addSuffix: true }) : 'Recently'}
                </span>
                <span className="flex items-center gap-1 text-accent group-hover:gap-2 transition-all text-[10px] font-bold uppercase tracking-wider">
                  Read More <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </a>
        </motion.div>
      )}

      {/* Grid of Articles */}
      {!loading && restArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {restArticles.map((article, idx) => (
            <motion.a
              key={article.url || idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group block overflow-hidden rounded-sm border transition-all hover:shadow-md hover:border-accent/30"
              style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
            >
              <div className="relative overflow-hidden aspect-video" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                {article.image ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, rgba(37,99,235,0.1), rgba(37,99,235,0.05))' }}>
                    <Trophy className="w-10 h-10 text-yellow-500/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-black/60 text-white backdrop-blur-sm">
                    {article.source}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold leading-snug line-clamp-3 group-hover:text-accent transition-colors mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                  <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    <Clock className="w-3 h-3" />
                    {article.publishedAt ? formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true }) : 'Recently'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {/* Database Articles Section — show site articles tagged with World Cup */}
      <div className="mb-10">
        <div className="section-header mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-header-text)' }}>
              World Cup Coverage on Sportivo
            </h2>
          </div>
          <Link to="/search?q=world+cup" className="ml-auto text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent-dark transition-colors flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="p-8 text-center border rounded-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}>
          <Globe className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            In-Depth World Cup Coverage Coming Soon
          </h3>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Our team is preparing comprehensive FIFA World Cup coverage including match previews, 
            team profiles, and expert analysis. Stay tuned for exclusive content!
          </p>
        </div>
      </div>

      {/* Ad */}
      <AdPromo size="leaderboard" id="world-cup-bottom-ad" className="my-8" />
    </>
  );
}
