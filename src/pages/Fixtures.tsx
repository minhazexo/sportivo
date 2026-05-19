import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ChevronRight, MapPin } from 'lucide-react';
import AdPromo from '../components/ads/AdPromo';
import { format } from 'date-fns';
import { getFixtures, LEAGUE_IDS } from '../lib/sportsApi';
import type { Match } from '../lib/sportsApi';

const LEAGUES = [
  { id: LEAGUE_IDS.PREMIER_LEAGUE, name: 'English Premier League', country: 'England', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: LEAGUE_IDS.LA_LIGA, name: 'Spanish La Liga', country: 'Spain', icon: '🇪🇸' },
  { id: LEAGUE_IDS.BUNDESLIGA, name: 'German Bundesliga', country: 'Germany', icon: '🇩🇪' },
  { id: LEAGUE_IDS.SERIE_A, name: 'Italian Serie A', country: 'Italy', icon: '🇮🇹' },
  { id: LEAGUE_IDS.LIGUE_1, name: 'French Ligue 1', country: 'France', icon: '🇫🇷' },
  { id: LEAGUE_IDS.NBA, name: 'NBA', country: 'USA', icon: '🏀' },
];

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>(LEAGUE_IDS.PREMIER_LEAGUE);

  useEffect(() => {
    async function fetchFixtures() {
      setLoading(true);
      try {
        const data = await getFixtures(selectedLeague);
        if (data.events && data.events.length > 0) {
          setFixtures(data.events);
        }
      } catch (error) {
        console.error("Fixtures error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFixtures();
  }, [selectedLeague]);

  const groupByDate = (fixtures: Match[]) => {
    const groups: Record<string, Match[]> = {};
    fixtures.forEach(fixture => {
      const date = fixture.dateEvent;
      if (!groups[date]) groups[date] = [];
      groups[date].push(fixture);
    });
    return groups;
  };

  const groupedFixtures = groupByDate(fixtures);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <h1 className="editorial-title text-4xl">Fixtures</h1>
          <p className="text-[13px] font-medium mt-2" style={{ color: 'var(--color-text-secondary)' }}>Upcoming matches and schedules</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {LEAGUES.map(league => {
          const isActive = selectedLeague === league.id;
          return (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id)}
              className={`flex items-center gap-2 px-4 py-2 editorial-label whitespace-nowrap transition-colors ${
                isActive ? 'bg-black text-white' : 'hover:border-accent'
              }`}
              style={isActive ? {} : { backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
            >
              <span>{league.icon}</span>
              <span>{league.name}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : fixtures.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg" style={{ color: 'var(--color-text-tertiary)' }}>No fixtures available for this league</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFixtures).map(([date, dayFixtures], dateIdx) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                <Calendar className="w-4 h-4 text-accent" />
                <h2 className="editorial-label" style={{ color: 'var(--color-text-secondary)' }}>
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h2>
              </div>
              <div className="space-y-3">
                {dayFixtures.map((fixture, idx) => (
                  <motion.div
                    key={fixture.idEvent}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 hover:border-accent hover:shadow-lg transition-all group cursor-pointer"
                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                            {fixture.strHomeTeam?.charAt(0)}
                          </div>
                          <span className="font-display font-bold text-lg">{fixture.strHomeTeam}</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                          <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>vs</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-display font-bold text-lg text-right">{fixture.strAwayTeam}</span>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                            {fixture.strAwayTeam?.charAt(0)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <Clock className="w-3 h-3" />
                          <span className="text-sm font-medium">{fixture.strTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                          <MapPin className="w-3 h-3" />
                          <span>{fixture.strVenue || 'Stadium TBD'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Ad between fixture dates (after the first group) */}
              {dateIdx === 0 && Object.entries(groupedFixtures).length > 1 && (
                <div className="my-8">
                  <AdPromo size="leaderboard" id="fixtures-inline-ad" />
                </div>
              )}
            </div>
          ))}

          {/* Bottom ad */}
          <div className="pt-4">
            <AdPromo size="banner" id="fixtures-bottom-ad" />
          </div>
        </div>
      )}
    </div>
  );
}