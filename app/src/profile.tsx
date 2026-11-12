import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Answers } from './quiz';

// Your quiz answers and whether "Why it matters to you" is personalized. Saved on the phone.
type ProfileValue = {
  loaded: boolean;
  answers: Answers;
  quizStatus: 'done' | 'skipped' | null; // null = first launch, quiz not seen yet
  personalize: boolean;
  saveAnswers: (a: Answers) => void;
  skipQuiz: () => void;
  setPersonalize: (on: boolean) => void;
};

const ProfileContext = createContext<ProfileValue>({
  loaded: false,
  answers: {},
  quizStatus: null,
  personalize: true,
  saveAnswers: () => {},
  skipQuiz: () => {},
  setPersonalize: () => {},
});

const KEYS = { answers: 'profile:answers', status: 'profile:status', personalize: 'profile:personalize' };

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [quizStatus, setQuizStatus] = useState<ProfileValue['quizStatus']>(null);
  const [personalize, setPersonalizeState] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, s, p] = await Promise.all([
        AsyncStorage.getItem(KEYS.answers),
        AsyncStorage.getItem(KEYS.status),
        AsyncStorage.getItem(KEYS.personalize),
      ]);
      if (a) setAnswers(JSON.parse(a) as Answers);
      if (s === 'done' || s === 'skipped') setQuizStatus(s);
      if (p === 'off') setPersonalizeState(false);
      setLoaded(true);
    })();
  }, []);

  const value = useMemo<ProfileValue>(
    () => ({
      loaded,
      answers,
      quizStatus,
      personalize,
      saveAnswers: (a) => {
        setAnswers(a);
        setQuizStatus('done');
        AsyncStorage.setItem(KEYS.answers, JSON.stringify(a));
        AsyncStorage.setItem(KEYS.status, 'done');
      },
      skipQuiz: () => {
        setQuizStatus('skipped');
        AsyncStorage.setItem(KEYS.status, 'skipped');
      },
      setPersonalize: (on) => {
        setPersonalizeState(on);
        AsyncStorage.setItem(KEYS.personalize, on ? 'on' : 'off');
      },
    }),
    [loaded, answers, quizStatus, personalize],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileValue {
  return useContext(ProfileContext);
}
