import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Brick } from './types';
import { fonts, useStyles, type Palette } from './theme';

type Props = { brick: Brick | null; onClose: () => void };

// The expanded brick, laid out like a short newspaper article.
export function BrickDetail({ brick, onClose }: Props) {
  const styles = useStyles(makeStyles);

  return (
    <Modal
      visible={brick !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        {brick && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.headline}>{brick.headline}</Text>
            <Text style={styles.summary}>{brick.summary}</Text>

            <View style={styles.box}>
              <Text style={[styles.label, styles.boxLabel]}>Why it matters to you</Text>
              <Text style={styles.boxText}>{brick.whyItMatters}</Text>
            </View>

            <Text style={styles.label}>The full picture</Text>
            <Text style={styles.body}>{brick.explainer}</Text>

            {brick.keyTerms.length > 0 && (
              <>
                <Text style={styles.label}>Key terms</Text>
                {brick.keyTerms.map((k) => (
                  <Text key={k.term} style={styles.body}>
                    <Text style={styles.term}>{k.term}: </Text>
                    {k.definition}
                  </Text>
                ))}
              </>
            )}

            {brick.disagreement && (
              <>
                <Text style={styles.label}>Where sources differ</Text>
                <Text style={styles.body}>{brick.disagreement}</Text>
              </>
            )}

            <Text style={styles.label}>Read the original</Text>
            {brick.sources.map((s) => (
              <Pressable
                key={s.url}
                onPress={() => Linking.openURL(s.url)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.source, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={styles.sourceName}>{s.name}</Text>
                <Text style={styles.sourceTitle}>{s.title} ↗</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sheet: { flex: 1, backgroundColor: c.background },
    topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
    done: { fontFamily: fonts.label, fontSize: 17, color: c.link },
    content: { paddingHorizontal: 20, paddingBottom: 48 },
    headline: { fontFamily: fonts.headline, fontSize: 30, lineHeight: 36, color: c.text },
    summary: {
      fontFamily: fonts.body,
      fontSize: 20,
      lineHeight: 30,
      color: c.body,
      marginTop: 12,
    },
    box: { backgroundColor: c.box, padding: 16, marginTop: 24, borderRadius: 4 },
    boxText: { fontFamily: fonts.body, fontSize: 19, lineHeight: 28, color: c.text },
    label: {
      fontFamily: fonts.label,
      fontSize: 14,
      color: c.text,
      marginTop: 28,
      marginBottom: 8,
    },
    boxLabel: { marginTop: 0 },
    body: { fontFamily: fonts.body, fontSize: 19, lineHeight: 29, color: c.body },
    term: { fontFamily: fonts.headline, color: c.text },
    source: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      paddingVertical: 12,
      gap: 4,
    },
    sourceName: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted },
    sourceTitle: { fontFamily: fonts.body, fontSize: 18, lineHeight: 25, color: c.link },
  });
