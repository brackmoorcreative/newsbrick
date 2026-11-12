import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
// The NewsBrick service (see worker/). When it isn't set, stories keep the
// general "Why it matters" line.
import { SERVICE_URL } from './useLocalTopics';

// Small stable hash so a change to your answers asks for fresh lines.
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// Returns personal "Why it matters to you" lines (story id -> line) for today's deck.
// Asks the service once per day per set of answers, then reuses the saved copy.
export function usePersonalized(date: string | undefined, ids: string[], profile: string[], enabled: boolean) {
  const [lines, setLines] = useState<Record<string, string>>({});
  const idKey = ids.join(',');
  const profileKey = profile.join('\n');

  useEffect(() => {
    if (!SERVICE_URL || !enabled || !date || ids.length === 0 || profile.length === 0) {
      setLines({});
      return;
    }
    let cancelled = false;
    const cacheKey = `personal:${date}:${hash(profileKey)}`;
    (async () => {
      const saved = JSON.parse((await AsyncStorage.getItem(cacheKey)) ?? '{}') as Record<string, string>;
      if (!cancelled) setLines(saved);
      const missing = ids.filter((id) => !saved[id]);
      if (missing.length === 0) return;
      try {
        const res = await fetch(`${SERVICE_URL}/personalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ids: missing.slice(0, 10), profile }),
        });
        if (!res.ok) return; // keep the general lines
        const { items } = (await res.json()) as { items: { id: string; whyItMatters: string }[] };
        const merged = { ...saved, ...Object.fromEntries(items.map((i) => [i.id, i.whyItMatters])) };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(merged));
        if (!cancelled) setLines(merged);
      } catch {
        // Offline or service down: the general lines still show.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, idKey, profileKey, enabled]);

  return lines;
}
