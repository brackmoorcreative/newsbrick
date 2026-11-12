import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Account } from './useAccount';
import { fonts, useStyles, useTheme, type Appearance, type Palette } from './theme';

type Props = {
  visible: boolean;
  account: Account;
  streak: { count: number; best: number } | null;
  onSignOut: () => void;
  onClose: () => void;
};

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match phone' },
];

export function SettingsSheet({ visible, account, streak, onSignOut, onClose }: Props) {
  const styles = useStyles(makeStyles);
  const { appearance, setAppearance } = useTheme();
  const who =
    account.provider === 'preview'
      ? 'Preview mode (no account)'
      : `Signed in with Apple${account.name || account.email ? ` as ${account.name ?? account.email}` : ''}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Appearance</Text>
        <View style={styles.segmented}>
          {APPEARANCES.map((a) => {
            const on = a.value === appearance;
            return (
              <Pressable
                key={a.value}
                onPress={() => setAppearance(a.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.segment, on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {streak && (
          <>
            <Text style={styles.label}>Reading streak</Text>
            <Text style={styles.body}>
              {streak.count} {streak.count === 1 ? 'day' : 'days'} in a row · Best: {streak.best}
            </Text>
          </>
        )}

        <Text style={styles.label}>Account</Text>
        <Text style={styles.body}>{who}</Text>
        <Pressable onPress={onSignOut} accessibilityRole="button" style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sheet: { flex: 1, backgroundColor: c.background, paddingHorizontal: 20 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    heading: { fontFamily: fonts.headline, fontSize: 24, color: c.text },
    done: { fontFamily: fonts.label, fontSize: 17, color: c.link },
    label: { fontFamily: fonts.label, fontSize: 14, color: c.muted, marginTop: 28, marginBottom: 10 },
    segmented: {
      flexDirection: 'row',
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 6,
      overflow: 'hidden',
    },
    segment: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    segmentOn: { backgroundColor: c.text },
    segmentText: { fontFamily: fonts.label, fontSize: 15, color: c.text },
    segmentTextOn: { color: c.background },
    body: { fontFamily: fonts.body, fontSize: 18, lineHeight: 26, color: c.text },
    signOut: { marginTop: 14, paddingVertical: 8, alignSelf: 'flex-start' },
    signOutText: { fontFamily: fonts.label, fontSize: 16, color: '#C0392B' },
  });
