import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Brick } from './types';
import { fonts, useStyles, type Palette } from './theme';

type Props = { brick: Brick; section: string; width: number; onOpen: () => void };

// One brick filling the screen: the whole story at a glance, plus a button for more.
export function BrickPage({ brick, section, width, onOpen }: Props) {
  const styles = useStyles(makeStyles);
  // Each outlet once, even if it ran several articles on this story.
  const sourceNames = [...new Set(brick.sources.map((s) => s.name))].join(' · ');

  return (
    <View style={{ width }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>{section}</Text>
        <Text style={styles.headline}>{brick.headline}</Text>
        <Text style={styles.summary}>{brick.summary}</Text>

        <View style={styles.box}>
          <Text style={styles.label}>Why it matters to you</Text>
          <Text style={styles.boxText}>{brick.whyItMatters}</Text>
        </View>

        <Text style={styles.source}>{sourceNames}</Text>

        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          style={({ pressed }) => [styles.more, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.moreText}>Read the full picture ›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
    section: {
      fontFamily: fonts.label,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: c.muted,
    },
    headline: {
      fontFamily: fonts.headline,
      fontSize: 30,
      lineHeight: 37,
      color: c.text,
      marginTop: 10,
    },
    summary: {
      fontFamily: fonts.body,
      fontSize: 20,
      lineHeight: 30,
      color: c.body,
      marginTop: 14,
    },
    box: { backgroundColor: c.box, padding: 16, marginTop: 22, borderRadius: 4 },
    label: { fontFamily: fonts.label, fontSize: 14, color: c.text, marginBottom: 6 },
    boxText: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, color: c.text },
    source: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted, marginTop: 18 },
    more: {
      marginTop: 20,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 4,
      alignItems: 'center',
    },
    moreText: { fontFamily: fonts.label, fontSize: 16, color: c.text },
  });
