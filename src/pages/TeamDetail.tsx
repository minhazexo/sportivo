import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Trophy, ChevronLeft, Star, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Team {
  idTeam: string;
  strTeam: string;
  strTeamBadge: string;
  strTeamLogo: string;
  strStadium: string;
  strLocation: string;
  intFormedYear: string;
  strDescriptionEN: string;
  strWebsite: string;
  strFacebook: string;
  strTwitter: string;
  strInstagram: string;
}

interface Match {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  strStatus: string;
  intHomeScore: string;
  intAwayScore: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    async function fetchTeamData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/sports/team/${id}`);
        const data = await response.json();
        
        if (data.teams && data.teams.length > 0) {
          const teamData = data.teams[0];
          setTeam(teamData);
          
          if (profile?.favoriteTeams?.includes(teamData.idTeam)) {
            setIsFollowing(true);
          }
        }
        
        const eventsRes = await fetch(`/api/sports/team/${id}/events`);
        const eventsData = await eventsRes.json();
        
        if (eventsData.events) {
          const upcoming = eventsData.events.filter((e: Match) => !e.intHomeScore || e.intHomeScore === '0');
          const recent = eventsData.events.filter((e: Match) => e.intHomeScore && e.intHomeScore !== '0');
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
  }, [id, profile]);

  async function toggleFollow() {
    if (!user || !team) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      if (isFollowing) {
        await updateDoc(userRef, {
          favoriteTeams: arrayRemove(team.idTeam)
        });
        setIsFollowing(false);
      } else {
        await updateDoc(userRef, {
          favoriteTeams: arrayUnion(team.idTeam)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow error:", error);
    }
  }

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mx-auto" />
    </div>
  );

  if (!team) return (
    <div className="text-center py-20">
      <p className="text-zinc-500">Team not found</p>
      <Link to="/teams" className="text-accent hover:underline mt-4 inline-block">
        Back to Teams
      </Link>
    </div>
  );

  return (
    <div className="space-y-12">
      <Link 
        to="/teams" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Teams
      </Link>

      <header className="bg-black text-white p-12 rounded-3xl relative overflow-hidden">
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
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[13px] font-medium text-zinc-400">
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
        <div className="bg-white p-8 border border-zinc-200 rounded-2xl">
          <h2 className="editorial-title text-xl mb-4">About</h2>
          <p className="text-zinc-600 leading-relaxed">{team.strDescriptionEN}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="editorial-title text-2xl border-b-2 border-black pb-2">Upcoming Matches</h2>
          {upcomingMatches.length === 0 ? (
            <p className="text-zinc-400">No upcoming matches</p>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match, idx) => (
                <motion.div
                  key={match.idEvent}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-zinc-200 p-4 hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold">{match.strHomeTeam}</span>
                      <span className="text-zinc-300">vs</span>
                      <span className="font-display font-bold">{match.strAwayTeam}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-zinc-500">{match.dateEvent}</span>
                      <span className="text-xs text-accent ml-2">{match.strTime}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="editorial-title text-2xl border-b-2 border-black pb-2">Recent Results</h2>
          {recentResults.length === 0 ? (
            <p className="text-zinc-400">No recent matches</p>
          ) : (
            <div className="space-y-3">
              {recentResults.map((match, idx) => (
                <motion.div
                  key={match.idEvent}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-zinc-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold">{match.strHomeTeam}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-black">{match.intHomeScore}</span>
                        <span className="text-zinc-300">-</span>
                        <span className="font-black">{match.intAwayScore}</span>
                      </div>
                      <span className="font-display font-bold">{match.strAwayTeam}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{match.dateEvent}</span>
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