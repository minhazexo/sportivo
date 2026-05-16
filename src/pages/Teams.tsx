import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTeams } from '../lib/sportsApi';

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
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
          <p className="text-zinc-500 font-medium text-[13px] mt-2">Historical data, active squads and seasonal performance metrics.</p>
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
          <div className="editorial-label animate-pulse text-zinc-400">Retrieving Database...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 editorial-border">
          {teams.map((team, idx) => (
            <Link to={`/team/${team.idTeam}`}>
            <motion.div
              key={team.idTeam}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-white p-8 group hover:bg-zinc-50 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50 -mr-12 -mt-12 rounded-full group-hover:bg-accent/10 transition-colors" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 grayscale group-hover:grayscale-0 transition-all duration-500">
                  <img src={team.strTeamBadge} alt={team.strTeam} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="editorial-title text-xl text-editorial-text group-hover:text-accent transition-colors">{team.strTeam}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="editorial-label text-[9px] text-zinc-400">{team.strStadium}</span>
                    <span className="text-zinc-200">•</span>
                    <span className="editorial-label text-[9px] text-zinc-400">EST. {team.intFormedYear}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-zinc-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="editorial-label text-accent">View Profile</span>
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                </div>
              </div>
            </motion.div>
          </Link>
          ))}
        </div>
      )}
    </div>
  );
}
