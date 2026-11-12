import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Account } from './useAccount';
import { fonts, useStyles, useTheme, type Palette } from './theme';

type Props = { onSignedIn: (account: Account) => void };

// First launch: create an account before reading.
export function WelcomeScreen({ onSignedIn }: Props) {
  const styles = useStyles(makeStyles);
  const { scheme } = useTheme();
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const signInWithApple = async () => {
    setError(null);
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
      onSignedIn({ provider: 'apple', userId: cred.user, name: name || null, email: cred.email });
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return; // user tapped Cancel
      setError('Sign in with Apple didn’t work. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.masthead}>NewsBrick</Text>
        <View style={styles.rule} />
        <Text style={styles.pitch}>Get caught up on the news in under 60 seconds a day.</Text>
        <Text style={styles.points}>
          Politics, the economy, sports, and your own city, from anywhere in the world, written in plain English.
        </Text>
      </View>

      <View style={styles.bottom}>
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={6}
            style={styles.appleButton}
            onPress={signInWithApple}
          />
        )}

        {/* Sign in with Apple only works in the native iPhone app. The home-screen web
            version starts without an account; everything is still saved on the phone. */}
        {appleAvailable === false && (
          <Pressable
            onPress={() =>
              onSignedIn({ provider: 'preview', userId: 'preview', name: null, email: null })
            }
            accessibilityRole="button"
            style={styles.previewButton}
          >
            <Text style={styles.previewText}>Get started</Text>
          </Pressable>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.fine}>Your account and reading history stay on this phone.</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background, paddingHorizontal: 28 },
    top: { flex: 1, justifyContent: 'center' },
    masthead: {
      fontFamily: fonts.masthead,
      fontSize: 48,
      lineHeight: 56,
      color: c.text,
      textAlign: 'center',
    },
    rule: { height: 2, backgroundColor: c.text, marginVertical: 20, marginHorizontal: 40 },
    pitch: {
      fontFamily: fonts.headline,
      fontSize: 24,
      lineHeight: 31,
      color: c.text,
      textAlign: 'center',
    },
    points: {
      fontFamily: fonts.body,
      fontSize: 18,
      lineHeight: 27,
      color: c.body,
      textAlign: 'center',
      marginTop: 14,
    },
    bottom: { paddingBottom: 24, gap: 14 },
    appleButton: { width: '100%', height: 52 },
    previewButton: {
      height: 52,
      borderRadius: 6,
      backgroundColor: c.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewText: { fontFamily: fonts.label, fontSize: 17, color: c.background },
    error: { fontFamily: fonts.labelMedium, fontSize: 15, color: '#C0392B', textAlign: 'center' },
    fine: { fontFamily: fonts.labelMedium, fontSize: 13, color: c.muted, textAlign: 'center' },
  });
