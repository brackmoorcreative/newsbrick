import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QUESTIONS, type Answers } from './quiz';
import { fonts, useStyles, useTheme, type Palette } from './theme';

type Props = {
  initial: Answers;
  onDone: (answers: Answers) => void;
  onSkip: () => void; // "Not now" on the intro screen
};

const MAX_ISSUES = 5;

// One question per screen, then a "you're set" screen. Every question can be skipped.
export function QuizScreen({ initial, onDone, onSkip }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const [step, setStep] = useState(-1); // -1 = intro, QUESTIONS.length = finished
  const [answers, setAnswers] = useState<Answers>(initial);

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const next = () => setStep(step + 1);
  const back = () => setStep(step - 1);

  if (step === -1) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.kicker}>Get to know you</Text>
          <Text style={styles.bigTitle}>Make the news about you.</Text>
          <Text style={styles.body}>
            Answer {total} quick questions and every story’s “Why it matters to you” is written
            for your life: where you live, what you do, your money, and your goals.
          </Text>
          <Text style={styles.fine}>
            About 2 minutes. Skip anything you like. Your answers stay on this phone and are only
            used to write those lines. Change them anytime in Settings.
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.secondary}>Not now</Text>
          </Pressable>
          <Pressable onPress={next} accessibilityRole="button" style={styles.primary}>
            <Text style={styles.primaryText}>Start</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!q) {
    const answered = QUESTIONS.filter((x) => {
      const v = answers[x.id];
      return Array.isArray(v) ? v.length > 0 : Boolean(v?.trim());
    }).length;
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.bigTitle}>You’re all set.</Text>
          <Text style={styles.body}>
            You answered {answered} of {total}. Starting today, “Why it matters to you” is written
            just for you.
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={back} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.secondary}>‹ Back</Text>
          </Pressable>
          <Pressable onPress={() => onDone(answers)} accessibilityRole="button" style={styles.primary}>
            <Text style={styles.primaryText}>See my news</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const value = answers[q.id];
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const pick = (option: string) => {
    if (q.kind === 'single') {
      setAnswers({ ...answers, [q.id]: option });
      setTimeout(next, 180); // single choice: move on automatically
      return;
    }
    if (selected.includes(option)) {
      setAnswers({ ...answers, [q.id]: selected.filter((o) => o !== option) });
    } else if (q.id !== 'issues' || selected.length < MAX_ISSUES) {
      setAnswers({ ...answers, [q.id]: [...selected, option] });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.progressWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((step + 1) / total) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>
          {step + 1} of {total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{q.title}</Text>
        {q.subtitle && <Text style={styles.subtitle}>{q.subtitle}</Text>}

        {q.kind === 'text' ? (
          <TextInput
            value={typeof value === 'string' ? value : ''}
            onChangeText={(t) => setAnswers({ ...answers, [q.id]: t.slice(0, 200) })}
            placeholder={q.placeholder}
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline={q.id === 'extra'}
            returnKeyType="next"
            onSubmitEditing={next}
          />
        ) : (
          <View style={styles.options}>
            {q.options?.map((option) => {
              const on = selected.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => pick(option)}
                  accessibilityRole={q.kind === 'multi' ? 'checkbox' : 'radio'}
                  accessibilityState={{ checked: on }}
                  style={[styles.option, on && styles.optionOn]}
                >
                  <Text style={[styles.optionText, on && styles.optionTextOn]}>{option}</Text>
                  {on && <Text style={styles.optionTextOn}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={back} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.secondary}>‹ Back</Text>
        </Pressable>
        <Pressable onPress={next} accessibilityRole="button" style={styles.primary}>
          <Text style={styles.primaryText}>{selected.length || (typeof value === 'string' && value.trim()) ? 'Next ›' : 'Skip ›'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
    kicker: {
      fontFamily: fonts.label,
      fontSize: 13,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.accent,
    },
    bigTitle: { fontFamily: fonts.masthead, fontSize: 38, lineHeight: 44, color: c.text },
    body: { fontFamily: fonts.body, fontSize: 19, lineHeight: 28, color: c.body },
    fine: { fontFamily: fonts.labelMedium, fontSize: 14, lineHeight: 20, color: c.muted },
    check: { fontSize: 48, color: c.text },
    progressWrap: { paddingHorizontal: 24, paddingTop: 12, gap: 8 },
    track: { height: 4, borderRadius: 2, backgroundColor: c.hairline, overflow: 'hidden' },
    fill: { height: 4, borderRadius: 2, backgroundColor: c.text },
    counter: { fontFamily: fonts.labelMedium, fontSize: 13, color: c.muted },
    content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
    title: { fontFamily: fonts.headline, fontSize: 30, lineHeight: 37, color: c.text },
    subtitle: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: c.muted, marginTop: 8 },
    options: { marginTop: 22, gap: 10 },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.hairline,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    optionOn: { backgroundColor: c.text, borderColor: c.text },
    optionText: { fontFamily: fonts.label, fontSize: 17, color: c.text },
    optionTextOn: { fontFamily: fonts.label, fontSize: 17, color: c.background },
    input: {
      marginTop: 22,
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 8,
      padding: 16,
      fontFamily: fonts.body,
      fontSize: 18,
      color: c.text,
      minHeight: 56,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    secondary: { fontFamily: fonts.label, fontSize: 16, color: c.text },
    primary: { backgroundColor: c.text, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 4 },
    primaryText: { fontFamily: fonts.label, fontSize: 16, color: c.background },
  });
