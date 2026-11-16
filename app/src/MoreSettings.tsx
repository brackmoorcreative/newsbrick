import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { LANGUAGES, useLanguage } from './language';
import {
  disableNotify,
  enableNotify,
  loadNotifySetting,
  NOTIFY_HOURS,
  notifyUnavailableReason,
  type NotifySetting,
} from './notifications';
import { SERVICE_URL } from './useLocalTopics';
import { useSwitchColors, Chip, CollapsibleItem, SettingsItem, useSettingsStyles } from './settingsUi';

const hourLabel = (h: number) => `${h} am`;

// Settings > Morning notification: "Your NewsBrick is ready" at the hour you pick.
export function NotifySection() {
  const switchColors = useSwitchColors();
  const s = useSettingsStyles();
  const [setting, setSetting] = useState<NotifySetting>({ on: false, hour: 7 });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const unavailable = notifyUnavailableReason();

  useEffect(() => {
    loadNotifySetting().then(setSetting);
  }, []);

  const turnOn = async (hour: number) => {
    setBusy(true);
    const result = await enableNotify(hour);
    setBusy(false);
    if (result === 'ok') {
      setSetting({ on: true, hour });
      setMessage(`You’ll get a notification at ${hourLabel(hour)} once your stories are ready.`);
    } else {
      setMessage(
        result === 'denied'
          ? 'Notifications are blocked. Allow them for NewsBrick in your phone’s Settings, then try again.'
          : 'Couldn’t turn on notifications. Check your connection and try again.',
      );
    }
  };

  const turnOff = async () => {
    setBusy(true);
    await disableNotify();
    setBusy(false);
    setSetting({ ...setting, on: false });
    setMessage(null);
  };

  return (
    <SettingsItem
      icon="notifications-outline"
      title="Morning notification"
      hint={unavailable ?? (setting.on ? `Every day at ${hourLabel(setting.hour)}, once your stories are ready` : 'Know when your stories are ready')}
      right={
        unavailable ? undefined : (
          <Switch
            {...switchColors}
            value={setting.on}
            disabled={busy}
            onValueChange={(on) => (on ? turnOn(setting.hour) : turnOff())}
            accessibilityLabel="Morning notification"
          />
        )
      }
    >
      {!unavailable && (setting.on || message) ? (
        <>
          {setting.on && (
            <View style={s.chips}>
              {NOTIFY_HOURS.map((h) => (
                <Chip key={h} label={hourLabel(h)} on={h === setting.hour} disabled={busy} onPress={() => h !== setting.hour && turnOn(h)} />
              ))}
            </View>
          )}
          {message && <Text style={s.hint}>{message}</Text>}
        </>
      ) : undefined}
    </SettingsItem>
  );
}

// Settings > Language: the language stories are written in.
export function LanguageSection() {
  const s = useSettingsStyles();
  const { lang, setLang } = useLanguage();
  const current = LANGUAGES.find((l) => l.code === lang)?.name ?? 'English';
  return (
    <CollapsibleItem icon="language-outline" title="Story language" summary={current}>
      {!SERVICE_URL && <Text style={s.warn}>Other languages need the NewsBrick service, which isn’t connected yet.</Text>}
      <View style={s.chips}>
        {LANGUAGES.map((l) => (
          <Chip key={l.code} label={l.name} on={l.code === lang} onPress={() => setLang(l.code)} />
        ))}
      </View>
      <Text style={s.hint}>Stories are translated by AI. Buttons and menus stay in English for now.</Text>
    </CollapsibleItem>
  );
}
