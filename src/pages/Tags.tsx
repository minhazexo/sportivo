import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Tag, TrendingUp } from 'lucide-react';

interface TagCount {
  name: string;
  count: number;
}

const POPULAR_TAGS = [
  { name: 'Premier League', count: 45 },
  { name: 'Transfer News', count: 32 },
  { name: 'NBA', count: 28 },
  { name: 'Champions League', count: 24 },
  { name: 'World Cup', count: 20 },
  { name: 'Transfer Rumors', count: 18 },
  { name: 'Injury News', count: 15 },
  { name: 'Formula 1', count: 12 },
];

export default function Tags() {
  const [tags, setTags] = useState<TagCount[]>(POPULAR_TAGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTags() {
      setLoading(true);
      try {
        const snapshot = await getDocs(query(collection(db, 'articles'), limit(100)));
        const tagMap = new Map<string, number>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach((tag: string) => {
              tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            });
          }
        });
        
        if (tagMap.size > 0) {
          const sortedTags = Array.from(tagMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
          setTags(sortedTags);
        }
      } catch (error) {
        console.error("Tags fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTags();
  }, []);

  return (
    <div className="space-y-12">
      <header className="border-b-2 border-black pb-6">
        <div className="flex items-center gap-4">
          <Tag className="w-8 h-8 text-accent" />
          <div>
            <h1 className="editorial-title text-4xl">Tags</h1>
            <p className="text-zinc-500 text-[13px] font-medium mt-1">
              Browse articles by topic
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tags.map((tag, idx) => (
          <motion.div
            key={tag.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Link
              to={`/tag/${encodeURIComponent(tag.name.toLowerCase().replace(/ /g, '-'))}`}
              className="block bg-white border border-zinc-200 p-6 hover:border-accent hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <Tag className="w-4 h-4 text-zinc-400 group-hover:text-accent" />
                </span>
                <span className="text-2xl font-display font-black text-zinc-200 group-hover:text-accent transition-colors">
                  {tag.count}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg group-hover:text-accent transition-colors">
                {tag.name}
              </h3>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="bg-zinc-50 p-8 rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="editorial-title text-xl">Trending Topics</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Premier League', 'NBA Finals', 'Transfer Window', 'World Cup 2026', 'F1 Championship', 'Wimbledon']
            .map(topic => (
              <Link
                key={topic}
                to={`/search?q=${encodeURIComponent(topic)}`}
                className="px-4 py-2 bg-white border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-colors"
              >
                {topic}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}