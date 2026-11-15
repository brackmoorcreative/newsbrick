import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
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
import { fonts, useStyles, type Palette } from './theme';

const hourLabel = (h: number) => `${h} am`;

// Settings > Morning notification: "Your NewsBrick is ready" at the hour you pick.
export function NotifySection() {
  const styles = useStyles(makeStyles);
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
    <View>
      <Text style={styles.label}>Morning notification</Text>
      {unavailable ? (
        <Text style={styles.hint}>{unavailable}</Text>
      ) : (
        <>
          <View style={styles.switchRow}>
            <Text style={styles.body}>Tell me when my stories are ready</Text>
            <Switch
              value={setting.on}
              disabled={busy}
              onValueChange={(on) => (on ? turnOn(setting.hour) : turnOff())}
              accessibilityLabel="Morning notification"
            />
          </View>
          {setting.on && (
            <View style={styles.chips}>
              {NOTIFY_HOURS.map((h) => {
                const on = h === setting.hour;
                return (
                  <Pressable
                    key={h}
                    onPress={() => !on && turnOn(h)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{hourLabel(h)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {message && <Text style={styles.hint}>{message}</Text>}
        </>
      )}
    </View>
  );
}

// Settings > Language: the language stories are written in.
export function LanguageSection() {
  const styles = useStyles(makeStyles);
  const { lang, setLang } = useLanguage();
  return (
    <View>
      <Text style={styles.label}>Story language</Text>
      {!SERVICE_URL && <Text style={styles.hint}>Other languages need the NewsBrick service, which isn’t connected yet.</Text>}
      <View style={styles.chips}>
        {LANGUAGES.map((l) => {
          const on = l.code === lang;
          return (
            <Pressable
              key={l.code}
              onPress={() => setLang(l.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{l.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>Stories are translated by AI. Buttons and menus stay in English for now.</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    label: { fontFamily: fonts.label, fontSize: 14, color: c.muted, marginTop: 28, marginBottom: 10 },
    hint: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: 10 },
    body: { flex: 1, fontFamily: fonts.body, fontSize: 18, lineHeight: 26, color: c.text },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: { borderWidth: 1.5, borderColor: c.hairline, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
    chipOn: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontFamily: fonts.label, fontSize: 15, lineHeight: 20, color: c.text },
    chipTextOn: { color: c.background },
  });
