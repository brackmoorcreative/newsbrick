import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSection, NotifySection } from './MoreSettings';
import { PlacesSection, TeamsSection } from './PlacesTeams';
import { usePrefs } from './prefs';
import { useProfile, useSaveQuiz } from './profile';
import { profileLines, QUESTIONS } from './quiz';
import { QuizScreen } from './QuizScreen';
import { useSwitchColors, Chip, CollapsibleItem, Segmented, SettingsGroup, SettingsItem, useSettingsStyles } from './settingsUi';
import { BrickMark } from './StreakBadge';
import { STORIES_PER_DAY, TOPIC_GROUPS } from './topics';
import type { Account } from './useAccount';
import { fonts, TEXT_SIZES, useStyles, useTheme, type Appearance, type Palette, type TextSize } from './theme';

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

const GROUP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Top stories': 'newspaper-outline',
  'Politics & government': 'business-outline',
  'Economy & money': 'trending-up-outline',
  'World regions': 'globe-outline',
  Sports: 'football-outline',
};

export function SettingsSheet({ visible, account, streak, onSignOut, onClose }: Props) {
  const switchColors = useSwitchColors();
  const styles = useStyles(makeStyles);
  const ui = useSettingsStyles();
  const { appearance, setAppearance, textSize, setTextSize } = useTheme();
  const { topics, toggleTopic, perDay, setPerDay } = usePrefs();
  const profile = useProfile();
  const saveQuiz = useSaveQuiz();
  const [retaking, setRetaking] = useState(false);
  const answeredCount = profileLines(profile.answers).length;
  const who =
    account.provider === 'preview'
      ? 'Saved on this phone'
      : `Signed in with Apple${account.name || account.email ? ` as ${account.name ?? account.email}` : ''}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {retaking ? (
        <QuizScreen
          initial={profile.answers}
          onDone={(a) => {
            saveQuiz(a);
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
          {streak && (
            <View style={styles.hero}>
              <BrickMark unit={9} />
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>
                  {streak.count}-day reading streak
                </Text>
                <Text style={styles.heroHint}>
                  Best streak: {streak.best} {streak.best === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>
          )}

          <SettingsGroup
            title="Your news"
            footer="Each day you get the most important stories from everything you follow, so a quiet topic may not show up every day."
          >
            <SettingsItem icon="layers-outline" title="Stories per day">
              <Segmented
                options={STORIES_PER_DAY.map((n) => ({ value: n, label: `${n}` }))}
                value={perDay}
                onChange={setPerDay}
              />
            </SettingsItem>
            {TOPIC_GROUPS.map((group) => {
              const all = group.sections.flatMap((sec) => sec.topics);
              const count = all.filter((t) => topics.includes(t.id)).length;
              return (
                <CollapsibleItem key={group.title} icon={GROUP_ICONS[group.title] ?? 'newspaper-outline'} title={group.title} summary={count ? `${count} on` : 'Off'}>
                  {group.sections.map((section) => (
                    <View key={section.label ?? group.title} style={styles.section}>
                      {section.label && <Text style={styles.sectionLabel}>{section.label}</Text>}
                      <View style={ui.chips}>
                        {section.topics.map((t) => (
                          <Chip
                            key={t.id}
                            check
                            label={t.label}
                            on={topics.includes(t.id)}
                            onPress={() => toggleTopic(t.id)}
                            accessibilityLabel={`${group.title}: ${t.label}`}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </CollapsibleItem>
              );
            })}
            <PlacesSection />
            <TeamsSection />
          </SettingsGroup>

          <SettingsGroup title="Made for you">
            <SettingsItem
              icon="person-outline"
              title="Personal “Why it matters”"
              hint={
                answeredCount
                  ? `Written for you from ${answeredCount} of ${QUESTIONS.length} quiz answers`
                  : 'Take the quiz so each story explains what it means for your life'
              }
              right={
                <Switch
                  {...switchColors}
                  value={profile.personalize}
                  onValueChange={profile.setPersonalize}
                  accessibilityLabel="Personalize why it matters"
                />
              }
            >
              <Pressable onPress={() => setRetaking(true)} accessibilityRole="button" style={ui.button}>
                <Text style={ui.buttonText}>{answeredCount ? 'Edit my answers' : 'Take the quiz'}</Text>
              </Pressable>
            </SettingsItem>
            <NotifySection />
            <LanguageSection />
          </SettingsGroup>

          <SettingsGroup title="Reading">
            <SettingsItem icon="contrast-outline" title="Appearance">
              <Segmented options={APPEARANCES} value={appearance} onChange={setAppearance} />
            </SettingsItem>
            <SettingsItem icon="text-outline" title="Text size">
              <Segmented
                options={(Object.keys(TEXT_SIZES) as TextSize[]).map((size) => ({
                  value: size,
                  label: size === 'small' ? 'Small' : size === 'normal' ? 'Normal' : 'Large',
                }))}
                value={textSize}
                onChange={setTextSize}
                labelStyle={(size) => ({ fontSize: 14 * TEXT_SIZES[size] })}
              />
            </SettingsItem>
          </SettingsGroup>

          <SettingsGroup title="Account">
            <SettingsItem icon={account.provider === 'preview' ? 'phone-portrait-outline' : 'logo-apple'} title={who} />
            <Pressable onPress={onSignOut} accessibilityRole="button" style={styles.signOut}>
              <Text style={styles.signOutText}>
                {account.provider === 'preview' ? 'Back to welcome screen' : 'Sign out'}
              </Text>
            </Pressable>
          </SettingsGroup>
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    heading: { fontFamily: fonts.headline, fontSize: 24, color: c.text },
    done: { fontFamily: fonts.label, fontSize: 17, color: c.link },
    content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 56 },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 20,
      paddingVertical: 18,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    heroText: { flex: 1, gap: 4 },
    heroTitle: { fontFamily: fonts.headline, fontSize: 20, color: c.text },
    heroHint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    section: { gap: 8 },
    sectionLabel: {
      fontFamily: fonts.labelMedium,
      fontSize: 12,
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    signOut: { paddingVertical: 14, paddingHorizontal: 16 },
    signOutText: { fontFamily: fonts.label, fontSize: 16, color: '#C0392B' },
  });
