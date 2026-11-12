import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_TOPICS, STORIES_PER_DAY, type StoriesPerDay } from './topics';

// Which topics you follow and how many stories per day. Saved on the phone.
type PrefsValue = {
  topics: string[];
  perDay: StoriesPerDay;
  toggleTopic: (id: string) => void;
  setPerDay: (n: StoriesPerDay) => void;
};

const PrefsContext = createContext<PrefsValue>({
  topics: DEFAULT_TOPICS,
  perDay: 5,
  toggleTopic: () => {},
  setPerDay: () => {},
});

const TOPICS_KEY = 'settings:topics';
const PER_DAY_KEY = 'settings:perDay';

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [perDay, setPerDayState] = useState<StoriesPerDay>(5);

  useEffect(() => {
    (async () => {
      const savedTopics = await AsyncStorage.getItem(TOPICS_KEY);
      if (savedTopics) setTopics(JSON.parse(savedTopics) as string[]);
      const savedPer = Number(await AsyncStorage.getItem(PER_DAY_KEY));
      if ((STORIES_PER_DAY as readonly number[]).includes(savedPer)) {
        setPerDayState(savedPer as StoriesPerDay);
      }
    })();
  }, []);

  const value = useMemo<PrefsValue>(
    () => ({
      topics,
      perDay,
      toggleTopic: (id) => {
        const next = topics.includes(id) ? topics.filter((t) => t !== id) : [...topics, id];
        setTopics(next);
        AsyncStorage.setItem(TOPICS_KEY, JSON.stringify(next));
      },
      setPerDay: (n) => {
        setPerDayState(n);
        AsyncStorage.setItem(PER_DAY_KEY, String(n));
      },
    }),
    [topics, perDay],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  return useContext(PrefsContext);
}
