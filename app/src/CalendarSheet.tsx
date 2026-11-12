import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fromDateKey, toDateKey } from './dates';
import { fonts, useStyles, useTheme, type Palette } from './theme';

type Props = {
  visible: boolean;
  editions: string[]; // days that have bricks, YYYY-MM-DD
  selected: string; // the day currently shown
  onSelect: (date: string) => void;
  onClose: () => void;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// A month grid. Days with an edition are bold and tappable; the rest are grayed out.
export function CalendarSheet({ visible, editions, selected, onSelect, onClose }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const [month, setMonth] = useState(() => startOfMonth(fromDateKey(selected)));

  useEffect(() => {
    if (visible) setMonth(startOfMonth(fromDateKey(selected)));
  }, [visible, selected]);

  const available = new Set(editions);
  const today = toDateKey(new Date());
  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Leading blanks so the 1st lands on the right weekday, then each day of the month.
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(month.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateKey(new Date(month.getFullYear(), month.getMonth(), i + 1)),
    ),
  ];

  const shiftMonth = (by: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Past editions</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} accessibilityLabel="Previous month">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.month}>{title}</Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={12} accessibilityLabel="Next month">
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.cell, styles.weekday]}>
              {d}
            </Text>
          ))}
          {cells.map((key, i) => {
            if (!key) return <View key={`blank-${i}`} style={styles.cell} />;
            const has = available.has(key);
            const isSelected = key === selected;
            return (
              <Pressable
                key={key}
                disabled={!has}
                onPress={() => onSelect(key)}
                style={styles.cell}
                accessibilityLabel={`${key}${has ? '' : ', no edition'}`}
              >
                <View style={[styles.day, isSelected && styles.daySelected]}>
                  <Text
                    style={[
                      styles.dayText,
                      has ? styles.dayHas : styles.dayNone,
                      isSelected && styles.daySelectedText,
                    ]}
                  >
                    {fromDateKey(key).getDate()}
                  </Text>
                </View>
                {key === today && !isSelected && <View style={styles.todayDot} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.hint}>
          Bold days have news. A new edition is added every morning.
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
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
    monthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 12,
    },
    month: { fontFamily: fonts.label, fontSize: 18, color: c.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, height: 48, alignItems: 'center', justifyContent: 'center' },
    weekday: {
      fontFamily: fonts.labelMedium,
      fontSize: 13,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 48,
    },
    day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    daySelected: { backgroundColor: c.text },
    dayText: { fontSize: 17 },
    dayHas: { fontFamily: fonts.label, color: c.text },
    dayNone: { fontFamily: fonts.labelMedium, color: c.hairline },
    daySelectedText: { color: c.background },
    todayDot: {
      position: 'absolute',
      bottom: 3,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.accent,
    },
    hint: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
      color: c.muted,
      marginTop: 20,
      textAlign: 'center',
    },
  });
