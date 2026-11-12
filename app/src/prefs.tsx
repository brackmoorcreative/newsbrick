import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_TOPICS, STORIES_PER_TOPIC, type StoriesPerTopic } from './topics';

// Which topics you follow and how many stories per topic. Saved on the phone.
type PrefsValue = {
  topics: string[];
  perTopic: StoriesPerTopic;
  toggleTopic: (id: string) => void;
  setPerTopic: (n: StoriesPerTopic) => void;
};

const PrefsContext = createContext<PrefsValue>({
  topics: DEFAULT_TOPICS,
  perTopic: 3,
  toggleTopic: () => {},
  setPerTopic: () => {},
});

const TOPICS_KEY = 'settings:topics';
const PER_TOPIC_KEY = 'settings:perTopic';

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [perTopic, setPerTopicState] = useState<StoriesPerTopic>(3);

  useEffect(() => {
    (async () => {
      const savedTopics = await AsyncStorage.getItem(TOPICS_KEY);
      if (savedTopics) setTopics(JSON.parse(savedTopics) as string[]);
      const savedPer = Number(await AsyncStorage.getItem(PER_TOPIC_KEY));
      if ((STORIES_PER_TOPIC as readonly number[]).includes(savedPer)) {
        setPerTopicState(savedPer as StoriesPerTopic);
      }
    })();
  }, []);

  const value = useMemo<PrefsValue>(
    () => ({
      topics,
      perTopic,
      toggleTopic: (id) => {
        const next = topics.includes(id) ? topics.filter((t) => t !== id) : [...topics, id];
        setTopics(next);
        AsyncStorage.setItem(TOPICS_KEY, JSON.stringify(next));
      },
      setPerTopic: (n) => {
        setPerTopicState(n);
        AsyncStorage.setItem(PER_TOPIC_KEY, String(n));
      },
    }),
    [topics, perTopic],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  return useContext(PrefsContext);
}
