import type { Match, Standing, Team, ApiResponse } from './types';
import apiClient from './apiClient';

/*
  Client-side sports API wrapper.
  All requests go through the server proxy at `/api/sports/*` so the browser
  never calls external origins directly (avoids CSP/connect-src issues).
*/

const LEAGUE_IDS = {
  PREMIER_LEAGUE: '4328',
  CHAMPIONSHIP: '4329',
  LA_LIGA: '4335',
  SERIE_A: '4332',
  BUNDESLIGA: '4331',
  LIGUE_1: '4334',
  NBA: '4387',
  NFL: '4391',
  MLB: '4424',
  NHL: '4380',
} as const;

export async function getScores(leagueId?: string): Promise<ApiResponse<Match>> {
  if (leagueId) return apiClient.get(`/scores`, { league: leagueId });
  return apiClient.get(`/scores`);
}

export async function getFixtures(leagueId: string): Promise<ApiResponse<Match>> {
  return apiClient.get(`/fixtures`, { league: leagueId });
}

export async function getStandings(leagueId: string): Promise<ApiResponse<Standing>> {
  return apiClient.get(`/standings`, { league: leagueId });
}

export async function getTeams(league: string): Promise<ApiResponse<Team>> {
  return apiClient.get(`/teams/${encodeURIComponent(league)}`);
}

export async function getTeam(id: string): Promise<ApiResponse<Team>> {
  return apiClient.get(`/team/${encodeURIComponent(id)}`);
}

export async function getTeamEvents(id: string): Promise<ApiResponse<Match>> {
  return apiClient.get(`/team/${encodeURIComponent(id)}/events`);
}

export async function getMatch(id: string): Promise<ApiResponse<Match>> {
  return apiClient.get(`/match/${encodeURIComponent(id)}`);
}

export async function searchTeams(teamName: string): Promise<ApiResponse<Team>> {
  return apiClient.get(`/search-teams`, { t: teamName });
}

export async function getSportsNews(query: string = 'sports news', limit: number = 10): Promise<any> {
  return apiClient.get(`/news`, { q: query, limit });
}

export async function getWorldCupNews(limit: number = 20): Promise<any> {
  return apiClient.get(`/world-cup-news`, { limit });
}

export type { Match, Standing, Team, ApiResponse, NewsArticle, NewsResponse, User, Article, Comment, GeminiResponse } from './types';
export { LEAGUE_IDS };
