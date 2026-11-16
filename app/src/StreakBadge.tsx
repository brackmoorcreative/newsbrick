import { StyleSheet, Text, View } from 'react-native';
import { fonts, useStyles, useTheme, type Palette } from './theme';

// A small stack of bricks: two on the bottom course, one laid on top.
// `unit` is the height of one brick; widths and gaps follow from it.
export function BrickMark({ unit = 5, color }: { unit?: number; color?: string }) {
  const { colors } = useTheme();
  const fill = color ?? colors.accent;
  const w = unit * 2;
  const gap = Math.max(1, Math.round(unit / 4));
  const brick = { width: w, height: unit, borderRadius: unit / 5, backgroundColor: fill };
  return (
    <View style={{ alignItems: 'center', gap }} accessible={false}>
      <View style={brick} />
      <View style={{ flexDirection: 'row', gap }}>
        <View style={brick} />
        <View style={brick} />
      </View>
    </View>
  );
}

// Header badge: the brick mark plus "12 days".
export function StreakBadge({ count }: { count: number }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.badge} accessibilityLabel={`${count} day reading streak`}>
      <BrickMark unit={4} />
      <Text style={styles.text}>
        {count} {count === 1 ? 'day' : 'days'}
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    text: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 0.3, color: c.text },
  });
