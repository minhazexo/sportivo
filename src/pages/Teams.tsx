import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpRight, Trophy } from 'lucide-react';
import AdPromo from '../components/ads/AdPromo';
import { Link } from 'react-router-dom';
import { getTeams } from '../lib/sportsApi';
import type { Team } from '../lib/sportsApi';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [league, setLeague] = useState('English Premier League');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      try {
        const data = await getTeams(league);
        setTeams(data.teams || []);
      } catch (error) {
        console.error("Teams error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [league]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-black pb-6">
        <div>
          <h1 className="editorial-title text-5xl italic tracking-[ -0.05em]">Team Directory</h1>
          <p className="font-medium text-[13px] mt-2" style={{ color: 'var(--color-text-secondary)' }}>Historical data, active squads and seasonal performance metrics.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="editorial-label bg-black text-white px-6 py-3 border-none focus:ring-0 cursor-pointer hover:bg-accent transition-colors"
          >
            <option value="English Premier League">Premier League</option>
            <option value="Spanish La Liga">La Liga</option>
            <option value="German Bundesliga">Bundesliga</option>
            <option value="French Ligue 1">Ligue 1</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="editorial-label animate-pulse" style={{ color: 'var(--color-text-tertiary)' }}>Retrieving Database...</div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg" style={{ color: 'var(--color-text-tertiary)' }}>No teams found for {league}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px editorial-border" style={{ backgroundColor: 'var(--color-border-primary)' }}>
            {teams.slice(0, Math.ceil(teams.length / 2)).map((team, idx) => (
              <Link to={`/team/${team.idTeam}`} key={team.idTeam}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="p-8 group transition-all cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-card-bg)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'; }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full group-hover:bg-accent/10 transition-colors" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={team.strTeamBadge} alt={team.strTeam} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="editorial-title text-xl group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-primary)' }}>{team.strTeam}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="editorial-label text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>{team.strStadium}</span>
                      <span style={{ color: 'var(--color-border-primary)' }}>•</span>
                      <span className="editorial-label text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>EST. {team.intFormedYear}</span>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
                    <span className="editorial-label text-accent">View Profile</span>
                    <ArrowUpRight className="w-4 h-4 text-accent" />
                  </div>
                </div>
              </motion.div>
            </Link>
            ))}
          </div>

          {/* Ad between team grid rows */}
          <div className="my-8">
            <AdPromo size="leaderboard" id="teams-inline-ad" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px editorial-border" style={{ backgroundColor: 'var(--color-border-primary)' }}>
            {teams.slice(Math.ceil(teams.length / 2)).map((team, idx) => (
              <Link to={`/team/${team.idTeam}`} key={team.idTeam}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="p-8 group transition-all cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-card-bg)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'; }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full group-hover:bg-accent/10 transition-colors" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={team.strTeamBadge} alt={team.strTeam} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="editorial-title text-xl group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-primary)' }}>{team.strTeam}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="editorial-label text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>{team.strStadium}</span>
                      <span style={{ color: 'var(--color-border-primary)' }}>•</span>
                      <span className="editorial-label text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>EST. {team.intFormedYear}</span>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
                    <span className="editorial-label text-accent">View Profile</span>
                    <ArrowUpRight className="w-4 h-4 text-accent" />
                  </div>
                </div>
              </motion.div>
            </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
