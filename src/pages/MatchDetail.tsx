import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Trophy, ChevronLeft, Building2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getMatch } from '../lib/sportsApi';

interface Match {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  intHomeScore: string;
  intAwayScore: string;
  strTime: string;
  strStatus: string;
  dateEvent: string;
  strVenue: string;
  strLeague: string;
  strCountry: string;
  intRound: string;
  strHomeFormation: string;
  strAwayFormation: string;
  strHomeLineupGoalkeeper: string;
  strAwayLineupGoalkeeper: string;
}

const MOCK_MATCH: Match = {
  idEvent: '1',
  strEvent: 'Arsenal vs Manchester City',
  strHomeTeam: 'Arsenal',
  strAwayTeam: 'Manchester City',
  strHomeTeamBadge: '',
  strAwayTeamBadge: '',
  intHomeScore: '2',
  intAwayScore: '1',
  strTime: 'FT',
  strStatus: 'Finished',
  dateEvent: '2026-05-15',
  strVenue: 'Emirates Stadium',
  strLeague: 'Premier League',
  strCountry: 'England',
  intRound: '36',
  strHomeFormation: '4-3-3',
  strAwayFormation: '4-2-3-1',
  strHomeLineupGoalkeeper: '',
  strAwayLineupGoalkeeper: '',
};

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        if (id) {
          const data = await getMatch(id);
          if (data.events && data.events.length > 0) {
            setMatch(data.events[0]);
          } else {
            setMatch(MOCK_MATCH);
          }
        } else {
          setMatch(MOCK_MATCH);
        }
      } catch (error) {
        console.error("Match fetch error:", error);
        setMatch(MOCK_MATCH);
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [id]);

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
    </div>
  );

  if (!match) return (
    <div className="text-center py-20">
      <p className="text-zinc-500">Match not found</p>
    </div>
  );

  const isLive = match.strStatus === 'In Progress' || match.strStatus === 'Live';

  return (
    <div className="space-y-8">
      <Link 
        to="/fixtures" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Fixtures
      </Link>

      <header className={`text-center p-12 rounded-3xl ${isLive ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>
        <div className="flex items-center justify-center gap-4 mb-4">
          {match.strLeague && (
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/20 rounded">
              {match.strLeague}
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-2 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" /> LIVE
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-black">{match.strHomeTeam?.charAt(0)}</span>
            </div>
            <h2 className="font-display font-black text-2xl">{match.strHomeTeam}</h2>
          </div>

          <div className="text-center">
            <div className="text-6xl font-display font-black mb-2">
              {match.intHomeScore || '0'} - {match.intAwayScore || '0'}
            </div>
            <div className="text-sm font-bold opacity-70">
              {isLive ? match.strTime : match.strStatus}
            </div>
          </div>

          <div className="text-center">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-black">{match.strAwayTeam?.charAt(0)}</span>
            </div>
            <h2 className="font-display font-black text-2xl">{match.strAwayTeam}</h2>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 border border-zinc-200 rounded-2xl">
          <h3 className="editorial-label text-zinc-400 mb-4">Match Info</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{format(new Date(match.dateEvent), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            {match.strVenue && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">{match.strVenue}</span>
              </div>
            )}
            {match.intRound && (
              <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Round {match.intRound}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 border border-zinc-200 rounded-2xl">
          <h3 className="editorial-label text-zinc-400 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Home Formation
          </h3>
          <div className="text-3xl font-display font-black text-center">{match.strHomeFormation || '4-4-2'}</div>
        </div>

        <div className="bg-white p-6 border border-zinc-200 rounded-2xl">
          <h3 className="editorial-label text-zinc-400 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Away Formation
          </h3>
          <div className="text-3xl font-display font-black text-center">{match.strAwayFormation || '4-4-2'}</div>
        </div>
      </div>
    </div>
  );
}