import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AdPromo from '../components/ads/AdPromo';
import { getStandings, LEAGUE_IDS } from '../lib/sportsApi';
import type { Standing } from '../lib/sportsApi';

const LEAGUE_NAMES: Record<string, string> = {
  '4328': 'Premier League',
  '4335': 'La Liga',
  '4331': 'Bundesliga',
  '4332': 'Serie A',
  '4334': 'Ligue 1',
  '4329': 'Championship',
  '4387': 'NBA',
  '4391': 'NFL',
  '4424': 'MLB',
  '4380': 'NHL',
};

// Map league IDs to LEAGUE_IDS keys
const LEAGUE_ID_TO_KEY: Record<string, keyof typeof LEAGUE_IDS> = {
  '4328': 'PREMIER_LEAGUE',
  '4329': 'CHAMPIONSHIP',
  '4335': 'LA_LIGA',
  '4332': 'SERIE_A',
  '4331': 'BUNDESLIGA',
  '4334': 'LIGUE_1',
  '4387': 'NBA',
  '4391': 'NFL',
  '4424': 'MLB',
  '4380': 'NHL',
};

export default function Standings() {
  const [searchParams] = useSearchParams();
  const leagueFromParam = searchParams.get('league');
  
  const initialKey = (leagueFromParam && LEAGUE_ID_TO_KEY[leagueFromParam])
    ? LEAGUE_ID_TO_KEY[leagueFromParam]
    : 'PREMIER_LEAGUE' as keyof typeof LEAGUE_IDS;

  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<keyof typeof LEAGUE_IDS>(initialKey);
  const [leagueName, setLeagueName] = useState('Premier League');

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      try {
        const leagueId = LEAGUE_IDS[selectedLeague];
        setLeagueName(LEAGUE_NAMES[leagueId] || 'League');
        const data = await getStandings(leagueId);
        if (data.table && data.table.length > 0) {
          setStandings(data.table);
        }
      } catch (error) {
        console.error("Standings error:", error);
        setStandings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [selectedLeague]);

  const getPositionIcon = (pos: number, prevPos: number) => {
    if (pos < prevPos) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (pos > prevPos) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-[var(--color-text-tertiary)]" />;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="editorial-title text-4xl">Standings</h1>
            <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>League tables and rankings</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {Object.keys(LEAGUE_IDS).map(leagueKey => {
          const isActive = selectedLeague === leagueKey;
          return (
            <button
              key={leagueKey}
              onClick={() => setSelectedLeague(leagueKey as keyof typeof LEAGUE_IDS)}
              className={`px-4 py-2 editorial-label whitespace-nowrap transition-colors ${
                isActive ? 'bg-black text-white' : 'hover:border-accent'
              }`}
              style={isActive ? {} : { backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
            >
              {LEAGUE_NAMES[LEAGUE_IDS[leagueKey as keyof typeof LEAGUE_IDS] as keyof typeof LEAGUE_NAMES] || leagueKey}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : standings.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg" style={{ color: 'var(--color-text-tertiary)' }}>No standings available for {leagueName}</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-primary)' }}>
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>Pos</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Team</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>P</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>W</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>D</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>L</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>GF</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>GA</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>GD</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-tertiary)' }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => (
                  <motion.tr
                    key={team.idStanding}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`border-b transition-colors ${
                      idx < 4 ? '' : idx >= standings.length - 4 ? '' : ''
                    }`}
                    style={{
                      borderBottom: idx < standings.length - 1 ? '1px solid var(--color-border-primary)' : 'none',
                      backgroundColor: idx < 4 ? 'rgba(34,197,94,0.08)' : idx >= standings.length - 4 ? 'rgba(239,68,68,0.08)' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if (!idx.toString().includes('relegation') && idx >= 4 && idx < standings.length - 4) e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx < 4 ? 'rgba(34,197,94,0.08)' : idx >= standings.length - 4 ? 'rgba(239,68,68,0.08)' : 'transparent'; }}
                  >
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`font-display font-black ${
                          idx === 0 ? 'text-yellow-500' : idx < 4 ? 'text-green-600' : idx >= standings.length - 4 ? 'text-red-500' : ''
                        }`} style={{ color: idx >= 4 && idx < standings.length - 4 ? 'var(--color-text-secondary)' : undefined }}>
                          {team.intRank}
                        </span>
                        {getPositionIcon(idx + 1, idx)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {team.strTeamBadge && (
                          <img src={team.strTeamBadge} alt={team.strTeam} className="w-6 h-6 object-contain" />
                        )}
                        <span className="font-display font-bold">{team.strTeam}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-sm" style={{ color: 'var(--color-text-secondary)' }}>{team.intPlayed}</td>
                    <td className="p-4 text-center font-mono text-sm text-green-600 font-bold">{team.intWin}</td>
                    <td className="p-4 text-center font-mono text-sm" style={{ color: 'var(--color-text-secondary)' }}>{team.intDraw}</td>
                    <td className="p-4 text-center font-mono text-sm text-red-500">{team.intLoss}</td>
                    <td className="p-4 text-center font-mono text-sm" style={{ color: 'var(--color-text-secondary)' }}>{team.intGoalsFor}</td>
                    <td className="p-4 text-center font-mono text-sm" style={{ color: 'var(--color-text-secondary)' }}>{team.intGoalsAgainst}</td>
                    <td className="p-4 text-center font-mono text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {parseInt(team.intGoalsFor) - parseInt(team.intGoalsAgainst)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3 py-1 bg-black text-white text-sm font-black rounded">
                        {team.intPoints}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ad below standings table */}
          <div className="pt-6">
            <AdPromo size="leaderboard" id="standings-bottom-ad" />
          </div>
        </>
      )}
    </div>
  );
}