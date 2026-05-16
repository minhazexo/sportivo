const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

async function fetchSports(endpoint: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export function getScores(leagueId?: string) {
  if (leagueId) {
    return fetchSports('eventspastleague.php', { id: leagueId });
  }
  const today = new Date().toISOString().split('T')[0];
  return fetchSports('eventsday.php', { d: today, s: 'soccer' });
}

export function getFixtures(leagueId: string) {
  return fetchSports('eventsnextleague.php', { id: leagueId });
}

export function getStandings(leagueId: string) {
  return fetchSports('lookuptable.php', { l: leagueId });
}

export function getTeams(league: string) {
  return fetchSports('search_all_teams.php', { l: league });
}

export function getTeam(id: string) {
  return fetchSports('lookupteam.php', { id });
}

export function getTeamEvents(id: string) {
  return fetchSports('eventslast.php', { id });
}

export function getMatch(id: string) {
  return fetchSports('lookupevent.php', { id });
}
