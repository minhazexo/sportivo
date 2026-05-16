import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getScores } from '../../lib/sportsApi';

interface Match {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string;
  intAwayScore: string;
  strStatus: string;
  strTime: string;
  strThumb: string;
}

const MOCK_MATCHES: Match[] = [
  { idEvent: '1', strEvent: 'Arsenal vs Man City', strHomeTeam: 'Arsenal', strAwayTeam: 'Man City', intHomeScore: '2', intAwayScore: '1', strStatus: 'LIVE', strTime: "75'", strThumb: '' },
  { idEvent: '2', strEvent: 'Real Madrid vs Barcelona', strHomeTeam: 'Real Madrid', strAwayTeam: 'Barcelona', intHomeScore: '0', intAwayScore: '0', strStatus: 'SCHEDULED', strTime: '20:00', strThumb: '' },
  { idEvent: '3', strEvent: 'Lakers vs Warriors', strHomeTeam: 'Lakers', strAwayTeam: 'Warriors', intHomeScore: '102', intAwayScore: '98', strStatus: 'Finished', strTime: 'FT', strThumb: '' },
];

export default function ScoreWidget() {
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const data = await getScores('4328');
        if (data.events && data.events.length > 0) {
          setMatches(data.events.slice(0, 5));
        }
      } catch (error) {
        console.error("Scores fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, []);

  return (
    <div className="h-12 bg-white border-b border-zinc-300 flex items-center px-6 gap-8 overflow-hidden -mx-4 md:mx-0 shrink-0 mb-8">
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
        <span className="editorial-label text-black">Live Scores</span>
      </div>
      
      <div className="flex gap-12 font-mono text-[12px] whitespace-nowrap overflow-x-auto no-scrollbar">
        {loading ? (
          <span className="editorial-label text-zinc-400">Loading scores...</span>
        ) : matches.length === 0 ? (
          <span className="editorial-label text-zinc-400">No matches available</span>
        ) : (
          matches.map((match) => (
            <div key={match.idEvent} className="flex gap-6 border-r pr-8 border-zinc-200 last:border-0 items-center">
              <div className="flex gap-3">
                <span className="font-bold flex gap-1.5 uppercase">{match.strHomeTeam?.substring(0, 3) || '---'} <span className="font-black text-black">{match.intHomeScore || '0'}</span></span>
                <span className="font-bold flex gap-1.5 uppercase">{match.strAwayTeam?.substring(0, 3) || '---'} <span className="font-black text-black">{match.intAwayScore || '0'}</span></span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                match.strStatus === 'Live' || match.strStatus === 'In Progress' ? 'text-red-500' : 'text-zinc-400'
              }`}>
                {match.strStatus === 'Live' || match.strStatus === 'In Progress' ? match.strTime : match.strStatus}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
