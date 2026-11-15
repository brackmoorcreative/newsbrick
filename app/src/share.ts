import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import type { Brick } from './types';

const APP_URL = 'https://brackmoorcreative.github.io/newsbrick/';

type Navigator = { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
type WebLocation = { origin: string; pathname: string; search: string };
type WebHistory = { replaceState: (data: unknown, unused: string, url: string) => void };
const web = globalThis as unknown as { navigator?: Navigator; location?: WebLocation; history?: WebHistory };

// A link that opens NewsBrick on this story.
export function storyUrl(id: string, date: string): string {
  const base = Platform.OS === 'web' && web.location ? `${web.location.origin}${web.location.pathname}` : APP_URL;
  return `${base}?story=${encodeURIComponent(id)}&date=${date}`;
}

// Shares a story with the phone's share sheet; on a computer, copies the link instead.
export async function shareStory(brick: Brick, date: string): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = storyUrl(brick.id, date);
  const text = `${brick.headline}\n\n${brick.summary}`;
  try {
    if (Platform.OS !== 'web') {
      await Share.share({ message: `${text}\n\n${url}`, url, title: brick.headline });
      return 'shared';
    }
    if (web.navigator?.share) {
      await web.navigator.share({ title: brick.headline, text, url });
      return 'shared';
    }
    await Clipboard.setStringAsync(`${brick.headline}\n${url}`);
    return 'copied';
  } catch {
    return 'cancelled'; // closed the share sheet
  }
}

// A story someone shared with you (?story=...&date=... in the link that opened the app).
export function sharedStoryFromLink(): { id: string; date: string } | null {
  if (Platform.OS !== 'web' || !web.location) return null;
  const params = new URLSearchParams(web.location.search);
  const id = params.get('story');
  const date = params.get('date');
  return id && date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { id, date } : null;
}

// Once the shared story is open, drop it from the address so a reload doesn't reopen it.
export function clearSharedLink() {
  if (Platform.OS === 'web' && web.history && web.location) web.history.replaceState(null, '', web.location.pathname);
}
