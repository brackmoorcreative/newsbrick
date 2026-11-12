import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// The account lives on this phone only (there's no server yet), so it holds no secrets:
// just who signed in, so the app can greet you and gate first launch.
export type Account = {
  provider: 'apple' | 'preview';
  userId: string;
  name: string | null;
  email: string | null;
};

const KEY = 'account';
// Apple only shares your name and email the very first time you sign in,
// so remember them per Apple ID even after signing out.
const profileKey = (userId: string) => `account:profile:${userId}`;

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setAccount(raw ? (JSON.parse(raw) as Account) : null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (next: Account) => {
    const savedRaw = await AsyncStorage.getItem(profileKey(next.userId));
    const saved = savedRaw ? (JSON.parse(savedRaw) as Pick<Account, 'name' | 'email'>) : null;
    const merged = { ...next, name: next.name ?? saved?.name ?? null, email: next.email ?? saved?.email ?? null };
    await AsyncStorage.setItem(profileKey(next.userId), JSON.stringify({ name: merged.name, email: merged.email }));
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
    setAccount(merged);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setAccount(null);
  }, []);

  return { account, loading, signIn, signOut };
}
