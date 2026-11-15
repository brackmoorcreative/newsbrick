import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, useStyles, type Palette } from './theme';

export type QuizQuestion = { storyId: string; question: string; options: string[]; answer: number; explanation: string };
export type WeeklyQuizData = { weekEnding: string; questions: QuizQuestion[] };

// .../data/latest.json -> .../data/quiz/latest.json
const QUIZ_URL = process.env.EXPO_PUBLIC_BRICKS_URL?.replace(/[^/]+$/, 'quiz/latest.json');
const resultKey = (week: string) => `quiz:result:${week}`;

// This week's quiz (refreshed daily by the morning job) and your score on it, if taken.
export function useWeeklyQuiz() {
  const [quiz, setQuiz] = useState<WeeklyQuizData | null>(null);
  const [score, setScoreState] = useState<number | null>(null);

  useEffect(() => {
    if (!QUIZ_URL) return;
    fetch(QUIZ_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (q: WeeklyQuizData | null) => {
        if (!q?.questions?.length) return;
        setQuiz(q);
        const saved = await AsyncStorage.getItem(resultKey(q.weekEnding));
        if (saved !== null) setScoreState(Number(saved));
      })
      .catch(() => {});
  }, []);

  const saveScore = (n: number) => {
    if (!quiz) return;
    setScoreState(n);
    AsyncStorage.setItem(resultKey(quiz.weekEnding), String(n));
  };
  return { quiz, score, saveScore };
}

type Props = { quiz: WeeklyQuizData | null; visible: boolean; onFinish: (score: number) => void; onClose: () => void };

// Five questions, one at a time: pick an answer, see if you're right and why, then next.
export function WeeklyQuizSheet({ quiz, visible, onFinish, onClose }: Props) {
  const styles = useStyles(makeStyles);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setPicked(null);
      setCorrect(0);
    }
  }, [visible]);

  if (!quiz) return null;
  const total = quiz.questions.length;
  const q = quiz.questions[step];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setCorrect(correct + 1);
  };
  const next = () => {
    if (step + 1 >= total) onFinish(correct);
    setStep(step + 1);
    setPicked(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>This week’s quiz</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Close</Text>
          </Pressable>
        </View>

        {q ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.counter}>
              Question {step + 1} of {total}
            </Text>
            <Text style={styles.question}>{q.question}</Text>
            <View style={styles.options}>
              {q.options.map((option, i) => {
                const show = picked !== null;
                const right = show && i === q.answer;
                const wrong = show && i === picked && i !== q.answer;
                return (
                  <Pressable
                    key={i}
                    onPress={() => choose(i)}
                    disabled={show}
                    accessibilityRole="button"
                    style={[styles.option, right && styles.right, wrong && styles.wrong]}
                  >
                    <Text style={[styles.optionText, (right || wrong) && styles.optionTextOn]}>
                      {right ? '✓ ' : wrong ? '✗ ' : ''}
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {picked !== null && (
              <>
                <Text style={styles.explanation}>
                  {picked === q.answer ? 'Right! ' : 'Not quite. '}
                  {q.explanation}
                </Text>
                <Pressable onPress={next} accessibilityRole="button" style={styles.next}>
                  <Text style={styles.nextText}>{step + 1 >= total ? 'See my score' : 'Next question ›'}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        ) : (
          <View style={styles.result}>
            <Text style={styles.big}>
              {correct} / {total}
            </Text>
            <Text style={styles.resultText}>
              {correct === total
                ? 'Perfect week. You really were paying attention.'
                : correct >= total - 2
                  ? 'Nice work. You’re well caught up.'
                  : 'Good start. Keep reading and try again next week.'}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.next}>
              <Text style={styles.nextText}>Done</Text>
            </Pressable>
          </View>
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
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    counter: { fontFamily: fonts.labelMedium, fontSize: 13, color: c.muted },
    question: { fontFamily: fonts.headline, fontSize: 24 * c.scale, lineHeight: 31 * c.scale, color: c.text, marginTop: 10 },
    options: { gap: 10, marginTop: 20 },
    option: { borderWidth: 1.5, borderColor: c.hairline, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 },
    right: { backgroundColor: '#1F7A3A', borderColor: '#1F7A3A' },
    wrong: { backgroundColor: '#B42318', borderColor: '#B42318' },
    optionText: { fontFamily: fonts.label, fontSize: 17 * c.scale, color: c.text },
    optionTextOn: { color: '#FFFFFF' },
    explanation: { fontFamily: fonts.body, fontSize: 17 * c.scale, lineHeight: 25 * c.scale, color: c.body, marginTop: 18 },
    next: { backgroundColor: c.text, borderRadius: 4, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    nextText: { fontFamily: fonts.label, fontSize: 16, color: c.background },
    result: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
    big: { fontFamily: fonts.masthead, fontSize: 64, color: c.text },
    resultText: { fontFamily: fonts.body, fontSize: 19, lineHeight: 28, color: c.body, textAlign: 'center' },
  });
