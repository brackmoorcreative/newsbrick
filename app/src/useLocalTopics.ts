import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { PLACE_FACETS, placeTopicId, teamTopicId, type PlaceFacet, type Team } from './topics';
import type { CategoryBricks } from './types';

// The NewsBrick service (see worker/). Without it, places and teams can't be loaded.
export const SERVICE_URL = process.env.EXPO_PUBLIC_SERVICE_URL;

type Request =
  | { id: string; topic: { kind: 'place'; name: string; facet: PlaceFacet } }
  | { id: string; topic: { kind: 'team'; league: string; team: string; name: string } };

// Loads today's stories for the places and teams you follow. The service writes each one
// the first time anyone asks that day; a copy is saved on the phone so reopening is instant.
// `ready` turns true once every topic has loaded (or failed), so the day's stories don't
// reshuffle while you read them.
export function useLocalTopics(date: string | undefined, followed: string[], places: string[], teams: Team[]) {
  const [categories, setCategories] = useState<CategoryBricks[]>([]);
  const [ready, setReady] = useState(false);

  const requests: Request[] = [
    ...places.flatMap((name) =>
      PLACE_FACETS.map(({ facet }) => ({ id: placeTopicId(name, facet), topic: { kind: 'place' as const, name, facet } })),
    ),
    ...teams.map((t) => ({ id: teamTopicId(t), topic: { kind: 'team' as const, league: t.league, team: t.id, name: t.name } })),
  ].filter((r) => followed.includes(r.id));
  const key = `${date}|${requests.map((r) => r.id).join(',')}`;

  useEffect(() => {
    if (!date || requests.length === 0) {
      setCategories([]);
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    (async () => {
      const loaded: CategoryBricks[] = [];
      const load = async (r: Request) => {
        const cacheKey = `topic:${date}:${r.id}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) return loaded.push(JSON.parse(cached) as CategoryBricks);
        if (!SERVICE_URL) return;
        try {
          const res = await fetch(`${SERVICE_URL}/topic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: r.topic }),
          });
          if (!res.ok) return;
          const topic = (await res.json()) as CategoryBricks & { date: string };
          if (topic.date !== date) return; // the service already moved on to a new day
          loaded.push(topic);
          // Empty topics aren't saved, so they're asked for again later in the day.
          if (topic.bricks.length) await AsyncStorage.setItem(cacheKey, JSON.stringify(topic));
        } catch {
          // Offline or service down: the rest of the day's stories still show.
        }
      };
      // A few at a time, and give up waiting after 30 seconds.
      const queue = [...requests];
      const workers = Array.from({ length: 3 }, async () => {
        while (queue.length) await load(queue.shift()!);
      });
      await Promise.race([Promise.all(workers), new Promise((r) => setTimeout(r, 30_000))]);
      if (!cancelled) {
        setCategories([...loaded]);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { categories, ready };
}
