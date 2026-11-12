// What you can follow in NewsBrick.
//
// Fixed topics are written every morning by the daily job (ids must match
// backend/src/config.ts). Places (any city, state, or country) and teams are added by you
// and written on demand by the NewsBrick service (worker/).

export type Topic = { id: string; label: string };
export type TopicGroup = { title: string; sections: { label?: string; topics: Topic[] }[] };

// Sports leagues, by ESPN API path. Must match shared/leagues.ts.
export const LEAGUES = [
  { key: 'nfl', name: 'NFL', path: 'football/nfl' },
  { key: 'nba', name: 'NBA', path: 'basketball/nba' },
  { key: 'wnba', name: 'WNBA', path: 'basketball/wnba' },
  { key: 'mlb', name: 'MLB', path: 'baseball/mlb' },
  { key: 'nhl', name: 'NHL', path: 'hockey/nhl' },
  { key: 'cfb', name: 'College Football', path: 'football/college-football' },
  { key: 'cbb', name: 'College Basketball', path: 'basketball/mens-college-basketball' },
  { key: 'mls', name: 'MLS', path: 'soccer/usa.1' },
  { key: 'epl', name: 'Premier League', path: 'soccer/eng.1' },
  { key: 'laliga', name: 'La Liga', path: 'soccer/esp.1' },
  { key: 'bundesliga', name: 'Bundesliga', path: 'soccer/ger.1' },
  { key: 'seriea', name: 'Serie A', path: 'soccer/ita.1' },
  { key: 'ligue1', name: 'Ligue 1', path: 'soccer/fra.1' },
  { key: 'ucl', name: 'Champions League', path: 'soccer/uefa.champions' },
  { key: 'ligamx', name: 'Liga MX', path: 'soccer/mex.1' },
  { key: 'f1', name: 'Formula 1', path: 'racing/f1' },
  { key: 'tennis', name: 'Tennis', path: 'tennis/atp' },
  { key: 'golf', name: 'Golf', path: 'golf/pga' },
] as const;

// Leagues whose teams you can follow one by one.
export const TEAM_LEAGUES = LEAGUES.filter((l) => !['f1', 'tennis', 'golf'].includes(l.key));

export const TOPIC_GROUPS: TopicGroup[] = [
  {
    title: 'Top stories',
    sections: [
      {
        topics: [
          { id: 'top-world', label: 'World' },
          { id: 'top-us', label: 'United States' },
        ],
      },
    ],
  },
  {
    title: 'Politics & government',
    sections: [
      {
        topics: [
          { id: 'politics-world', label: 'World' },
          { id: 'politics-us', label: 'United States' },
        ],
      },
    ],
  },
  {
    title: 'Economy & money',
    sections: [
      {
        topics: [
          { id: 'economy-world', label: 'World' },
          { id: 'economy-us', label: 'United States' },
        ],
      },
    ],
  },
  {
    title: 'World regions',
    sections: [
      {
        topics: [
          { id: 'region-africa', label: 'Africa' },
          { id: 'region-asia', label: 'Asia & Pacific' },
          { id: 'region-europe', label: 'Europe' },
          { id: 'region-latam', label: 'Latin America' },
          { id: 'region-mideast', label: 'Middle East' },
        ],
      },
    ],
  },
  {
    title: 'Sports',
    sections: [
      {
        label: 'Leagues',
        topics: [
          { id: 'sports-top', label: 'Top headlines' },
          ...LEAGUES.map((l) => ({ id: `sports-${l.key}`, label: l.name })),
        ],
      },
    ],
  },
];

// ---------- Places and teams you add ----------

export type PlaceFacet = 'news' | 'politics' | 'economy';
export const PLACE_FACETS: { facet: PlaceFacet; label: string }[] = [
  { facet: 'news', label: 'Local news' },
  { facet: 'politics', label: 'Politics' },
  { facet: 'economy', label: 'Economy' },
];
export type Team = { league: string; id: string; name: string; logo?: string };

// Must match the worker's slug() so ids line up with the stories it writes.
export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}
export const placeTopicId = (name: string, facet: PlaceFacet) => `place-${slug(name)}-${facet}`;
export const teamTopicId = (t: Pick<Team, 'league' | 'id'>) => `team-${t.league}-${t.id.toLowerCase()}`;

// Which kind of news a topic is, used to keep the day's stories balanced.
const FIXED_GROUP_OF: Record<string, string> = Object.fromEntries(
  TOPIC_GROUPS.flatMap((g) => g.sections.flatMap((s) => s.topics.map((t) => [t.id, g.title]))),
);
export function topicGroup(id: string): string {
  if (FIXED_GROUP_OF[id]) return FIXED_GROUP_OF[id];
  if (id.startsWith('team-')) return 'Sports';
  if (id.endsWith('-politics')) return 'Politics & government';
  if (id.endsWith('-economy')) return 'Economy & money';
  return 'Top stories'; // a place's local news
}

// Tie-break order for equally important stories: your places first, then the fixed list.
export const FIXED_ORDER: string[] = TOPIC_GROUPS.flatMap((g) => g.sections.flatMap((s) => s.topics.map((t) => t.id)));

// What a new reader follows before changing anything. The quiz adds where they live.
export const DEFAULT_TOPICS = ['top-world', 'politics-world', 'economy-world', 'sports-top'];

// ---------- Settings saved by earlier versions (Missouri-only) ----------

// Old topic ids -> the place or team they became.
export const LEGACY_PLACES: Record<string, { name: string; facet: PlaceFacet }> = {
  'politics-mo': { name: 'Missouri', facet: 'politics' },
  'economy-mo': { name: 'Missouri', facet: 'economy' },
  'politics-stl': { name: 'St. Louis', facet: 'politics' },
  'economy-stl': { name: 'St. Louis', facet: 'economy' },
};
export const LEGACY_TEAMS: Record<string, Team> = {
  'team-mizzou-football': { league: 'cfb', id: '142', name: 'Missouri Tigers Football' },
  'team-mizzou-basketball': { league: 'cbb', id: '142', name: 'Missouri Tigers Basketball' },
  'team-blues': { league: 'nhl', id: 'stl', name: 'St. Louis Blues' },
  'team-cardinals': { league: 'mlb', id: 'stl', name: 'St. Louis Cardinals' },
  'team-packers': { league: 'nfl', id: 'gb', name: 'Green Bay Packers' },
  'team-chiefs': { league: 'nfl', id: 'kc', name: 'Kansas City Chiefs' },
};

// Old editions in the calendar used these ids; show them as the topics they became.
export const LEGACY_IDS: Record<string, string> = {
  'us-politics': 'politics-us',
  ...Object.fromEntries(Object.entries(LEGACY_PLACES).map(([old, p]) => [old, placeTopicId(p.name, p.facet)])),
  ...Object.fromEntries(Object.entries(LEGACY_TEAMS).map(([old, t]) => [old, teamTopicId(t)])),
};

// How many of the most important stories (across all followed topics) to show each day.
export const STORIES_PER_DAY = [3, 5, 10] as const;
export type StoriesPerDay = (typeof STORIES_PER_DAY)[number];
