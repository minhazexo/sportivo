import { useEffect, useState } from 'react';
import { Trophy, ArrowUpRight, TrendingUp, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AdPromo from '../components/ads/AdPromo';
import apiClient from '../lib/apiClient';

interface League {
  id: string;
  name: string;
  displayName: string;
  sport: string;
  country: string;
  matchCount: number;
  teamCount: number;
  hasStandings: boolean;
}

const SPORT_FLAGS: Record<string, string> = {
  'Soccer': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Basketball': '🏀',
  'American Football': '🏈',
  'Baseball': '⚾',
  'Ice Hockey': '🏒',
};

const COUNTRY_FLAGS: Record<string, string> = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'USA': '🇺🇸',
};

export default function Leagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('All');

  useEffect(() => {
    async function fetchLeagues() {
      setLoading(true);
      try {
        const data = await apiClient.get('/leagues');
        if (data.leagues) {
          setLeagues(data.leagues);
        }
      } catch (error) {
        console.error('[Leagues] Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeagues();
  }, []);

  const sports = ['All', ...new Set(leagues.map(l => l.sport).filter(Boolean))];
  const filteredLeagues = selectedSport === 'All'
    ? leagues
    : leagues.filter(l => l.sport === selectedSport);

  const hasData = (league: League) => league.matchCount > 0 || league.teamCount > 0 || league.hasStandings;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="editorial-title text-4xl text-editorial-text">Leagues</h1>
          <p className="text-[var(--color-text-secondary)] text-[13px] font-medium mt-2">
            Explore standings, fixtures, and news for your favorite competitions.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`editorial-label px-4 py-2 whitespace-nowrap transition-colors ${
                selectedSport === sport
                  ? 'bg-black text-white'
                  : 'bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-accent hover:text-accent'
              }`}
            >
              {sport === 'All' ? 'All Sports' : sport}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {filteredLeagues.slice(0, Math.ceil(filteredLeagues.length / 2)).map((league, idx) => (
              <Link to={`/standings?league=${league.id}`} key={league.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)] hover:border-accent hover:z-10 transition-all cursor-pointer relative"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                      {COUNTRY_FLAGS[league.country] || SPORT_FLAGS[league.sport] || '🏆'}
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-accent transition-colors" />
                  </div>
                  
                  <h3 className="editorial-title text-2xl text-editorial-text group-hover:text-accent transition-colors">{league.displayName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="editorial-label text-[var(--color-text-tertiary)] font-medium">{league.country || league.sport}</span>
                    <span className="text-[10px] text-[var(--color-border-primary)]">•</span>
                    <span className="editorial-label text-[var(--color-text-tertiary)] font-medium">{league.sport}</span>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    {league.matchCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        <Calendar className="w-3 h-3 text-accent" />
                        {league.matchCount} matches
                      </span>
                    )}
                    {league.teamCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        <Users className="w-3 h-3 text-accent" />
                        {league.teamCount} teams
                      </span>
                    )}
                    {league.hasStandings && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        <TrendingUp className="w-3 h-3 text-accent" />
                        Standings
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-[var(--color-border-primary)] flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 bg-[var(--color-skeleton)] border border-[var(--color-card-bg)] rounded-full" />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="editorial-label text-[var(--color-text-tertiary)] group-hover:text-accent transition-colors">
                        {hasData(league) ? 'View Details' : 'Coming Soon'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          
          {/* Ad between league rows */}
          <div className="my-8">
            <AdPromo size="leaderboard" id="leagues-inline-ad" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {filteredLeagues.slice(Math.ceil(filteredLeagues.length / 2)).map((league, idx) => (
              <Link to={`/standings?league=${league.id}`} key={league.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)] hover:border-accent hover:z-10 transition-all cursor-pointer relative"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                      {COUNTRY_FLAGS[league.country] || SPORT_FLAGS[league.sport] || '🏆'}
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-accent transition-colors" />
                  </div>
                  
                  <h3 className="editorial-title text-2xl text-editorial-text group-hover:text-accent transition-colors">{league.displayName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="editorial-label text-[var(--color-text-tertiary)] font-medium">{league.country || league.sport}</span>
                    <span className="text-[10px] text-[var(--color-border-primary)]">•</span>
                    <span className="editorial-label text-[var(--color-text-tertiary)] font-medium">{league.sport}</span>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    {league.matchCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        <Calendar className="w-3 h-3 text-accent" />
                        {league.matchCount} matches
                      </span>
                    )}
                    {league.teamCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        <Users className="w-3 h-3 text-accent" />
                        {league.teamCount} teams
                      </span>
                    )}
                    {league.hasStandings && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        <TrendingUp className="w-3 h-3 text-accent" />
                        Standings
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-[var(--color-border-primary)] flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 bg-[var(--color-skeleton)] border border-[var(--color-card-bg)] rounded-full" />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="editorial-label text-[var(--color-text-tertiary)] group-hover:text-accent transition-colors">
                        {hasData(league) ? 'View Details' : 'Coming Soon'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Empty state if no leagues match filter */}
          {filteredLeagues.length === 0 && (
            <div className="py-20 text-center">
              <Trophy className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-lg" style={{ color: 'var(--color-text-tertiary)' }}>No leagues found for this sport</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
