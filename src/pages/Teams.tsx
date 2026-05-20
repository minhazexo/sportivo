import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import AdPromo from '../components/ads/AdPromo';
import { Link } from 'react-router-dom';
import { getTeams } from '../lib/sportsApi';
import apiClient from '../lib/apiClient';
import type { Team } from '../lib/sportsApi';

interface LeagueMeta {
  id: string;
  name: string;
  displayName: string;
  sport: string;
  country: string;
  teamCount: number;
}

const SPORT_ICONS: Record<string, string> = {
  'Soccer': '⚽',
  'Basketball': '🏀',
  'American Football': '🏈',
  'Baseball': '⚾',
  'Ice Hockey': '🏒',
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<LeagueMeta[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedLeagueName, setSelectedLeagueName] = useState<string>('English Premier League');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Fetch available leagues on mount
  useEffect(() => {
    async function fetchLeagues() {
      try {
        const data = await apiClient.get('/leagues');
        if (data.leagues) {
          const withTeams = data.leagues.filter((l: any) => l.teamCount > 0);
          setLeagues(withTeams);
          if (withTeams.length > 0 && !selectedLeagueId) {
            setSelectedLeagueId(withTeams[0].id);
            setSelectedLeagueName(withTeams[0].displayName);
          }
        }
      } catch (error) {
        console.error('[Teams] Failed to fetch leagues:', error);
      }
    }
    fetchLeagues();
  }, []);

  // Fetch teams when league changes
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedLeagueName) return;
      setLoading(true);
      try {
        const data = await getTeams(selectedLeagueName);
        setTeams(data.teams || []);
      } catch (error) {
        console.error("Teams error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [selectedLeagueName]);

  // Get unique sports from available leagues
  const sports = ['All', ...new Set(leagues.map(l => l.sport).filter(Boolean))];

  // Filter leagues by selected sport
  const filteredLeagues = selectedSport === 'All'
    ? leagues
    : leagues.filter(l => l.sport === selectedSport);

  function handleLeagueSelect(leagueId: string, leagueName: string) {
    setSelectedLeagueId(leagueId);
    setSelectedLeagueName(leagueName);
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-black pb-6">
        <div>
          <h1 className="editorial-title text-5xl italic tracking-[ -0.05em]">Team Directory</h1>
          <p className="font-medium text-[13px] mt-2" style={{ color: 'var(--color-text-secondary)' }}>Historical data, active squads and seasonal performance metrics across {leagues.length} leagues.</p>
        </div>
      </header>

      {/* Sport filter tabs */}
      <div className="flex flex-wrap gap-2 -mt-4">
        {sports.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`editorial-label px-4 py-2 whitespace-nowrap transition-colors ${
              selectedSport === sport
                ? 'bg-black text-white'
                : 'bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-accent hover:text-accent'
            }`}
          >
            {sport === 'All' ? '🏆 All Sports' : `${SPORT_ICONS[sport] || ''} ${sport}`}
          </button>
        ))}
      </div>

      {/* League selector tabs */}
      <div className="flex flex-wrap gap-2">
        {filteredLeagues.map(l => (
          <button
            key={l.id}
            onClick={() => handleLeagueSelect(l.id, l.displayName)}
            className={`editorial-label px-5 py-3 whitespace-nowrap transition-all ${
              selectedLeagueId === l.id
                ? 'bg-accent text-white shadow-lg'
                : 'bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-accent hover:text-accent hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              {SPORT_ICONS[l.sport] || '🏆'}
              <span className="font-semibold">{l.displayName}</span>
              <span className="text-[10px] opacity-60">({l.teamCount})</span>
            </span>
          </button>
        ))}
        {filteredLeagues.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No leagues available for this sport</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="editorial-label animate-pulse" style={{ color: 'var(--color-text-tertiary)' }}>Retrieving Database...</div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg" style={{ color: 'var(--color-text-tertiary)' }}>No teams found for {selectedLeagueName}</p>
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
