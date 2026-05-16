import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ScoreWidget from '../components/scores/ScoreWidget';
import ArticleCard from '../components/news/ArticleCard';
import OptimizedImage from '../components/news/OptimizedImage';
import { ArticleCardSkeleton, ScoreWidgetSkeleton, TableSkeleton } from '../components/news/Skeleton';
import SEO, { generateOrganizationJsonLd } from '../components/SEO';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ArrowRight, Calendar, Trophy, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Match {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  strTime: string;
  dateEvent: string;
  strThumb: string;
  strLeague?: string;
}

interface Standing {
  idStanding: string;
  intRank: string;
  strTeam: string;
  strTeamBadge: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
}

const MOCK_FEATURED = [
  {
    id: '1',
    title: "Arsenal's Title Charge: How Arteta Built a Defensive Fortress",
    slug: 'arsenal-title-charge',
    category: 'Football',
    thumbnail: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2000&auto=format&fit=crop',
    excerpt: "With only 24 goals conceded this season, Arsenal are setting a new standard for defensive excellence in the Premier League...",
    authorName: "James Wilson",
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: "The Rise of Wemby: How NBA's Alien is Breaking Every Rule",
    slug: 'rise-of-wemby',
    category: 'Basketball',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2000&auto=format&fit=crop',
    excerpt: "Victor Wembanyama is doing things on a basketball court that shouldn't be humanly possible. We analyze the stats...",
    authorName: "Sarah Chen",
    createdAt: new Date().toISOString(),
  }
];

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [breakingArticles, setBreakingArticles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchArticles() {
      const path = 'articles';
      try {
        const q = query(
          collection(db, path),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setArticles(data.length > 0 ? data : MOCK_FEATURED);
        if (data.length > 0) {
          setBreakingArticles(data.slice(0, 5));
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.LIST, path);
        }
        console.error("Error fetching articles:", error);
        setArticles(MOCK_FEATURED);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch('/api/sports/scores?league=4328');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.events && data.events.length > 0) {
          setMatches(data.events.slice(0, 5));
        }
      } catch (error) {
        console.error("Scores fetch error:", error);
      } finally {
        setMatchesLoading(false);
      }
    }
    fetchMatches();
  }, []);

  useEffect(() => {
    async function fetchFixtures() {
      try {
        const response = await fetch('/api/sports/fixtures?league=4328');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.events && data.events.length > 0) {
          setFixtures(data.events.slice(0, 5));
        }
      } catch (error) {
        console.error("Fixtures fetch error:", error);
      } finally {
        setFixturesLoading(false);
      }
    }
    fetchFixtures();
  }, []);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const response = await fetch('/api/sports/standings?league=4328');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.table && data.table.length > 0) {
          setStandings(data.table.slice(0, 10));
        }
      } catch (error) {
        console.error("Standings fetch error:", error);
      } finally {
        setStandingsLoading(false);
      }
    }
    fetchStandings();
  }, []);

  return (
    <>
      <SEO
        title="Home"
        description="Your premium source for sports news, live scores, and in-depth analysis across football, basketball, cricket, tennis, and more."
        jsonLd={generateOrganizationJsonLd()}
      />
      
      <div className="space-y-8">
        {matchesLoading ? <ScoreWidgetSkeleton /> : <ScoreWidget />}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h2 className="editorial-title text-3xl text-editorial-text italic">
                Top Stories
              </h2>
              <Link to="/search" className="editorial-label text-zinc-400 hover:text-accent transition-colors flex items-center gap-2 group">
                Browse All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ArticleCardSkeleton />
                <ArticleCardSkeleton />
                <ArticleCardSkeleton />
                <ArticleCardSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {articles.map((article, idx) => (
                    <ArticleCard key={article.id || idx} article={article} featured={idx === 0} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {matches.length > 0 && (
              <div className="border-t border-zinc-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="editorial-title text-2xl text-editorial-text italic flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-accent" /> Recent Results
                  </h2>
                  <Link to="/fixtures" className="editorial-label text-zinc-400 hover:text-accent transition-colors flex items-center gap-2 group">
                    View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.slice(0, 4).map((match) => (
                    <Link
                      key={match.idEvent}
                      to={`/match/${match.idEvent}`}
                      className="bg-white border border-zinc-200 p-4 hover:border-accent transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          {match.strStatus === 'FT' || match.strStatus === 'Match Finished' ? 'Finished' : match.strStatus}
                        </span>
                        {match.dateEvent && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(match.dateEvent).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-editorial-text group-hover:text-accent transition-colors">
                            {match.strHomeTeam}
                          </span>
                          <span className="text-lg font-black text-editorial-text">
                            {match.intHomeScore ?? '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-editorial-text group-hover:text-accent transition-colors">
                            {match.strAwayTeam}
                          </span>
                          <span className="text-lg font-black text-editorial-text">
                            {match.intAwayScore ?? '-'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {fixtures.length > 0 && (
              <div className="border-t border-zinc-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="editorial-title text-2xl text-editorial-text italic flex items-center gap-3">
                    <Clock className="w-5 h-5 text-accent" /> Upcoming Fixtures
                  </h2>
                  <Link to="/fixtures" className="editorial-label text-zinc-400 hover:text-accent transition-colors flex items-center gap-2 group">
                    View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fixtures.slice(0, 4).map((fixture) => (
                    <Link
                      key={fixture.idEvent}
                      to={`/match/${fixture.idEvent}`}
                      className="bg-white border border-zinc-200 p-4 hover:border-accent transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                          {fixture.strLeague || 'Premier League'}
                        </span>
                        {fixture.dateEvent && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(fixture.dateEvent).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-editorial-text group-hover:text-accent transition-colors">
                            {fixture.strHomeTeam}
                          </span>
                          <span className="text-sm font-black text-zinc-400">
                            {fixture.strTime || 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-editorial-text group-hover:text-accent transition-colors">
                            {fixture.strAwayTeam}
                          </span>
                          <span className="text-sm font-black text-zinc-400">
                            {fixture.strTime || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-8 bg-zinc-100 p-8 border-l border-zinc-200">
            <div>
              <h2 className="editorial-label text-zinc-400 mb-6 border-b border-zinc-300 pb-2">Latest Updates</h2>
              <div className="space-y-6">
                {breakingArticles.length > 0 ? (
                  breakingArticles.map((article, i) => (
                    <Link key={article.id} to={`/article/${article.slug}`} className="block border-b border-zinc-200 pb-4 last:border-0 group cursor-pointer">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'text-accent' : 'text-zinc-500'}`}>
                        {article.category || 'NEWS'}
                      </span>
                      <p className="text-[13px] font-black leading-tight mt-1 text-editorial-text group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <span className="text-[10px] font-bold text-zinc-400 mt-2 block uppercase tracking-tighter">
                        {article.authorName} • {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border-b border-zinc-200 pb-4 last:border-0">
                      <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse mb-2" />
                      <div className="h-4 w-full bg-zinc-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="editorial-label text-zinc-400">Standings</h2>
                <Link to="/standings" className="text-[10px] text-accent hover:underline font-bold uppercase">
                  Full Table
                </Link>
              </div>
              {standingsLoading ? (
                <TableSkeleton rows={5} />
              ) : standings.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-zinc-50 text-[9px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Team</span>
                    <span className="col-span-1 text-center">P</span>
                    <span className="col-span-1 text-center">GD</span>
                    <span className="col-span-1 text-center">Pts</span>
                    <span className="col-span-3"></span>
                  </div>
                  {standings.slice(0, 8).map((team) => (
                    <div key={team.idStanding} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors items-center text-[11px]">
                      <span className="col-span-1 font-black text-zinc-400">{team.intRank}</span>
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        {team.strTeamBadge && (
                          <img src={team.strTeamBadge} alt="" className="w-5 h-5 object-contain shrink-0" loading="lazy" />
                        )}
                        <span className="font-bold text-editorial-text truncate">{team.strTeam}</span>
                      </div>
                      <span className="col-span-1 text-center text-zinc-500 font-bold">{team.intPlayed}</span>
                      <span className={`col-span-1 text-center font-bold ${parseInt(team.intGoalDifference) > 0 ? 'text-green-600' : parseInt(team.intGoalDifference) < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                        {parseInt(team.intGoalDifference) > 0 ? '+' : ''}{team.intGoalDifference}
                      </span>
                      <span className="col-span-1 text-center font-black text-editorial-text">{team.intPoints}</span>
                      <div className="col-span-3 flex gap-0.5">
                        {Array.from({ length: Math.min(parseInt(team.intWin), 10) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-green-500" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-lg p-6 text-center text-zinc-400 text-sm">
                  No standings available
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <div className="w-full h-40 bg-zinc-200 border border-dashed border-zinc-400 flex items-center justify-center relative">
                <span className="editorial-label text-zinc-400">Ad Placement</span>
                <div className="absolute top-0 left-0 bg-zinc-400 px-2 py-1 text-[8px] font-bold text-white uppercase tracking-tighter">PROMO</div>
              </div>
            </div>

            <div className="bg-black p-8 text-white">
              <h3 className="editorial-label text-accent mb-4">Elite Membership</h3>
              <p className="text-[13px] text-zinc-400 mb-6 leading-relaxed">Unlock deep-dive analytics, ad-free experience and exclusive insider reports.</p>
              <button className="w-full py-2 bg-white text-black font-black uppercase text-[11px] tracking-widest hover:bg-accent hover:text-white transition-colors">
                Subscribe Now
              </button>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
