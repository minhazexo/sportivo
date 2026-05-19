import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search as SearchIcon, X } from 'lucide-react';
import AdPromo from '../components/ads/AdPromo';
import apiClient from '../lib/apiClient';

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

const CATEGORIES = ['All', 'Football', 'Basketball', 'Tennis', 'Cricket', 'Formula 1'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, selectedCategory);
    }
  }, [initialQuery, selectedCategory]);

  async function performSearch(term: string, category: string) {
    if (!term.trim()) return;
    
    setLoading(true);
    try {
      const data = await apiClient.get('/articles');
      let results = (data || []) as Article[];
      
      results = results.filter(article => {
        const matchesTerm = article.title?.toLowerCase().includes(term.toLowerCase()) ||
                           article.excerpt?.toLowerCase().includes(term.toLowerCase());
        const matchesCategory = category === 'All' || article.category === category;
        return matchesTerm && matchesCategory;
      });
      
      setArticles(results);
    } catch (error) {
      console.error("[Search] Search query error:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams({ q: searchTerm });
  }

  return (
    <div className="space-y-8">
      <header className="border-b-2 border-black pb-6">
        <h1 className="editorial-title text-4xl">Search</h1>
      </header>

      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles, teams, players..."
              className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-primary)] focus:border-accent outline-none text-lg font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSearchParams({}); }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-8 py-4 bg-black text-white editorial-label hover:bg-accent transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}              className={`px-4 py-2 editorial-label whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-black text-white'
                : 'bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : initialQuery ? (
        <div>
          <p className="editorial-label text-[var(--color-text-tertiary)] mb-6">
            {articles.length} results for "{initialQuery}"
          </p>
          
          {articles.length === 0 ? (
            <div className="py-20 text-center bg-[var(--color-bg-tertiary)] rounded-2xl">
              <SearchIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--color-text-secondary)]">No articles found matching your search.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(0, Math.ceil(articles.length / 2)).map((article, idx) => (
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
                          src={article.thumbnail || 'https://images.unsplash.com/photo-1461896836934-0f065185ebd1?w=800'} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                          {article.category}
                        </span>
                        <h3 className="font-display font-bold text-xl leading-tight group-hover:text-accent transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{article.excerpt}</p>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* Ad between search results */}
              <div className="my-8">
                <AdPromo size="leaderboard" id="search-inline-ad" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(Math.ceil(articles.length / 2)).map((article, idx) => (
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
                          src={article.thumbnail || 'https://images.unsplash.com/photo-1461896836934-0f065185ebd1?w=800'} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                          {article.category}
                        </span>
                        <h3 className="font-display font-bold text-xl leading-tight group-hover:text-accent transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{article.excerpt}</p>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="py-20 text-center bg-[var(--color-bg-tertiary)] rounded-2xl">
          <SearchIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Enter a search term to find articles.</p>
        </div>
      )}
    </div>
  );
}