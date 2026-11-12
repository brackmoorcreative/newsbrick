import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from './theme';

// The story's news photo in a 16:9 frame. Hidden if there's no photo or it won't load.
export function StoryImage({ uri, style }: { uri?: string | null; style?: object }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return null;
  return (
    <View style={[styles.frame, { backgroundColor: colors.box }, style]}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 4, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
