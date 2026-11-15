import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Brick } from './types';

// Stories you saved for later, newest first. Saved on the phone.
export type SavedStory = { brick: Brick; section: string; date: string; savedAt: number };

type SavedValue = {
  saved: SavedStory[];
  isSaved: (id: string) => boolean;
  toggle: (story: Omit<SavedStory, 'savedAt'>) => void;
  remove: (id: string) => void;
};

const SavedContext = createContext<SavedValue>(null as unknown as SavedValue);
const KEY = 'saved:stories';
const MAX_SAVED = 100;

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedStory[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => raw && setSaved(JSON.parse(raw) as SavedStory[]));
  }, []);

  const value = useMemo<SavedValue>(() => {
    const store = (next: SavedStory[]) => {
      setSaved(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next));
    };
    return {
      saved,
      isSaved: (id) => saved.some((s) => s.brick.id === id),
      toggle: (story) =>
        store(
          saved.some((s) => s.brick.id === story.brick.id)
            ? saved.filter((s) => s.brick.id !== story.brick.id)
            : [{ ...story, savedAt: Date.now() }, ...saved].slice(0, MAX_SAVED),
        ),
      remove: (id) => store(saved.filter((s) => s.brick.id !== id)),
    };
  }, [saved]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedValue {
  return useContext(SavedContext);
}
