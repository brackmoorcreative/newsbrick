// Every topic the daily job writes bricks for. Ids must match backend/src/config.ts.
// Order here is the order stories appear in the app.

export type Topic = { id: string; label: string };
export type TopicGroup = { title: string; sections: { label?: string; topics: Topic[] }[] };

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
          { id: 'politics-mo', label: 'Missouri' },
          { id: 'politics-stl', label: 'St. Louis' },
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
          { id: 'economy-mo', label: 'Missouri' },
          { id: 'economy-stl', label: 'St. Louis' },
        ],
      },
    ],
  },
  {
    title: 'Sports',
    sections: [
      {
        label: 'Teams',
        topics: [
          { id: 'team-mizzou-football', label: 'Mizzou Football' },
          { id: 'team-mizzou-basketball', label: 'Mizzou Basketball' },
          { id: 'team-blues', label: 'Blues' },
          { id: 'team-cardinals', label: 'Cardinals' },
          { id: 'team-chiefs', label: 'Chiefs' },
          { id: 'team-packers', label: 'Packers' },
        ],
      },
      {
        label: 'Leagues',
        topics: [
          { id: 'sports-nfl', label: 'NFL' },
          { id: 'sports-nba', label: 'NBA' },
          { id: 'sports-mlb', label: 'MLB' },
          { id: 'sports-nhl', label: 'NHL' },
          { id: 'sports-cfb', label: 'College Football' },
          { id: 'sports-cbb', label: 'College Basketball' },
          { id: 'sports-mls', label: 'MLS' },
          { id: 'sports-epl', label: 'Premier League' },
        ],
      },
    ],
  },
];

export const TOPIC_ORDER: string[] = TOPIC_GROUPS.flatMap((g) =>
  g.sections.flatMap((s) => s.topics.map((t) => t.id)),
);

// What a new user sees before changing anything in Settings.
export const DEFAULT_TOPICS = [
  'top-us',
  'politics-us',
  'politics-mo',
  'politics-stl',
  'economy-us',
  'team-mizzou-football',
  'team-mizzou-basketball',
  'team-blues',
  'team-cardinals',
  'team-packers',
];

// Editions saved before topics existed used this id for US politics.
export const LEGACY_IDS: Record<string, string> = { 'us-politics': 'politics-us' };

export const STORIES_PER_TOPIC = [2, 3, 5] as const;
export type StoriesPerTopic = (typeof STORIES_PER_TOPIC)[number];
