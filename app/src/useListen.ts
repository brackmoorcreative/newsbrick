import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Brick } from './types';

// Listen mode: reads the day's stories aloud with the phone's built-in voice (free, no
// service), turning to each story's page as it's read.
export function useListen(bricks: Brick[], onStory: (index: number) => void) {
  const [listening, setListening] = useState(false);
  const active = useRef(false);
  const latest = useRef({ bricks, onStory });
  latest.current = { bricks, onStory };

  const stop = useCallback(() => {
    active.current = false;
    setListening(false);
    Speech.stop();
  }, []);

  const read = useCallback((i: number) => {
    const { bricks: list, onStory: show } = latest.current;
    if (!active.current) return;
    if (i >= list.length) {
      Speech.speak('That’s it. You’re all caught up.', { onDone: stop, onStopped: stop });
      return;
    }
    show(i);
    const b = list[i];
    const intro = i === 0 ? `Here are your ${list.length} stories. ` : '';
    Speech.speak(`${intro}Story ${i + 1}. ${b.headline}. ${b.summary} Why it matters: ${b.whyItMatters}`, {
      rate: 1,
      onDone: () => read(i + 1),
      onError: stop,
    });
  }, [stop]);

  const start = useCallback(
    (from = 0) => {
      Speech.stop();
      active.current = true;
      setListening(true);
      read(from);
    },
    [read],
  );

  // Stop talking if you leave the screen.
  useEffect(() => () => void Speech.stop(), []);

  return { listening, start, stop };
}
