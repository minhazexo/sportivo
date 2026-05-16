import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamStanding {
  intRank: string;
  strTeam: string;
  strTeamBadge: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intPoints: string;
  strForm: string;
}

interface StandingsData {
  league: string;
  country: string;
  teams: TeamStanding[];
}

const LEAGUE_IDS: Record<string, string> = {
  'Premier League': '4328',
  'La Liga': '4334',
  'Bundesliga': '4331',
  'Serie A': '4332',
  'Ligue 1': '4335',
};

const MOCK_STANDINGS: StandingsData = {
  league: 'Premier League',
  country: 'England',
  teams: [
    { intRank: '1', strTeam: 'Arsenal', strTeamBadge: '', intPlayed: '37', intWin: '26', intDraw: '8', intLoss: '3', intGoalsFor: '82', intGoalsAgainst: '26', intPoints: '86', strForm: 'WWWWD' },
    { intRank: '2', strTeam: 'Liverpool', strTeamBadge: '', intPlayed: '37', intWin: '25', intDraw: '9', intLoss: '3', intGoalsFor: '78', intGoalsAgainst: '32', intPoints: '84', strForm: 'WWWDW' },
    { intRank: '3', strTeam: 'Manchester City', strTeamBadge: '', intPlayed: '37', intWin: '24', intDraw: '7', intLoss: '6', intGoalsFor: '71', intGoalsAgainst: '35', intPoints: '79', strForm: 'LWWWW' },
    { intRank: '4', strTeam: 'Chelsea', strTeamBadge: '', intPlayed: '37', intWin: '21', intDraw: '8', intLoss: '8', intGoalsFor: '65', intGoalsAgainst: '45', intPoints: '71', strForm: 'WDWLW' },
    { intRank: '5', strTeam: 'Manchester United', strTeamBadge: '', intPlayed: '37', intWin: '18', intDraw: '6', intLoss: '13', intGoalsFor: '52', intGoalsAgainst: '45', intPoints: '60', strForm: 'LLWLW' },
    { intRank: '6', strTeam: 'Newcastle', strTeamBadge: '', intPlayed: '37', intWin: '17', intDraw: '7', intLoss: '13', intGoalsFor: '58', intGoalsAgainst: '54', intPoints: '58', strForm: 'WWLWL' },
    { intRank: '7', strTeam: 'Tottenham', strTeamBadge: '', intPlayed: '37', intWin: '16', intDraw: '5', intLoss: '16', intGoalsFor: '63', intGoalsAgainst: '62', intPoints: '53', strForm: 'LWLLW' },
    { intRank: '8', strTeam: 'Brighton', strTeamBadge: '', intPlayed: '37', intWin: '14', intDraw: '8', intLoss: '15', intGoalsFor: '55', intGoalsAgainst: '58', intPoints: '50', strForm: 'WLDWL' },
  ]
};

export default function Standings() {
  const [standings, setStandings] = useState<StandingsData>(MOCK_STANDINGS);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('Premier League');

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      try {
        const leagueId = LEAGUE_IDS[selectedLeague];
        const response = await fetch(`/api/sports/standings?league=${leagueId}`);
        const data = await response.json();
        if (data.table && data.table.length > 0) {
          setStandings({
            league: selectedLeague,
            country: 'Various',
            teams: data.table.map((t: any) => ({
              intRank: t.position,
              strTeam: t.team?.name || t.teamName,
              strTeamBadge: t.team?.logo || '',
              intPlayed: t.playedGames,
              intWin: t.won,
              intDraw: t.draw,
              intLoss: t.lost,
              intGoalsFor: t.goalsFor,
              intGoalsAgainst: t.goalsAgainst,
              intPoints: t.points,
              strForm: t.form || '',
            }))
          });
        }
      } catch (error) {
        console.error("Standings error:", error);
        setStandings(MOCK_STANDINGS);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [selectedLeague]);

  const getPositionIcon = (pos: number, prevPos: number) => {
    if (pos < prevPos) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (pos > prevPos) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-zinc-400" />;
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
            <p className="text-zinc-500 text-[13px] font-medium mt-1">League tables and rankings</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {Object.keys(LEAGUE_IDS).map(league => (
          <button
            key={league}
            onClick={() => setSelectedLeague(league)}
            className={`px-4 py-2 editorial-label whitespace-nowrap transition-colors ${
              selectedLeague === league
                ? 'bg-black text-white'
                : 'bg-white border border-zinc-200 text-zinc-500 hover:border-accent'
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Pos</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Team</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">P</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">W</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">D</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">L</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">GF</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">GA</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">GD</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Pts</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.teams.map((team, idx) => (
                <motion.tr
                  key={team.intRank}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`border-b border-zinc-50 hover:bg-zinc-50 transition-colors ${
                    idx < 4 ? 'bg-green-50/50' : idx >= standings.teams.length - 4 ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`font-display font-black ${
                        idx === 0 ? 'text-yellow-500' : idx < 4 ? 'text-green-600' : idx >= standings.teams.length - 4 ? 'text-red-500' : 'text-zinc-600'
                      }`}>
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
                  <td className="p-4 text-center font-mono text-sm text-zinc-600">{team.intPlayed}</td>
                  <td className="p-4 text-center font-mono text-sm text-green-600 font-bold">{team.intWin}</td>
                  <td className="p-4 text-center font-mono text-sm text-zinc-500">{team.intDraw}</td>
                  <td className="p-4 text-center font-mono text-sm text-red-500">{team.intLoss}</td>
                  <td className="p-4 text-center font-mono text-sm text-zinc-600">{team.intGoalsFor}</td>
                  <td className="p-4 text-center font-mono text-sm text-zinc-600">{team.intGoalsAgainst}</td>
                  <td className="p-4 text-center font-mono text-sm font-bold text-zinc-800">
                    {parseInt(team.intGoalsFor) - parseInt(team.intGoalsAgainst)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-3 py-1 bg-black text-white text-sm font-black rounded">
                      {team.intPoints}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1">
                      {team.strForm.split('').map((form, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 flex items-center justify-center text-[8px] font-bold rounded ${
                            form === 'W' ? 'bg-green-500 text-white' : form === 'D' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                          }`}
                        >
                          {form}
                        </span>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}