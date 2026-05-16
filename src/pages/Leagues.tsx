import { Trophy, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

const LEAGUES = [
  { id: 'pl', name: 'Premier League', country: 'England', teams: 20, icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'll', name: 'La Liga', country: 'Spain', teams: 20, icon: '🇪🇸' },
  { id: 'sa', name: 'Serie A', country: 'Italy', teams: 20, icon: '🇮🇹' },
  { id: 'bl', name: 'Bundesliga', country: 'Germany', teams: 18, icon: '🇩🇪' },
  { id: 'nba', name: 'NBA', country: 'USA', teams: 30, icon: '🇺🇸' },
  { id: 'f1', name: 'Formula 1', country: 'Global', teams: 10, icon: '🏎️' },
];

export default function Leagues() {
  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="editorial-title text-4xl text-editorial-text">Leagues</h1>
          <p className="text-zinc-500 text-[13px] font-medium mt-2">Explore standings, fixtures, and news for your favorite competitions.</p>
        </div>
        <div className="flex gap-2">
          <button className="editorial-label px-4 py-2 bg-black text-white hover:bg-accent transition-colors">Football</button>
          <button className="editorial-label px-4 py-2 bg-white border border-zinc-200 text-zinc-600 hover:border-accent hover:text-accent transition-colors">Basketball</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {LEAGUES.map((league, idx) => (
          <motion.div
            key={league.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white p-8 border border-zinc-200 hover:border-accent hover:z-10 transition-all cursor-pointer relative"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                {league.icon}
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-accent transition-colors" />
            </div>
            
            <h3 className="editorial-title text-2xl text-editorial-text group-hover:text-accent transition-colors">{league.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="editorial-label text-zinc-400 font-medium">{league.country}</span>
              <span className="text-[10px] text-zinc-200">•</span>
              <span className="editorial-label text-zinc-400 font-medium">{league.teams} Teams</span>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 bg-zinc-200 border border-white" />
                ))}
              </div>
              <span className="editorial-label text-zinc-300 group-hover:text-accent transition-colors">Standings</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
