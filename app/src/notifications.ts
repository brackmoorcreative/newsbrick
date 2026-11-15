import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SERVICE_URL } from './useLocalTopics';

// Morning notification ("Your NewsBrick is ready") through Web Push. Works in the web
// version; on iPhone only once NewsBrick is added to the Home Screen (iOS 16.4+).
// The public half of the NewsBrick service's notification key (worker/wrangler.jsonc).
const VAPID_PUBLIC_KEY = 'BECDCUq5gs2H0g3ufmZC4PNyh3Tt-TFuE657qrKdJsOK68ukM7WjgbfJGbpFSfUtjYkK_AkYkrRo_9TYjCAB98I';
const KEY = 'settings:notify';

export const NOTIFY_HOURS = [6, 7, 8, 9] as const;
export type NotifySetting = { on: boolean; hour: number };

type PushSubscriptionLike = { endpoint: string; unsubscribe: () => Promise<boolean> };
type WebPush = {
  Notification?: { permission: string; requestPermission: () => Promise<string> };
  navigator?: {
    standalone?: boolean;
    userAgent?: string;
    serviceWorker?: {
      ready: Promise<{
        pushManager: {
          getSubscription: () => Promise<PushSubscriptionLike | null>;
          subscribe: (o: { userVisibleOnly: boolean; applicationServerKey: Uint8Array }) => Promise<PushSubscriptionLike>;
        };
      }>;
    };
  };
  matchMedia?: (q: string) => { matches: boolean };
};
const web = globalThis as unknown as WebPush;

// Why notifications can't be turned on here, or null if they can.
export function notifyUnavailableReason(): string | null {
  if (!SERVICE_URL) return 'Notifications need the NewsBrick service, which isn’t connected yet.';
  if (Platform.OS !== 'web') return 'Notifications are available in the web version of NewsBrick.';
  if (!web.navigator?.serviceWorker || !web.Notification) return 'This browser doesn’t support notifications.';
  const iPhone = /iPhone|iPad/.test(web.navigator.userAgent ?? '');
  const installed = web.navigator.standalone || web.matchMedia?.('(display-mode: standalone)').matches;
  if (iPhone && !installed) return 'On iPhone, first add NewsBrick to your Home Screen (Share › Add to Home Screen), then open it from there.';
  return null;
}

export async function loadNotifySetting(): Promise<NotifySetting> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as NotifySetting) : { on: false, hour: 7 };
}

function keyBytes(base64url: string): Uint8Array {
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// Turns the notification on (asking permission the first time) or changes its hour.
// Must be called from a tap, since browsers only show the permission prompt then.
export async function enableNotify(hour: number): Promise<'ok' | 'denied' | 'failed'> {
  try {
    const permission = await web.Notification!.requestPermission();
    if (permission !== 'granted') return 'denied';
    const registration = await web.navigator!.serviceWorker!.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
    const res = await fetch(`${SERVICE_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint, hour, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });
    if (!res.ok) return 'failed';
    await AsyncStorage.setItem(KEY, JSON.stringify({ on: true, hour }));
    return 'ok';
  } catch {
    return 'failed';
  }
}

export async function disableNotify(): Promise<void> {
  try {
    const registration = await web.navigator?.serviceWorker?.ready;
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await fetch(`${SERVICE_URL}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});
      await subscription.unsubscribe();
    }
  } finally {
    const current = await loadNotifySetting();
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, on: false }));
  }
}
