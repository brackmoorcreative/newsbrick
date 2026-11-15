import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate } from './dates';
import { useSaved, type SavedStory } from './saved';
import { fonts, useStyles, type Palette } from './theme';

type Props = { visible: boolean; onOpen: (story: SavedStory) => void; onClose: () => void };

// Stories you saved for later.
export function SavedSheet({ visible, onOpen, onClose }: Props) {
  const styles = useStyles(makeStyles);
  const { saved, remove } = useSaved();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Saved</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        {saved.length === 0 ? (
          <Text style={styles.empty}>Tap Save on any story to keep it here.</Text>
        ) : (
          <FlatList
            data={saved}
            keyExtractor={(s) => s.brick.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Pressable onPress={() => onOpen(item)} accessibilityRole="button" style={styles.rowMain}>
                  <Text style={styles.meta}>
                    {item.section} · {formatDate(item.date)}
                  </Text>
                  <Text style={styles.headline}>{item.brick.headline}</Text>
                </Pressable>
                <Pressable onPress={() => remove(item.brick.id)} hitSlop={10} accessibilityLabel={`Remove ${item.brick.headline}`}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sheet: { flex: 1, backgroundColor: c.background },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
    heading: { fontFamily: fonts.headline, fontSize: 24, color: c.text },
    done: { fontFamily: fonts.label, fontSize: 17, color: c.link },
    empty: { fontFamily: fonts.body, fontSize: 17, color: c.muted, margin: 20 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    rowMain: { flex: 1, gap: 4 },
    meta: { fontFamily: fonts.labelMedium, fontSize: 12, color: c.muted, textTransform: 'uppercase' },
    headline: { fontFamily: fonts.headline, fontSize: 18 * c.scale, lineHeight: 24 * c.scale, color: c.text },
    remove: { fontFamily: fonts.label, fontSize: 13, color: c.muted, marginTop: 2 },
  });
