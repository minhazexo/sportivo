// ----------------------------------------------------
// Mappers for Database to API Models
// ----------------------------------------------------

export function mapDbMatchToApi(match: any) {
  return {
    idEvent: match.id,
    idLeague: match.leagueId,
    strLeague: match.leagueName,
    idHomeTeam: match.homeTeamId,
    idAwayTeam: match.awayTeamId,
    strHomeTeam: match.homeTeamName,
    strAwayTeam: match.awayTeamName,
    intHomeScore: match.homeScore,
    intAwayScore: match.awayScore,
    strStatus: match.status,
    dateEvent: match.date,
    strTime: match.time,
    strThumb: match.thumb,
    strVideo: match.video,
    strSport: match.sport,
  };
}

export function mapDbTeamToApi(team: any) {
  return {
    idTeam: team.id,
    strTeam: team.name,
    strTeamShort: team.shortName,
    strTeamBadge: team.badge,
    strStadium: team.stadium,
    strLocation: team.stadiumLoc,
    strWebsite: team.website,
    strDescriptionEN: team.descriptionEN,
    intFormedYear: team.formedYear,
    strSport: team.sport,
    strLeague: team.league,
    idLeague: team.leagueId,
    strLogo: team.logo,
    strBanner: team.banner,
    strCountry: team.country,
  };
}

export function mapDbStandingToApi(standings: any[]) {
  return {
    table: standings.map(row => ({
      idStanding: `${row.leagueId || 'league'}_${row.teamId}_${row.rank}`,
      idTeam: row.teamId,
      strTeam: row.teamName,
      strTeamName: row.teamName,
      strTeamBadge: row.teamBadge,
      team: {
        idTeam: row.teamId,
        strTeamName: row.teamName,
        strTeam: row.teamName,
        strTeamBadge: row.teamBadge,
      },
      intRank: String(row.rank),
      intPlayed: String(row.played),
      intWin: String(row.won),
      intDraw: String(row.drawn),
      intLoss: String(row.lost),
      intGoalsFor: String(row.goalsFor),
      intGoalsAgainst: String(row.goalsAgainst),
      intGoalDifference: String(row.goalsDifference),
      intPoints: String(row.points),
    })),
  };
}

export function mapDbNewsToApi(news: any) {
  return {
    id: news.id,
    title: news.title,
    description: news.description,
    content: news.content,
    image: news.image,
    url: news.url,
    source: news.source,
    publishedAt: news.publishedAt instanceof Date ? news.publishedAt.toISOString() : news.publishedAt,
  };
}

export function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
}
