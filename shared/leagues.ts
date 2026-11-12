// Sports leagues NewsBrick covers, by ESPN API path. Shared by the daily job (one topic per
// league) and the worker (team search). Ids must match the league list in app/src/topics.ts.
export const LEAGUES: { id: string; name: string; path: string }[] = [
  { id: "sports-nfl", name: "NFL", path: "football/nfl" },
  { id: "sports-nba", name: "NBA", path: "basketball/nba" },
  { id: "sports-wnba", name: "WNBA", path: "basketball/wnba" },
  { id: "sports-mlb", name: "MLB", path: "baseball/mlb" },
  { id: "sports-nhl", name: "NHL", path: "hockey/nhl" },
  { id: "sports-cfb", name: "College Football", path: "football/college-football" },
  { id: "sports-cbb", name: "College Basketball", path: "basketball/mens-college-basketball" },
  { id: "sports-mls", name: "MLS", path: "soccer/usa.1" },
  { id: "sports-epl", name: "Premier League", path: "soccer/eng.1" },
  { id: "sports-laliga", name: "La Liga", path: "soccer/esp.1" },
  { id: "sports-bundesliga", name: "Bundesliga", path: "soccer/ger.1" },
  { id: "sports-seriea", name: "Serie A", path: "soccer/ita.1" },
  { id: "sports-ligue1", name: "Ligue 1", path: "soccer/fra.1" },
  { id: "sports-ucl", name: "Champions League", path: "soccer/uefa.champions" },
  { id: "sports-ligamx", name: "Liga MX", path: "soccer/mex.1" },
  { id: "sports-f1", name: "Formula 1", path: "racing/f1" },
  { id: "sports-tennis", name: "Tennis", path: "tennis/atp" },
  { id: "sports-golf", name: "Golf", path: "golf/pga" },
];
