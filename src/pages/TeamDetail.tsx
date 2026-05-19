import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, ChevronLeft, Star } from 'lucide-react';
import AdPromo from '../components/ads/AdPromo';
import { useAuth } from '../context/AuthContext';
import { getTeam, getTeamEvents } from '../lib/sportsApi';
import type { Team, Match } from '../lib/sportsApi';
import apiClient from '../lib/apiClient';

interface Article {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    async function fetchTeamData() {
      setLoading(true);
      try {
        const data = await getTeam(id);
        
        if (data.teams && data.teams.length > 0) {
          const teamData = data.teams[0];
          setTeam(teamData);
        }
        
        const eventsData = await getTeamEvents(id);
        
        if (eventsData.events) {
          const upcoming = eventsData.events.filter((e: Match) => {
            const score = e.intHomeScore;
            return score === null || score === undefined || score === 0 || score === '0';
          });
          const recent = eventsData.events.filter((e: Match) => {
            const score = e.intHomeScore;
            return score !== null && score !== undefined && score !== 0 && score !== '0';
          });
          setUpcomingMatches(upcoming.slice(0, 5));
          setRecentResults(recent.slice(0, 5));
        }
      } catch (error) {
        console.error("Team fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeamData();
  }, [id]);

  useEffect(() => {
    if (team && profile?.favoriteTeams) {
      setIsFollowing(profile.favoriteTeams.includes(team.idTeam || team.id));
    } else {
      setIsFollowing(false);
    }
  }, [team, profile]);

  async function toggleFollow() {
    if (!user || !team) return;
    const teamId = team.idTeam || team.id;
    if (!teamId) return;
    
    try {
      if (isFollowing) {
        await apiClient.delete(`/users/favorite-teams/${teamId}`);
        setIsFollowing(false);
      } else {
        await apiClient.post('/users/favorite-teams', { teamId });
        setIsFollowing(true);
      }
      if (refreshProfile) {
        await refreshProfile(); // Dynamically sync the new favorites list to AuthContext
      }
    } catch (error) {
      console.error("[TeamDetail] Toggle follow error:", error);
    }
  }

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
    </div>
  );

  if (!team) return (
    <div className="text-center py-20">
      <p className="text-[var(--color-text-secondary)]">Team not found</p>
      <Link to="/teams" className="text-accent hover:underline mt-4 inline-block">
        Back to Teams
      </Link>
    </div>
  );

  return (
    <div className="space-y-12">
      <Link 
        to="/teams" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-accent transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Teams
      </Link>

      <header className="bg-[var(--color-hero-bg)] text-white p-12 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-32 h-32 bg-white rounded-3xl p-4">
            <img 
              src={team.strTeamBadge || team.strTeamLogo} 
              alt={team.strTeam} 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="editorial-title text-5xl mb-2">{team.strTeam}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[13px] font-medium text-[var(--color-text-tertiary)]">
              {team.strLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {team.strLocation}
                </span>
              )}
              {team.strStadium && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {team.strStadium}
                </span>
              )}
              {team.intFormedYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Est. {team.intFormedYear}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            {user && (
              <button
                onClick={toggleFollow}
                className={`flex items-center gap-2 px-6 py-3 editorial-label transition-colors ${
                  isFollowing 
                    ? 'bg-accent text-white' 
                    : 'bg-white text-black hover:bg-accent hover:text-white'
                }`}
              >
                <Star className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </header>

      {team.strDescriptionEN && (
        <div className="bg-[var(--color-card-bg)] p-8 border border-[var(--color-border-primary)] rounded-2xl">
          <h2 className="editorial-title text-xl mb-4">About</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">{team.strDescriptionEN}</p>
        </div>
      )}

      {/* Team detail ad */}
      <div className="mb-8">
        <AdPromo size="leaderboard" id="team-detail-ad" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="editorial-title text-2xl border-b-2 border-[var(--color-text-primary)] pb-2">Upcoming Matches</h2>
          {upcomingMatches.length === 0 ? (
            <p className="text-[var(--color-text-tertiary)]">No upcoming matches</p>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match, idx) => (
                <motion.div
                  key={match.idEvent}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] p-4 hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold">{match.strHomeTeam}</span>
                      <span className="text-[var(--color-text-tertiary)]">vs</span>
                      <span className="font-display font-bold">{match.strAwayTeam}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-[var(--color-text-secondary)]">{match.dateEvent}</span>
                      <span className="text-xs text-accent ml-2">{match.strTime}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="editorial-title text-2xl border-b-2 border-[var(--color-text-primary)] pb-2">Recent Results</h2>
          {recentResults.length === 0 ? (
            <p className="text-[var(--color-text-tertiary)]">No recent matches</p>
          ) : (
            <div className="space-y-3">
              {recentResults.map((match, idx) => (
                <motion.div
                  key={match.idEvent}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold">{match.strHomeTeam}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-black">{match.intHomeScore}</span>
                        <span className="text-[var(--color-text-tertiary)]">-</span>
                        <span className="font-black">{match.intAwayScore}</span>
                      </div>
                      <span className="font-display font-bold">{match.strAwayTeam}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{match.dateEvent}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}