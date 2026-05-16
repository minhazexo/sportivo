import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Search as SearchIcon, X, Filter } from 'lucide-react';

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
      const path = 'articles';
      let q = query(
        collection(db, path),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
      
      results = results.filter(article => {
        const matchesTerm = article.title?.toLowerCase().includes(term.toLowerCase()) ||
                           article.excerpt?.toLowerCase().includes(term.toLowerCase());
        const matchesCategory = category === 'All' || article.category === category;
        return matchesTerm && matchesCategory;
      });
      
      setArticles(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams({ q: searchTerm });
    performSearch(searchTerm, selectedCategory);
  }

  return (
    <div className="space-y-8">
      <header className="border-b-2 border-black pb-6">
        <h1 className="editorial-title text-4xl">Search</h1>
      </header>

      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles, teams, players..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-zinc-200 focus:border-accent outline-none text-lg font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSearchParams({}); }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-600" />
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
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 editorial-label whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-black text-white'
                : 'bg-white border border-zinc-200 text-zinc-500 hover:border-accent'
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
          <p className="editorial-label text-zinc-400 mb-6">
            {articles.length} results for "{initialQuery}"
          </p>
          
          {articles.length === 0 ? (
            <div className="py-20 text-center bg-zinc-50 rounded-2xl">
              <SearchIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">No articles found matching your search.</p>
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
      ) : (
        <div className="py-20 text-center bg-zinc-50 rounded-2xl">
          <SearchIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">Enter a search term to find articles.</p>
        </div>
      )}
    </div>
  );
}