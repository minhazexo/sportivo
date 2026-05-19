import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getScores, LEAGUE_IDS } from '../../lib/sportsApi';
import type { Match } from '../../lib/sportsApi';

interface ScoreWidgetProps {
  compact?: boolean;
}

export default function ScoreWidget({ compact = false }: ScoreWidgetProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const data = await getScores(LEAGUE_IDS.PREMIER_LEAGUE);
        if (data.events && data.events.length > 0) {
          setMatches(data.events.slice(0, 8));
        }
      } catch (error) {
        console.error("Scores fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, []);

  if (compact) {
    return (
      <div className="bg-espn-dark border-b border-gray-800/50 overflow-hidden">
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-accent shrink-0">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">LIVE</span>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar px-4 py-2">
            {loading ? (
              <span className="text-gray-500 text-[11px] font-medium">Loading scores...</span>
            ) : matches.length === 0 ? (
              <span className="text-gray-500 text-[11px] font-medium">No matches available</span>
            ) : (
              matches.slice(0, 6).map((match) => (
                <Link
                  key={match.idEvent}
                  to={`/match/${match.idEvent}`}
                  className="flex items-center gap-3 shrink-0 border-r border-gray-700/30 pr-6 hover:bg-white/5 transition-colors py-1 -my-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-[12px] font-semibold whitespace-nowrap">
                      {match.strHomeTeam?.substring(0, 8) || 'Home'}
                    </span>
                    <span className="text-white text-[14px] font-extrabold min-w-[18px] text-center">
                      {match.intHomeScore ?? '-'}
                    </span>
                    <span className="text-gray-600 text-[9px] font-medium">vs</span>
                    <span className="text-white text-[14px] font-extrabold min-w-[18px] text-center">
                      {match.intAwayScore ?? '-'}
                    </span>
                    <span className="text-gray-300 text-[12px] font-semibold whitespace-nowrap">
                      {match.strAwayTeam?.substring(0, 8) || 'Away'}
                    </span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 ${
                    match.strStatus === 'Live' || match.strStatus === 'In Progress'
                      ? 'bg-red-600/20 text-red-400'
                      : 'bg-gray-700/50 text-gray-500'
                  }`}>
                    {match.strStatus === 'Live' || match.strStatus === 'In Progress' ? 'LIVE' : 'FT'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="espn-card mb-6">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-primary)' }}>
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
          Live Scores
        </span>
        <span className="text-[9px] font-medium ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          {matches.length} matches
        </span>
      </div>
      
      <div className="flex gap-6 overflow-x-auto no-scrollbar px-4 py-3">
        {loading ? (
          <div className="flex gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="h-4 w-16" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
                <div className="h-4 w-6" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
                <div className="h-4 w-16" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <span className="text-[12px] font-medium py-1" style={{ color: 'var(--color-text-tertiary)' }}>No matches available</span>
        ) : (
          matches.slice(0, 8).map((match) => (
            <Link
              key={match.idEvent}
              to={`/match/${match.idEvent}`}
              className="flex items-center gap-3 shrink-0 pr-6 last:border-0 py-1 -my-1 group"
              style={{ borderRight: '1px solid var(--color-border-primary)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[12px] font-bold group-hover:text-accent transition-colors whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                  {match.strHomeTeam?.substring(0, 10) || 'Home'}
                </span>
                <span className="text-[14px] font-extrabold min-w-[18px] text-center" style={{ color: 'var(--color-text-primary)' }}>
                  {match.intHomeScore ?? '-'}
                </span>
                <span className="text-[9px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>v</span>
                <span className="text-[14px] font-extrabold min-w-[18px] text-center" style={{ color: 'var(--color-text-primary)' }}>
                  {match.intAwayScore ?? '-'}
                </span>
                <span className="text-[12px] font-bold group-hover:text-accent transition-colors whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                  {match.strAwayTeam?.substring(0, 10) || 'Away'}
                </span>
              </div>
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                match.strStatus === 'Live' || match.strStatus === 'In Progress'
                  ? 'text-red-600 dark:text-red-400'
                  : match.strStatus === 'FT' || match.strStatus === 'Match Finished'
                  ? ''
                  : ''
              }`} style={{
                backgroundColor: match.strStatus === 'Live' || match.strStatus === 'In Progress'
                  ? 'rgba(220, 38, 38, 0.1)'
                  : 'var(--color-bg-tertiary)',
                color: match.strStatus === 'Live' || match.strStatus === 'In Progress'
                  ? '#DC2626'
                  : 'var(--color-text-tertiary)'
              }}>
                {match.strStatus === 'Live' || match.strStatus === 'In Progress' ? 'LIVE' : match.strStatus || 'FT'}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
