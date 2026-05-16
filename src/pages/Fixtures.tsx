import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ChevronRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Fixture {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  dateEvent: string;
  strTime: string;
  strVenue: string;
  strLeague: string;
}

const LEAGUES = [
  { id: '4328', name: 'English Premier League', country: 'England', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: '4334', name: 'Spanish La Liga', country: 'Spain', icon: '🇪🇸' },
  { id: '4331', name: 'German Bundesliga', country: 'Germany', icon: '🇩🇪' },
  { id: '4332', name: 'Italian Serie A', country: 'Italy', icon: '🇮🇹' },
  { id: '4335', name: 'French Ligue 1', country: 'France', icon: '🇫🇷' },
  { id: '4480', name: 'NBA', country: 'USA', icon: '🏀' },
];

const MOCK_FIXTURES: Fixture[] = [
  { idEvent: '1', strEvent: 'Arsenal vs Manchester City', strHomeTeam: 'Arsenal', strAwayTeam: 'Manchester City', dateEvent: '2026-05-20', strTime: '15:00', strVenue: 'Emirates Stadium', strLeague: 'Premier League' },
  { idEvent: '2', strEvent: 'Real Madrid vs Barcelona', strHomeTeam: 'Real Madrid', strAwayTeam: 'Barcelona', dateEvent: '2026-05-21', strTime: '20:00', strVenue: 'Santiago Bernabeu', strLeague: 'La Liga' },
  { idEvent: '3', strEvent: 'Bayern Munich vs Dortmund', strHomeTeam: 'Bayern Munich', strAwayTeam: 'Dortmund', dateEvent: '2026-05-20', strTime: '17:30', strVenue: 'Allianz Arena', strLeague: 'Bundesliga' },
  { idEvent: '4', strEvent: 'Lakers vs Warriors', strHomeTeam: 'Lakers', strAwayTeam: 'Warriors', dateEvent: '2026-05-20', strTime: '02:30', strVenue: 'Crypto.com Arena', strLeague: 'NBA' },
];

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>(MOCK_FIXTURES);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('4328');

  useEffect(() => {
    async function fetchFixtures() {
      setLoading(true);
      try {
        const response = await fetch(`/api/sports/fixtures?league=${selectedLeague}`);
        const data = await response.json();
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

  const groupByDate = (fixtures: Fixture[]) => {
    const groups: Record<string, Fixture[]> = {};
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
          <p className="text-zinc-500 text-[13px] font-medium mt-2">Upcoming matches and schedules</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {LEAGUES.map(league => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={`flex items-center gap-2 px-4 py-2 editorial-label whitespace-nowrap transition-colors ${
              selectedLeague === league.id
                ? 'bg-black text-white'
                : 'bg-white border border-zinc-200 text-zinc-500 hover:border-accent'
            }`}
          >
            <span>{league.icon}</span>
            <span>{league.name}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFixtures).map(([date, dayFixtures]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200">
                <Calendar className="w-4 h-4 text-accent" />
                <h2 className="editorial-label text-zinc-500">
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
                    className="bg-white border border-zinc-200 p-6 hover:border-accent hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-lg font-bold">
                            {fixture.strHomeTeam?.charAt(0)}
                          </div>
                          <span className="font-display font-bold text-lg">{fixture.strHomeTeam}</span>
                        </div>
                        <div className="px-4 py-2 bg-zinc-100 rounded-lg">
                          <span className="text-xs font-bold text-zinc-400 uppercase">vs</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-display font-bold text-lg text-right">{fixture.strAwayTeam}</span>
                          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-lg font-bold">
                            {fixture.strAwayTeam?.charAt(0)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm font-medium">{fixture.strTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <MapPin className="w-3 h-3" />
                          <span>{fixture.strVenue || 'Stadium TBD'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-accent transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}