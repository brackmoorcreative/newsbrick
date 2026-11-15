import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Your 👍 / 👎 on stories. Each vote nudges that story's topic up or down when the app picks
// the day's stories (see buildDeck in App.tsx). Saved on the phone.
type FeedbackValue = {
  voteOf: (brickId: string) => -1 | 0 | 1;
  weightOf: (topicId: string) => number; // -3 (much less) to +3 (much more)
  vote: (brickId: string, topicId: string, v: -1 | 1) => void;
};

const FeedbackContext = createContext<FeedbackValue>(null as unknown as FeedbackValue);
const KEY = 'feedback';
const MAX_WEIGHT = 3;
const MAX_VOTES_KEPT = 300;

type Saved = { votes: Record<string, -1 | 1>; weights: Record<string, number> };

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>({ votes: {}, weights: {} });

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => raw && setState(JSON.parse(raw) as Saved));
  }, []);

  const value = useMemo<FeedbackValue>(
    () => ({
      voteOf: (id) => state.votes[id] ?? 0,
      weightOf: (topic) => state.weights[topic] ?? 0,
      vote: (brickId, topicId, v) => {
        const previous = state.votes[brickId] ?? 0;
        const votes = { ...state.votes };
        // Tapping the same thumb again undoes the vote.
        const next = previous === v ? 0 : v;
        if (next) votes[brickId] = next;
        else delete votes[brickId];
        const weight = Math.max(-MAX_WEIGHT, Math.min(MAX_WEIGHT, (state.weights[topicId] ?? 0) + next - previous));
        // Keep the newest votes only (weights already hold their effect).
        const kept = Object.fromEntries(Object.entries(votes).slice(-MAX_VOTES_KEPT));
        const saved = { votes: kept, weights: { ...state.weights, [topicId]: weight } };
        setState(saved);
        AsyncStorage.setItem(KEY, JSON.stringify(saved));
      },
    }),
    [state],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackValue {
  return useContext(FeedbackContext);
}
