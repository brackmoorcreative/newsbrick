import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { toDateKey } from './dates';

type Streak = { count: number; best: number; lastDate: string };

const KEY = 'streak';

// Counts days in a row the app was opened. Opening twice in one day doesn't double count;
// missing a day starts the streak over at 1.
export function useStreak(): Streak | null {
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    (async () => {
      const today = toDateKey(new Date());
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = toDateKey(y);

      const raw = await AsyncStorage.getItem(KEY);
      const saved = raw ? (JSON.parse(raw) as Streak) : null;

      let count = 1;
      if (saved?.lastDate === today) count = saved.count;
      else if (saved?.lastDate === yesterday) count = saved.count + 1;

      const next = { count, best: Math.max(count, saved?.best ?? 0), lastDate: today };
      setStreak(next);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    })();
  }, []);

  return streak;
}
