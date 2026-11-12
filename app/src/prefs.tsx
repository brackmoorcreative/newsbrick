import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_TOPICS,
  LEGACY_PLACES,
  LEGACY_TEAMS,
  placeTopicId,
  STORIES_PER_DAY,
  teamTopicId,
  type PlaceFacet,
  type StoriesPerDay,
  type Team,
} from './topics';

// What you follow: fixed topics, your places (each with its own facets), and your teams.
// Saved on the phone.
type PrefsValue = {
  topics: string[]; // every followed topic id, including place facets and teams
  places: string[];
  teams: Team[];
  perDay: StoriesPerDay;
  toggleTopic: (id: string) => void;
  setPerDay: (n: StoriesPerDay) => void;
  addPlace: (name: string, facets?: PlaceFacet[]) => void;
  removePlace: (name: string) => void;
  addTeam: (team: Team) => void;
  removeTeam: (team: Team) => void;
};

const PrefsContext = createContext<PrefsValue>(null as unknown as PrefsValue);

const KEYS = { topics: 'settings:topics', places: 'settings:places', teams: 'settings:teams', perDay: 'settings:perDay' };

type Saved = { topics: string[]; places: string[]; teams: Team[] };

// Earlier versions only knew Missouri: turn their topics into places and teams.
function migrate(saved: Saved): Saved {
  const out: Saved = { topics: [], places: [...saved.places], teams: [...saved.teams] };
  for (const id of saved.topics) {
    const place = LEGACY_PLACES[id];
    const team = LEGACY_TEAMS[id];
    if (place) {
      if (!out.places.includes(place.name)) out.places.push(place.name);
      out.topics.push(placeTopicId(place.name, place.facet));
    } else if (team) {
      if (!out.teams.some((t) => teamTopicId(t) === teamTopicId(team))) out.teams.push(team);
      out.topics.push(teamTopicId(team));
    } else {
      out.topics.push(id);
    }
  }
  return out;
}

// What earlier versions showed before you changed anything.
const OLD_DEFAULT_TOPICS = ['top-us', 'politics-us', 'politics-mo', 'politics-stl', 'economy-us',
  'team-mizzou-football', 'team-mizzou-basketball', 'team-blues', 'team-cardinals', 'team-packers'];

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>({ topics: DEFAULT_TOPICS, places: [], teams: [] });
  const [perDay, setPerDayState] = useState<StoriesPerDay>(5);

  const save = (next: Saved) => {
    setState(next);
    AsyncStorage.multiSet([
      [KEYS.topics, JSON.stringify(next.topics)],
      [KEYS.places, JSON.stringify(next.places)],
      [KEYS.teams, JSON.stringify(next.teams)],
    ]);
  };

  useEffect(() => {
    (async () => {
      const [[, topics], [, places], [, teams], [, per], [, streak]] = await AsyncStorage.multiGet([
        KEYS.topics, KEYS.places, KEYS.teams, KEYS.perDay, 'streak',
      ]);
      const savedPer = Number(per);
      if ((STORIES_PER_DAY as readonly number[]).includes(savedPer)) setPerDayState(savedPer as StoriesPerDay);

      // Someone who used an earlier version but never changed topics had the old Missouri set.
      const startTopics = topics ? (JSON.parse(topics) as string[]) : streak ? OLD_DEFAULT_TOPICS : null;
      if (!startTopics) return; // brand-new reader: defaults
      const migrated = migrate({
        topics: startTopics,
        places: places ? (JSON.parse(places) as string[]) : [],
        teams: teams ? (JSON.parse(teams) as Team[]) : [],
      });
      save(migrated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<PrefsValue>(() => {
    const { topics, places, teams } = state;
    return {
      topics,
      places,
      teams,
      perDay,
      toggleTopic: (id) =>
        save({ ...state, topics: topics.includes(id) ? topics.filter((t) => t !== id) : [...topics, id] }),
      setPerDay: (n) => {
        setPerDayState(n);
        AsyncStorage.setItem(KEYS.perDay, String(n));
      },
      addPlace: (name, facets = ['news', 'politics']) => {
        const clean = name.trim().replace(/\s+/g, ' ');
        if (!clean || places.some((p) => p.toLowerCase() === clean.toLowerCase())) return;
        const ids = facets.map((f) => placeTopicId(clean, f)).filter((id) => !topics.includes(id));
        save({ ...state, places: [...places, clean], topics: [...topics, ...ids] });
      },
      removePlace: (name) => {
        const ids = new Set((['news', 'politics', 'economy'] as const).map((f) => placeTopicId(name, f)));
        save({ ...state, places: places.filter((p) => p !== name), topics: topics.filter((t) => !ids.has(t)) });
      },
      addTeam: (team) => {
        const id = teamTopicId(team);
        if (teams.some((t) => teamTopicId(t) === id)) return;
        save({ ...state, teams: [...teams, team], topics: [...topics, id] });
      },
      removeTeam: (team) => {
        const id = teamTopicId(team);
        save({ ...state, teams: teams.filter((t) => teamTopicId(t) !== id), topics: topics.filter((t) => t !== id) });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, perDay]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  return useContext(PrefsContext);
}
