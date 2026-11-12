// Per-weight imports so only these font files ship with the app.
import { LibreFranklin_500Medium } from '@expo-google-fonts/libre-franklin/500Medium';
import { LibreFranklin_700Bold } from '@expo-google-fonts/libre-franklin/700Bold';
import { PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display/900Black';
import { SourceSerif4_400Regular } from '@expo-google-fonts/source-serif-4/400Regular';
import { SourceSerif4_700Bold } from '@expo-google-fonts/source-serif-4/700Bold';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

// Newspaper type, kept simple:
//   masthead  -> Playfair Display (only the "NewsBrick" title)
//   headlines -> Source Serif 4 bold
//   body      -> Source Serif 4
//   labels    -> Libre Franklin (sources, section names, buttons)
export const fonts = {
  masthead: 'PlayfairDisplay_900Black',
  headline: 'SourceSerif4_700Bold',
  body: 'SourceSerif4_400Regular',
  label: 'LibreFranklin_700Bold',
  labelMedium: 'LibreFranklin_500Medium',
};

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    PlayfairDisplay_900Black,
    SourceSerif4_400Regular,
    SourceSerif4_700Bold,
    LibreFranklin_500Medium,
    LibreFranklin_700Bold,
  });
  return loaded;
}

const light = {
  background: '#FFFFFF',
  text: '#111111',
  body: '#333333',
  muted: '#6B6B6B',
  hairline: '#E3E3E3',
  link: '#1A5A96',
  box: '#F5F5F2',
  accent: '#C2410C', // streak flame
};

const dark: typeof light = {
  background: '#121212',
  text: '#EDEDED',
  body: '#CFCFCF',
  muted: '#9A9A9A',
  hairline: '#2E2E2E',
  link: '#8AB4F8',
  box: '#1E1E1E',
  accent: '#FB923C',
};

export type Palette = typeof light;
export type Appearance = 'light' | 'dark' | 'system';

type ThemeValue = {
  colors: Palette;
  scheme: 'light' | 'dark';
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
};

const ThemeContext = createContext<ThemeValue>({
  colors: light,
  scheme: 'light',
  appearance: 'light',
  setAppearance: () => {},
});

const STORAGE_KEY = 'settings:appearance';

// Holds the light/dark choice from Settings and remembers it on the phone.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setAppearanceState(saved);
    });
  }, []);

  const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;

  // In the browser preview, tell the phone frame so its status bar matches.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const w = globalThis as unknown as { parent?: { postMessage(m: unknown, o: string): void } };
    if (w.parent && w.parent !== (globalThis as unknown)) w.parent.postMessage({ newsbrickTheme: scheme }, '*');
  }, [scheme]);

  const value = useMemo<ThemeValue>(
    () => ({
      colors: scheme === 'dark' ? dark : light,
      scheme,
      appearance,
      setAppearance: (a) => {
        setAppearanceState(a);
        AsyncStorage.setItem(STORAGE_KEY, a);
      },
    }),
    [scheme, appearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

// Builds a component's styles from the current colors, rebuilding only when they change.
export function useStyles<T>(make: (c: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => make(colors), [colors, make]);
}
