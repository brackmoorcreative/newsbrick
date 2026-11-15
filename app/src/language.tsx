import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// The language stories are written in. Translations come from the NewsBrick service and
// are shared by everyone reading in that language. (Buttons and menus stay in English.)
// Must match LANGUAGES in worker/src/index.ts.
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'tr', name: 'Türkçe' },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LanguageContext = createContext<{ lang: LanguageCode; setLang: (l: LanguageCode) => void }>({
  lang: 'en',
  setLang: () => {},
});
const KEY = 'settings:language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>('en');
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => {
      if (saved && LANGUAGES.some((l) => l.code === saved)) setLangState(saved as LanguageCode);
    });
  }, []);
  const value = useMemo(
    () => ({
      lang,
      setLang: (l: LanguageCode) => {
        setLangState(l);
        AsyncStorage.setItem(KEY, l);
      },
    }),
    [lang],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
