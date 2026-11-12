import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { DailyBricks } from './types';

// EXPO_PUBLIC_BRICKS_URL points at .../data/latest.json. Past days live next to it
// at .../data/archive/YYYY-MM-DD.json, listed in .../data/index.json.
const LATEST_URL = process.env.EXPO_PUBLIC_BRICKS_URL;
const BASE_URL = LATEST_URL?.replace(/[^/]+$/, '') ?? '';
const readKey = (date: string) => `bricks:read:${date}`;

async function fetchJson<T>(url: string): Promise<T> {
  // `cache: 'no-store'` skips the phone's HTTP cache without adding a request header.
  // (A custom header makes browsers send a CORS preflight, which GitHub's raw server rejects.)
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return (await res.json()) as T;
}

// Loads one day's bricks: today's when date is null, otherwise that past day.
// Shows the copy saved on the phone instantly, then checks the server for a newer one.
export function useBricks(date: string | null) {
  const [data, setData] = useState<DailyBricks | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cacheKey = `bricks:${date ?? 'latest'}`;
  const url = date ? `${BASE_URL}archive/${date}.json` : LATEST_URL;

  const show = useCallback(async (bricks: DailyBricks) => {
    setData(bricks);
    const saved = await AsyncStorage.getItem(readKey(bricks.date));
    setReadIds(new Set(saved ? (JSON.parse(saved) as string[]) : []));
  }, []);

  const refresh = useCallback(async () => {
    if (!url) {
      setError('EXPO_PUBLIC_BRICKS_URL is not set. Add it to app/.env and restart Expo.');
      return;
    }
    setRefreshing(true);
    try {
      const fresh = await fetchJson<DailyBricks>(url);
      setError(null);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
      await show(fresh);
    } catch (e) {
      setError(`Couldn't load stories (${e instanceof Error ? e.message : e}).`);
    } finally {
      setRefreshing(false);
    }
  }, [url, cacheKey, show]);

  useEffect(() => {
    setData(null);
    setError(null);
    (async () => {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) await show(JSON.parse(cached) as DailyBricks);
      await refresh();
    })();
  }, [cacheKey, refresh, show]);

  const markRead = useCallback(
    (id: string) => {
      if (!data || readIds.has(id)) return;
      const next = new Set(readIds).add(id);
      setReadIds(next);
      AsyncStorage.setItem(readKey(data.date), JSON.stringify([...next]));
    },
    [data, readIds],
  );

  return { data, readIds, markRead, error, refreshing, refresh };
}

// The list of days that have an edition, for the calendar.
export function useEditionDates() {
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem('bricks:index');
      if (cached) setDates(JSON.parse(cached) as string[]);
      if (!BASE_URL) return;
      try {
        const { dates: fresh } = await fetchJson<{ dates: string[] }>(`${BASE_URL}index.json`);
        setDates(fresh);
        await AsyncStorage.setItem('bricks:index', JSON.stringify(fresh));
      } catch {
        // Offline or no archive yet: keep whatever was cached.
      }
    })();
  }, []);

  return dates;
}
