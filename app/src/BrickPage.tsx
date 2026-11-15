import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SourceLine } from './SourceLine';
import { StoryImage } from './StoryImage';
import type { Brick } from './types';
import { fonts, useStyles, useTheme, type Palette } from './theme';

type Props = {
  brick: Brick;
  section: string;
  width: number;
  height: number;
  personalized?: boolean;
  scoreLine?: string | null; // e.g. "Last game: Blues 3-2 Red Wings · Next: Sat vs Chicago"
  saved: boolean;
  vote: -1 | 0 | 1; // your 👍 / 👎 on this story
  onOpen: () => void; // opens the full story
  onSave: () => void;
  onShare: () => void;
  onVote: (v: -1 | 1) => void;
};

// One brick filling the screen: photo, outlets, the story at a glance, then Full story and
// quick actions. The page gets an exact height so a long story scrolls instead of being cut off.
export function BrickPage({ brick, section, width, height, personalized, scoreLine, saved, vote, onOpen, onSave, onShare, onVote }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();

  return (
    <View style={{ width, height }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StoryImage uri={brick.image} style={styles.image} />
        <Text style={styles.section}>{section}</Text>
        <View style={styles.sources}>
          <SourceLine sources={brick.sources} />
        </View>
        {scoreLine && <Text style={styles.score}>{scoreLine}</Text>}
        <Text style={styles.headline}>{brick.headline}</Text>
        {brick.update && (
          <View style={styles.update}>
            <Text style={styles.updateLabel}>Update · What’s new since yesterday</Text>
            <Text style={styles.updateText}>{brick.update}</Text>
          </View>
        )}
        <Text style={styles.summary}>{brick.summary}</Text>

        <View style={styles.box}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Why it matters to you</Text>
            {personalized && <Text style={styles.tag}>✦ Just for you</Text>}
          </View>
          <Text style={styles.boxText}>{brick.whyItMatters}</Text>
        </View>

        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          style={({ pressed }) => [styles.more, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.moreText}>Full story ›</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable onPress={onSave} accessibilityRole="button" accessibilityLabel={saved ? 'Saved' : 'Save for later'} style={styles.action} hitSlop={6}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.text} />
            <Text style={styles.actionText}>{saved ? 'Saved' : 'Save'}</Text>
          </Pressable>
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" style={styles.action} hitSlop={6}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <View style={styles.votes}>
            <Pressable onPress={() => onVote(1)} accessibilityRole="button" accessibilityLabel="More like this" accessibilityState={{ selected: vote === 1 }} hitSlop={8}>
              <Ionicons name={vote === 1 ? 'thumbs-up' : 'thumbs-up-outline'} size={20} color={vote === 1 ? colors.accent : colors.text} />
            </Pressable>
            <Pressable onPress={() => onVote(-1)} accessibilityRole="button" accessibilityLabel="Less like this" accessibilityState={{ selected: vote === -1 }} hitSlop={8}>
              <Ionicons name={vote === -1 ? 'thumbs-down' : 'thumbs-down-outline'} size={20} color={vote === -1 ? colors.accent : colors.text} />
            </Pressable>
          </View>
        </View>
        {vote !== 0 && (
          <Text style={styles.voteNote}>
            {vote === 1 ? 'Got it. You’ll see more stories like this.' : 'Got it. You’ll see fewer stories like this.'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
    image: { marginBottom: 16 },
    section: {
      fontFamily: fonts.label,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: c.muted,
    },
    sources: { marginTop: 8 },
    score: { fontFamily: fonts.label, fontSize: 14 * c.scale, color: c.text, marginTop: 10 },
    headline: {
      fontFamily: fonts.headline,
      fontSize: 27 * c.scale,
      lineHeight: 33 * c.scale,
      color: c.text,
      marginTop: 12,
    },
    update: { borderLeftWidth: 3, borderColor: c.accent, paddingLeft: 12, marginTop: 12 },
    updateLabel: { fontFamily: fonts.label, fontSize: 12, color: c.accent, marginBottom: 4 },
    updateText: { fontFamily: fonts.body, fontSize: 17 * c.scale, lineHeight: 25 * c.scale, color: c.text },
    summary: {
      fontFamily: fonts.body,
      fontSize: 19 * c.scale,
      lineHeight: 28 * c.scale,
      color: c.body,
      marginTop: 12,
    },
    box: { backgroundColor: c.box, padding: 16, marginTop: 20, borderRadius: 4 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { fontFamily: fonts.label, fontSize: 14, color: c.text },
    tag: { fontFamily: fonts.label, fontSize: 12, color: c.accent },
    boxText: { fontFamily: fonts.body, fontSize: 18 * c.scale, lineHeight: 27 * c.scale, color: c.text },
    more: {
      marginTop: 16,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 4,
      alignItems: 'center',
    },
    moreText: { fontFamily: fonts.label, fontSize: 16, color: c.text },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 16 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontFamily: fonts.label, fontSize: 14, color: c.text },
    votes: { flexDirection: 'row', gap: 18, marginLeft: 'auto' },
    voteNote: { fontFamily: fonts.labelMedium, fontSize: 13, color: c.muted, marginTop: 10 },
  });
