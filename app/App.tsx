import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BrickDetail } from './src/BrickDetail';
import { BrickPage } from './src/BrickPage';
import { CalendarSheet } from './src/CalendarSheet';
import { formatDate, toDateKey } from './src/dates';
import { PrefsProvider, usePrefs } from './src/prefs';
import { SettingsSheet } from './src/SettingsSheet';
import { fonts, ThemeProvider, useAppFonts, useStyles, useTheme, type Palette } from './src/theme';
import { LEGACY_IDS, TOPIC_ORDER } from './src/topics';
import type { Brick, DailyBricks } from './src/types';
import { useAccount, type Account } from './src/useAccount';
import { useBricks, useEditionDates } from './src/useBricks';
import { useStreak } from './src/useStreak';
import { WelcomeScreen } from './src/WelcomeScreen';

// Each page in the deck is a brick, plus a final "all caught up" page.
type BrickItem = { kind: 'brick'; brick: Brick; section: string };
type Page = BrickItem | { kind: 'done' };

// The followed topics, in Settings order, each capped at `perTopic` stories.
function buildDeck(data: DailyBricks | null, topics: string[], perTopic: number): BrickItem[] {
  if (!data) return [];
  const byId = new Map(data.categories.map((c) => [LEGACY_IDS[c.id] ?? c.id, c]));
  const seen = new Set<string>(); // article links already shown
  const deck: BrickItem[] = [];
  for (const id of TOPIC_ORDER) {
    const category = byId.get(id);
    if (!topics.includes(id) || !category) continue;
    let count = 0;
    for (const brick of category.bricks) {
      if (count >= perTopic) break;
      // The same story can appear under two topics (e.g. Top stories and Politics): show it once.
      if (brick.sources.some((s) => seen.has(s.url))) continue;
      brick.sources.forEach((s) => seen.add(s.url));
      deck.push({ kind: 'brick', brick, section: category.title });
      count++;
    }
  }
  return deck;
}

// Above this many stories the per-story segments get too thin, so show one bar.
const MAX_SEGMENTS = 12;

function BrickDeck({ account, onSignOut }: { account: Account; onSignOut: () => void }) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [viewDate, setViewDate] = useState<string | null>(null); // null = today's edition
  const { data, readIds, markRead, error, refresh } = useBricks(viewDate);
  const editions = useEditionDates();
  const streak = useStreak();
  const [index, setIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0); // space between header and Back/Next bar
  const [open, setOpen] = useState<Brick | null>(null);
  const [sheet, setSheet] = useState<'calendar' | 'settings' | null>(null);
  const listRef = useRef<FlatList<Page>>(null);

  const { topics, perTopic } = usePrefs();

  const bricks = buildDeck(data, topics, perTopic);
  const pages: Page[] = bricks.length ? [...bricks, { kind: 'done' }] : [];
  const current = pages[index];
  const readCount = bricks.filter((b) => readIds.has(b.brick.id)).length;

  // Switching days or changing topics starts the deck from its first story.
  const deckKey = `${data?.date}|${topics.join(',')}|${perTopic}`;
  useEffect(() => setIndex(0), [deckKey]);

  // Seeing a brick counts as reading it.
  useEffect(() => {
    if (current?.kind === 'brick') markRead(current.brick.id);
  }, [current, markRead]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < pages.length) setIndex(i);
  };

  const goTo = (i: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, i));
    listRef.current?.scrollToIndex({ index: target, animated: true });
    setIndex(target);
  };

  const pickDate = (date: string) => {
    setSheet(null);
    // The newest edition is "today"; anything older is a past edition.
    setViewDate(date === editions[0] ? null : date);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => setSheet('calendar')} hitSlop={12} accessibilityLabel="Past editions">
            <Ionicons name="calendar-outline" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.masthead}>NewsBrick</Text>
          <Pressable onPress={() => setSheet('settings')} hitSlop={12} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          {data && <Text style={styles.date}>{formatDate(data.date)}</Text>}
          {streak && (
            <View style={styles.streak} accessibilityLabel={`${streak.count} day streak`}>
              <Ionicons name="flame" size={14} color={colors.accent} />
              <Text style={styles.streakText}>{streak.count}</Text>
            </View>
          )}
        </View>

        {viewDate && (
          <Pressable onPress={() => setViewDate(null)} accessibilityRole="button" style={styles.pastBanner}>
            <Text style={styles.pastText}>Past edition · </Text>
            <Text style={styles.pastLink}>Back to today ›</Text>
          </Pressable>
        )}

        {bricks.length > 0 && (
          <>
            {bricks.length <= MAX_SEGMENTS ? (
              <View style={styles.segments}>
                {bricks.map((b, i) => (
                  <View
                    key={b.brick.id}
                    style={[styles.segment, (readIds.has(b.brick.id) || i === index) && styles.segmentOn]}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.segments, styles.segment]}>
                <View style={[styles.segmentOn, styles.fill, { width: `${(readCount / bricks.length) * 100}%` }]} />
              </View>
            )}
            <Text style={styles.counter}>
              {current?.kind === 'done' ? 'All caught up' : `Story ${index + 1} of ${bricks.length}`}
            </Text>
          </>
        )}
      </View>

      {error && !data && <Text style={styles.message}>{error}</Text>}
      {!data && !error && <Text style={styles.message}>Loading stories…</Text>}
      {data && bricks.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.message}>
            {topics.length === 0
              ? 'You aren’t following any topics yet.'
              : 'No stories for your topics in this edition.'}
          </Text>
          <Pressable onPress={() => setSheet('settings')} accessibilityRole="button" style={styles.nextButton}>
            <Text style={styles.nextText}>Choose topics</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        key={deckKey} // fresh deck per day and per topic choice
        ref={listRef}
        data={pages}
        horizontal
        pagingEnabled
        style={styles.deck}
        onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(p) => (p.kind === 'brick' ? p.brick.id : 'done')}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) =>
          item.kind === 'brick' ? (
            <BrickPage
              brick={item.brick}
              section={item.section}
              width={width}
              height={pageHeight}
            />
          ) : (
            <View style={[styles.done, { width, height: pageHeight }]}>
              <Text style={styles.doneCheck}>✓</Text>
              <Text style={styles.doneTitle}>You're all caught up.</Text>
              <Text style={styles.doneText}>
                {viewDate
                  ? 'That was a past edition.'
                  : "That's today's news. New stories arrive tomorrow morning."}
              </Text>
              <Pressable onPress={() => (viewDate ? setViewDate(null) : refresh())} accessibilityRole="button">
                <Text style={styles.doneLink}>{viewDate ? "Go to today's edition" : 'Check for updates'}</Text>
              </Pressable>
            </View>
          )
        }
      />

      {pages.length > 0 && (
        <View style={styles.nav}>
          <Pressable onPress={() => goTo(index - 1)} disabled={index === 0} accessibilityRole="button" hitSlop={12}>
            <Text style={[styles.navText, index === 0 && styles.navDisabled]}>‹ Back</Text>
          </Pressable>
          {current?.kind === 'brick' && (
            // Always on screen, so the full story never depends on scrolling.
            <Pressable
              onPress={() => setOpen(current.brick)}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.fullButton}
            >
              <Text style={styles.fullText}>Full story</Text>
            </Pressable>
          )}
          {current?.kind === 'done' ? (
            <Pressable onPress={() => goTo(0)} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.navText}>Start over</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => goTo(index + 1)} accessibilityRole="button" hitSlop={12} style={styles.nextButton}>
              <Text style={styles.nextText}>Next ›</Text>
            </Pressable>
          )}
        </View>
      )}

      <BrickDetail brick={open} onClose={() => setOpen(null)} />
      <CalendarSheet
        visible={sheet === 'calendar'}
        editions={editions}
        selected={viewDate ?? data?.date ?? toDateKey(new Date())}
        onSelect={pickDate}
        onClose={() => setSheet(null)}
      />
      <SettingsSheet
        visible={sheet === 'settings'}
        account={account}
        streak={streak}
        onSignOut={() => {
          setSheet(null);
          onSignOut();
        }}
        onClose={() => setSheet(null)}
      />
    </SafeAreaView>
  );
}

function Root() {
  const { scheme } = useTheme();
  const { account, loading, signIn, signOut } = useAccount();
  if (loading) return null;
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {account ? <BrickDeck account={account} onSignOut={signOut} /> : <WelcomeScreen onSignedIn={signIn} />}
    </>
  );
}

export default function App() {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PrefsProvider>
          <Root />
        </PrefsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    masthead: { fontFamily: fonts.masthead, fontSize: 30, lineHeight: 36, color: c.text },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginTop: 2,
    },
    date: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted },
    streak: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: c.box,
    },
    streakText: { fontFamily: fonts.label, fontSize: 13, color: c.text },
    pastBanner: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    pastText: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted },
    pastLink: { fontFamily: fonts.label, fontSize: 14, color: c.link },
    segments: { flexDirection: 'row', gap: 4, marginTop: 14 },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.hairline },
    segmentOn: { backgroundColor: c.text },
    fill: { height: 4, borderRadius: 2 },
    empty: { alignItems: 'center', gap: 4 },
    counter: {
      fontFamily: fonts.labelMedium,
      fontSize: 13,
      color: c.muted,
      marginTop: 8,
      textAlign: 'center',
    },
    message: { fontFamily: fonts.body, fontSize: 17, color: c.muted, margin: 24 },
    deck: { flex: 1 },
    done: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    doneCheck: { fontSize: 48, color: c.text },
    doneTitle: {
      fontFamily: fonts.headline,
      fontSize: 28,
      color: c.text,
      marginTop: 12,
      textAlign: 'center',
    },
    doneText: {
      fontFamily: fonts.body,
      fontSize: 18,
      lineHeight: 27,
      color: c.body,
      marginTop: 10,
      textAlign: 'center',
    },
    doneLink: { fontFamily: fonts.label, fontSize: 15, color: c.link, marginTop: 24 },
    nav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    navText: { fontFamily: fonts.label, fontSize: 16, color: c.text },
    navDisabled: { color: c.hairline },
    fullButton: {
      borderWidth: 1.5,
      borderColor: c.text,
      paddingVertical: 10.5,
      paddingHorizontal: 18,
      borderRadius: 4,
    },
    fullText: { fontFamily: fonts.label, fontSize: 16, color: c.text },
    nextButton: {
      backgroundColor: c.text,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 4,
    },
    nextText: { fontFamily: fonts.label, fontSize: 16, color: c.background },
  });
