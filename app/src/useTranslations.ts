import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { LanguageCode } from './language';
import type { Brick } from './types';
import { SERVICE_URL } from './useLocalTopics';

export type Translation = Partial<Pick<Brick, 'headline' | 'summary' | 'whyItMatters' | 'explainer' | 'disagreement' | 'update' | 'keyTerms'>>;

// Today's stories in your language (story id -> translated text). Asked for once per day
// and saved on the phone; English needs nothing.
export function useTranslations(date: string | undefined, ids: string[], lang: LanguageCode) {
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const idKey = ids.join(',');

  useEffect(() => {
    if (lang === 'en' || !SERVICE_URL || !date || ids.length === 0) {
      setTranslations({});
      return;
    }
    let cancelled = false;
    const cacheKey = `translations:${lang}:${date}`;
    (async () => {
      const saved = JSON.parse((await AsyncStorage.getItem(cacheKey)) ?? '{}') as Record<string, Translation>;
      if (!cancelled) setTranslations(saved);
      const missing = ids.filter((id) => !saved[id]);
      if (missing.length === 0) return;
      try {
        const res = await fetch(`${SERVICE_URL}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ids: missing.slice(0, 10), lang }),
        });
        if (!res.ok) return;
        const { items } = (await res.json()) as { items: ({ id: string } & Translation)[] };
        const merged = { ...saved, ...Object.fromEntries(items.map(({ id, ...t }) => [id, t])) };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(merged));
        if (!cancelled) setTranslations(merged);
      } catch {
        // Offline or service down: stories stay in English.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, idKey, lang]);

  return translations;
}
