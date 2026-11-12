import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SourceLine } from './SourceLine';
import { StoryImage } from './StoryImage';
import type { Brick } from './types';
import { fonts, useStyles, type Palette } from './theme';

type Props = { brick: Brick; section: string; width: number; height: number };

// One brick filling the screen: photo, outlets, and the whole story at a glance. (The
// "Full story" button lives in the bottom bar so it's always visible.) The page gets an
// exact height so a long story scrolls instead of being cut off.
export function BrickPage({ brick, section, width, height }: Props) {
  const styles = useStyles(makeStyles);

  return (
    <View style={{ width, height }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StoryImage uri={brick.image} style={styles.image} />
        <Text style={styles.section}>{section}</Text>
        <View style={styles.sources}>
          <SourceLine sources={brick.sources} />
        </View>
        <Text style={styles.headline}>{brick.headline}</Text>
        <Text style={styles.summary}>{brick.summary}</Text>

        <View style={styles.box}>
          <Text style={styles.label}>Why it matters to you</Text>
          <Text style={styles.boxText}>{brick.whyItMatters}</Text>
        </View>
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
    headline: {
      fontFamily: fonts.headline,
      fontSize: 27,
      lineHeight: 33,
      color: c.text,
      marginTop: 12,
    },
    summary: {
      fontFamily: fonts.body,
      fontSize: 19,
      lineHeight: 28,
      color: c.body,
      marginTop: 12,
    },
    box: { backgroundColor: c.box, padding: 16, marginTop: 20, borderRadius: 4 },
    label: { fontFamily: fonts.label, fontSize: 14, color: c.text, marginBottom: 6 },
    boxText: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, color: c.text },
  });
