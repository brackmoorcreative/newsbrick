import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrefs } from './prefs';
import { useProfile } from './profile';
import { profileLines, QUESTIONS } from './quiz';
import { QuizScreen } from './QuizScreen';
import { STORIES_PER_DAY, TOPIC_GROUPS } from './topics';
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
  const { topics, toggleTopic, perDay, setPerDay } = usePrefs();
  const profile = useProfile();
  const [retaking, setRetaking] = useState(false);
  const answeredCount = profileLines(profile.answers).length;
  const who =
    account.provider === 'preview'
      ? 'No account. Your streak and settings are saved on this phone.'
      : `Signed in with Apple${account.name || account.email ? ` as ${account.name ?? account.email}` : ''}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {retaking ? (
        <QuizScreen
          initial={profile.answers}
          onDone={(a) => {
            profile.saveAnswers(a);
            setRetaking(false);
          }}
          onSkip={() => setRetaking(false)}
        />
      ) : (
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>You</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.body}>Personalize “Why it matters”</Text>
              <Text style={styles.hint}>
                {answeredCount
                  ? `Written for you from ${answeredCount} of ${QUESTIONS.length} quiz answers.`
                  : 'Take the quiz so each story explains what it means for your life.'}
              </Text>
            </View>
            <Switch
              value={profile.personalize}
              onValueChange={profile.setPersonalize}
              accessibilityLabel="Personalize why it matters"
            />
          </View>
          <Pressable onPress={() => setRetaking(true)} accessibilityRole="button" style={styles.outline}>
            <Text style={styles.outlineText}>{answeredCount ? 'Edit my answers' : 'Take the quiz'}</Text>
          </Pressable>

          <Text style={styles.label}>Your topics</Text>
          <Text style={styles.hint}>
            Each day you get the most important stories from everything you follow, so a quiet
            topic may not show up every day.
          </Text>
          {TOPIC_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.sections.map((section) => (
                <View key={section.label ?? group.title}>
                  {section.label && <Text style={styles.sectionLabel}>{section.label}</Text>}
                  <View style={styles.chips}>
                    {section.topics.map((t) => {
                      const on = topics.includes(t.id);
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => toggleTopic(t.id)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={`${group.title}: ${t.label}`}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>
                            {on ? '✓ ' : ''}
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.label}>Stories per day</Text>
          <View style={styles.segmented}>
            {STORIES_PER_DAY.map((n) => {
              const on = n === perDay;
              return (
                <Pressable
                  key={n}
                  onPress={() => setPerDay(n)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.segment, on && styles.segmentOn]}
                >
                  <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{n} stories</Text>
                </Pressable>
              );
            })}
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
            <Text style={styles.signOutText}>
              {account.provider === 'preview' ? 'Back to welcome screen' : 'Sign out'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      )}
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sheet: { flex: 1, backgroundColor: c.background },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    heading: { fontFamily: fonts.headline, fontSize: 24, color: c.text },
    done: { fontFamily: fonts.label, fontSize: 17, color: c.link },
    content: { paddingHorizontal: 20, paddingBottom: 48 },
    label: { fontFamily: fonts.label, fontSize: 14, color: c.muted, marginTop: 28, marginBottom: 10 },
    hint: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: -4 },
    group: { marginTop: 18 },
    groupTitle: { fontFamily: fonts.headline, fontSize: 19, color: c.text, marginBottom: 10 },
    sectionLabel: {
      fontFamily: fonts.labelMedium,
      fontSize: 13,
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 4,
      marginBottom: 8,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
    chip: {
      borderWidth: 1.5,
      borderColor: c.hairline,
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    chipOn: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontFamily: fonts.label, fontSize: 15, lineHeight: 20, color: c.text }, // fixed height so ✓ doesn't make chips taller
    chipTextOn: { color: c.background },
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
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    switchText: { flex: 1, gap: 6 },
    outline: {
      marginTop: 14,
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 6,
      paddingVertical: 12,
      alignItems: 'center',
    },
    outlineText: { fontFamily: fonts.label, fontSize: 16, color: c.text },
    signOut: { marginTop: 14, paddingVertical: 8, alignSelf: 'flex-start' },
    signOutText: { fontFamily: fonts.label, fontSize: 16, color: '#C0392B' },
  });
