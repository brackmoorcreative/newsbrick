import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useStyles, useTheme, type Palette } from './theme';

// Settings is laid out like a phone's own Settings app: small uppercase group
// headings, each over a rounded card of rows.

export function SettingsGroup({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  const s = useSettingsStyles();
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
      {footer && <Text style={s.groupFooter}>{footer}</Text>}
    </View>
  );
}

type ItemProps = {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
  children?: ReactNode;
};

// One row of a card: icon, title, optional hint and control on the right, extra content below.
export function SettingsItem({ title, hint, icon, right, children }: ItemProps) {
  const s = useSettingsStyles();
  const { colors } = useTheme();
  return (
    <View style={s.item}>
      <View style={s.itemHead}>
        {icon && <Ionicons name={icon} size={20} color={colors.muted} style={s.itemIcon} />}
        <View style={s.itemText}>
          <Text style={s.itemTitle}>{title}</Text>
          {hint && <Text style={s.itemHint}>{hint}</Text>}
        </View>
        {right}
      </View>
      {children && <View style={s.itemBody}>{children}</View>}
    </View>
  );
}

// A row that opens to show its content, e.g. one kind of topic.
export function CollapsibleItem({
  title,
  summary,
  icon,
  children,
}: {
  title: string;
  summary: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  const s = useSettingsStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={s.item}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${summary}`}
        style={s.itemHead}
      >
        {icon && <Ionicons name={icon} size={20} color={colors.muted} style={s.itemIcon} />}
        <View style={s.itemText}>
          <Text style={s.itemTitle}>{title}</Text>
        </View>
        <Text style={s.summary}>{summary}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open && <View style={s.itemBody}>{children}</View>}
    </View>
  );
}

type Option<T> = { value: T; label: string };

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  labelStyle,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  labelStyle?: (v: T) => object;
}) {
  const s = useSettingsStyles();
  return (
    <View style={s.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.segment, on && s.segmentOn]}
          >
            <Text style={[s.segmentText, on && s.segmentTextOn, labelStyle?.(o.value)]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  on,
  onPress,
  check = false,
  accessibilityLabel,
  disabled,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  check?: boolean;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const s = useSettingsStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={check ? 'checkbox' : 'button'}
      accessibilityState={check ? { checked: on } : { selected: on }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[s.chip, on && s.chipOn]}
    >
      <Text style={[s.chipText, on && s.chipTextOn]}>
        {check && on ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

// Switches in the app's own colors (the web default is teal).
export function useSwitchColors() {
  const { colors } = useTheme();
  return {
    trackColor: { false: colors.hairline, true: colors.text },
    thumbColor: colors.background,
    activeThumbColor: colors.background,
    activeTrackColor: colors.text,
  };
}

export const useSettingsStyles = () => useStyles(makeStyles);

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    group: { marginTop: 26 },
    groupTitle: {
      fontFamily: fonts.label,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.muted,
      marginBottom: 8,
      marginLeft: 4,
    },
    groupFooter: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted, marginTop: 8, marginHorizontal: 4 },
    card: { backgroundColor: c.box, borderRadius: 12, overflow: 'hidden' },
    item: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      marginBottom: -StyleSheet.hairlineWidth, // the last row's line hides under the card edge
    },
    itemHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemIcon: { width: 22 },
    itemText: { flex: 1, gap: 3 },
    itemTitle: { fontFamily: fonts.label, fontSize: 16, color: c.text },
    itemHint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    itemBody: { marginTop: 12, gap: 10 },
    summary: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    warn: { fontFamily: fonts.labelMedium, fontSize: 14, color: '#C0392B' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1.5,
      borderColor: c.hairline,
      backgroundColor: c.background,
      borderRadius: 18,
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    chipOn: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontFamily: fonts.label, fontSize: 14, lineHeight: 19, color: c.text },
    chipTextOn: { color: c.background },
    segmented: {
      flexDirection: 'row',
      backgroundColor: c.hairline,
      borderRadius: 9,
      padding: 2,
    },
    segment: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 7 },
    segmentOn: { backgroundColor: c.background, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
    segmentText: { fontFamily: fonts.labelMedium, fontSize: 14, color: c.muted },
    segmentTextOn: { fontFamily: fonts.label, color: c.text },
    button: {
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    buttonText: { fontFamily: fonts.label, fontSize: 15, color: c.text },
  });
