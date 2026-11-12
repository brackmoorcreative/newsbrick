import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Brick } from './types';
import { fonts, useStyles, type Palette } from './theme';

// A news outlet's logo, from its website's icon (fetched via Google's public favicon service).
export function logoUrl(articleUrl: string): string | null {
  try {
    const host = new URL(articleUrl).hostname.replace(/^www\./, '');
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

export function SourceLogo({ url, size = 18 }: { url: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const uri = logoUrl(url);
  if (!uri || failed) return null;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: 3 }}
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

// "[logo] NPR  [logo] PBS NewsHour": each outlet once, even if it ran several articles.
export function SourceLine({ sources }: { sources: Brick['sources'] }) {
  const styles = useStyles(makeStyles);
  const outlets = [...new Map(sources.map((s) => [s.name, s])).values()];
  return (
    <View style={styles.row}>
      {outlets.map((s) => (
        <View key={s.name} style={styles.outlet}>
          <SourceLogo url={s.site ?? s.url} />
          <Text style={styles.name}>{s.name}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    outlet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted },
  });
