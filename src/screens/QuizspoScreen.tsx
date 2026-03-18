import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { addTickets, getTicketsTotal } from '../storage/ticketsStorage';
import { addCorrectAnswer } from '../storage/quizStatsStorage';
import {
  CATEGORIES,
  buildRoundQuestions,
  type QuizCategory,
  type QuizCategoryId,
  type QuizQuestion,
} from '../data/quizData';

const backgroundImage = require('../assets/bg.png');
const kangarooImage = require('../assets/kangaroo_glasses.png');
const bronzeRewardImage = require('../assets/kangaroo_bronze.png');
const silverRewardImage = require('../assets/kangaroo_silver.png');
const goldRewardImage = require('../assets/kangaroo_gold.png');

const unlockedCategoriesStorageKey = 'quiz_unlocked_categories_v1';
const categoryLevelsStorageKey = 'quiz_levels_v1';
const levelsPerCategory = 5;
const questionsPerRound = 5;

type ScreenMode = 'home' | 'question' | 'result';
type SelectedAnswer = 'A' | 'B' | null;

function normalizeLevel(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(levelsPerCategory, Math.floor(numberValue)));
}

async function readStoredArray(key: string): Promise<string[]> {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch {
    return [];
  }
}

async function writeStoredArray(key: string, value: string[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

async function readStoredLevels(): Promise<Record<string, number>> {
  try {
    const rawValue = await AsyncStorage.getItem(categoryLevelsStorageKey);
    if (!rawValue) return {};
    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') return {};

    const result: Record<string, number> = {};
    Object.keys(parsedValue).forEach((key) => {
      result[key] = normalizeLevel((parsedValue as Record<string, unknown>)[key]);
    });
    return result;
  } catch {
    return {};
  }
}

async function writeStoredLevels(value: Record<string, number>) {
  try {
    await AsyncStorage.setItem(categoryLevelsStorageKey, JSON.stringify(value));
  } catch {}
}

function StatusMark({ isCorrect }: { isCorrect: boolean }) {
  const scaleAnimation = useRef(new Animated.Value(0.76)).current;

  useEffect(() => {
    scaleAnimation.setValue(0.76);
    Animated.spring(scaleAnimation, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [isCorrect, scaleAnimation]);

  return (
    <Animated.Text style={[styles.statusMark, { transform: [{ scale: scaleAnimation }] }]}>
      {isCorrect ? '✅' : '❌'}
    </Animated.Text>
  );
}

function LevelProgressDots({
  total,
  completed,
  size,
  gap,
}: {
  total: number;
  completed: number;
  size: number;
  gap: number;
}) {
  const dots = useMemo(() => Array.from({ length: total }, (_, index) => index), [total]);

  return (
    <View style={[styles.levelDotsRow, { columnGap: gap }]}>
      {dots.map((index) => (
        <View
          key={index}
          style={[
            styles.levelDot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            index < completed ? styles.levelDotActive : styles.levelDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function CategoryCard({
  category,
  width,
  height,
  iconSize,
  completedLevels,
  dotSize,
  dotGap,
  counterWidth,
  index,
  onPress,
}: {
  category: QuizCategory;
  width: number;
  height: number;
  iconSize: number;
  completedLevels: number;
  dotSize: number;
  dotGap: number;
  counterWidth: number;
  index: number;
  onPress: () => void;
}) {
  const appearOpacity = useRef(new Animated.Value(0)).current;
  const appearTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(appearOpacity, {
        toValue: 1,
        duration: 240,
        delay: Math.min(index, 8) * 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(appearTranslate, {
        toValue: 0,
        duration: 280,
        delay: Math.min(index, 8) * 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [appearOpacity, appearTranslate, index]);

  return (
    <Animated.View
      style={{
        opacity: appearOpacity,
        transform: [{ translateY: appearTranslate }],
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={category.isLocked}
        style={({ pressed }) => [
          styles.categoryCard,
          {
            width,
            height,
          },
          category.isLocked && styles.categoryCardLocked,
          pressed && !category.isLocked && { transform: [{ scale: 0.985 }] },
        ]}
      >
        <View style={styles.categoryCardInner}>
          <View style={styles.categoryCardHeader}>
            <Image
              source={category.illustration}
              resizeMode="contain"
              style={{ width: iconSize, height: iconSize }}
            />

            {category.isLocked ? (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Locked</Text>
              </View>
            ) : (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Open</Text>
              </View>
            )}
          </View>

          <Text style={styles.categoryCardTitle} numberOfLines={1}>
            {category.title}
          </Text>

          <View style={{ flex: 1 }} />

          <View style={styles.categoryCardFooter}>
            <View style={styles.categoryDotsWrap}>
              <LevelProgressDots
                total={levelsPerCategory}
                completed={completedLevels}
                size={dotSize}
                gap={dotGap}
              />
            </View>

            <Text style={[styles.categoryCounterText, { width: counterWidth }]}>
              {completedLevels}/{levelsPerCategory}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AnswerCard({
  text,
  state,
  disabled,
  fontSize,
  verticalPadding,
  onPress,
}: {
  text: string;
  state: 'idle' | 'selected' | 'correct' | 'wrong';
  disabled: boolean;
  fontSize: number;
  verticalPadding: number;
  onPress: () => void;
}) {
  const backgroundColor =
    state === 'correct'
      ? 'rgba(0, 200, 120, 0.28)'
      : state === 'wrong'
      ? 'rgba(255, 70, 95, 0.25)'
      : state === 'selected'
      ? 'rgba(243,154,46,0.22)'
      : 'rgba(255,255,255,0.08)';

  const borderColor =
    state === 'correct'
      ? 'rgba(0, 200, 120, 0.58)'
      : state === 'wrong'
      ? 'rgba(255, 70, 95, 0.56)'
      : state === 'selected'
      ? 'rgba(243,154,46,0.55)'
      : 'rgba(255,255,255,0.13)';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.answerCard,
        {
          paddingVertical: verticalPadding,
          backgroundColor,
          borderColor,
        },
        pressed && !disabled && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text style={[styles.answerCardText, { fontSize }]} numberOfLines={2}>
        {text}
      </Text>
    </Pressable>
  );
}

export default function QuizScreen() {
  const { width, height } = useWindowDimensions();

  const isVerySmall = width <= 350 || height <= 700;
  const isSmall = width <= 390 || height <= 780;

  const [screenMode, setScreenMode] = useState<ScreenMode>('home');
  const [ticketsTotal, setTicketsTotal] = useState(0);

  const [storedUnlockedCategories, setStoredUnlockedCategories] = useState<QuizCategoryId[]>([]);
  const [storedCategoryLevels, setStoredCategoryLevels] = useState<Record<string, number>>({});

  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState<SelectedAnswer>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [earnedTicketsCount, setEarnedTicketsCount] = useState(0);

  const homeOpacity = useRef(new Animated.Value(1)).current;
  const homeTranslate = useRef(new Animated.Value(0)).current;

  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionTranslate = useRef(new Animated.Value(0)).current;

  const resultOpacity = useRef(new Animated.Value(1)).current;
  const resultTranslate = useRef(new Animated.Value(0)).current;

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastScale = useRef(new Animated.Value(0.96)).current;
  const toastTimerReference = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const layout = useMemo(() => {
    const sidePadding = isVerySmall ? 10 : isSmall ? 12 : 14;
    const gap = isVerySmall ? 10 : 12;
    const cardPadding = isVerySmall ? 12 : isSmall ? 14 : 16;
    const heroHeight = isVerySmall ? 104 : isSmall ? 124 : 165;
    const buttonHeight = isVerySmall ? 40 : isSmall ? 46 : 52;
    const mascotSize = isVerySmall ? 112 : isSmall ? 140 : 168;
    const resultImageWidth = isVerySmall ? 168 : isSmall ? 206 : 264;
    const resultImageHeight = isVerySmall ? 212 : isSmall ? 248 : 306;
    const titleFont = isVerySmall ? 18 : isSmall ? 20 : 22;
    const sectionFont = isVerySmall ? 14 : isSmall ? 15 : 16;
    const questionFont = isVerySmall ? 14 : isSmall ? 15 : 16;
    const answerFont = isVerySmall ? 13 : isSmall ? 14 : 15;
    const factFont = isVerySmall ? 12 : isSmall ? 13 : 14;
    const toastFont = isVerySmall ? 12 : isSmall ? 13 : 14;
    const categoryHeight = isVerySmall ? 104 : isSmall ? 122 : 132;
    const categoryIcon = isVerySmall ? 44 : 54;
    const levelDotSize = isVerySmall ? 6 : 7;
    const levelDotGap = isVerySmall ? 5 : 6;
    const levelCounterWidth = isVerySmall ? 34 : 40;
    const answerPaddingVertical = isVerySmall ? 10 : isSmall ? 12 : 14;
    const categoryWidth = Math.floor((width - sidePadding * 2 - gap) / 2);

    return {
      sidePadding,
      gap,
      cardPadding,
      heroHeight,
      buttonHeight,
      mascotSize,
      resultImageWidth,
      resultImageHeight,
      titleFont,
      sectionFont,
      questionFont,
      answerFont,
      factFont,
      toastFont,
      categoryHeight,
      categoryIcon,
      levelDotSize,
      levelDotGap,
      levelCounterWidth,
      answerPaddingVertical,
      categoryWidth,
      catalogBottomPadding: isVerySmall ? 92 : 120,
      roundBottomPadding: isVerySmall ? 16 : 22,
    };
  }, [isSmall, isVerySmall, width]);

  const playHomeAnimation = useCallback(() => {
    homeOpacity.setValue(0);
    homeTranslate.setValue(12);

    Animated.parallel([
      Animated.timing(homeOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(homeTranslate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [homeOpacity, homeTranslate]);

  const playQuestionAnimation = useCallback(() => {
    questionOpacity.setValue(0);
    questionTranslate.setValue(12);

    Animated.parallel([
      Animated.timing(questionOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(questionTranslate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionOpacity, questionTranslate]);

  const playResultAnimation = useCallback(() => {
    resultOpacity.setValue(0);
    resultTranslate.setValue(12);

    Animated.parallel([
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(resultTranslate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [resultOpacity, resultTranslate]);

  const hideToast = useCallback(() => {
    if (toastTimerReference.current) {
      clearTimeout(toastTimerReference.current);
      toastTimerReference.current = null;
    }

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(toastScale, {
        toValue: 0.96,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [toastOpacity, toastScale]);

  const showToast = useCallback(() => {
    if (toastTimerReference.current) {
      clearTimeout(toastTimerReference.current);
      toastTimerReference.current = null;
    }

    toastOpacity.setValue(0);
    toastScale.setValue(0.96);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(toastScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    toastTimerReference.current = setTimeout(() => {
      hideToast();
    }, 2000);
  }, [hideToast, toastOpacity, toastScale]);

  useEffect(() => {
    return () => {
      if (toastTimerReference.current) {
        clearTimeout(toastTimerReference.current);
      }
    };
  }, []);

  const resetRoundState = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerConfirmed(false);
    setLastAnswerCorrect(null);
    setCorrectAnswersCount(0);
    setEarnedTicketsCount(0);
    hideToast();
  }, [hideToast]);

  const goToHome = useCallback(() => {
    setScreenMode('home');
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentLevel(1);
    resetRoundState();
    requestAnimationFrame(playHomeAnimation);
  }, [playHomeAnimation, resetRoundState]);

  const loadScreenData = useCallback(async () => {
    const [tickets, unlockedCategories, categoryLevels] = await Promise.all([
      getTicketsTotal().catch(() => 0),
      readStoredArray(unlockedCategoriesStorageKey),
      readStoredLevels(),
    ]);

    setTicketsTotal(tickets);
    setStoredUnlockedCategories(unlockedCategories.filter(Boolean) as QuizCategoryId[]);
    setStoredCategoryLevels(categoryLevels);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScreenData();
      goToHome();
      return () => {};
    }, [goToHome, loadScreenData])
  );

  const ticketBasedUnlocks = useMemo(() => {
    return {
      football: true,
      basketball: true,
      tennis: ticketsTotal >= 10,
      volleyball: ticketsTotal >= 20,
      boxing: ticketsTotal >= 30,
      random: ticketsTotal >= 40,
    } as Record<QuizCategoryId, boolean>;
  }, [ticketsTotal]);

  const fullUnlockMap = useMemo(() => {
    const manuallyUnlocked = new Set<QuizCategoryId>(storedUnlockedCategories);

    const result: Record<QuizCategoryId, boolean> = {
      football: true,
      basketball: true,
      tennis: false,
      volleyball: false,
      boxing: false,
      random: false,
    };

    (Object.keys(result) as QuizCategoryId[]).forEach((id) => {
      result[id] = !!ticketBasedUnlocks[id] || manuallyUnlocked.has(id);
    });

    return result;
  }, [storedUnlockedCategories, ticketBasedUnlocks]);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.map((category) => ({
      ...category,
      isLocked: !fullUnlockMap[category.id],
    }));
  }, [fullUnlockMap]);

  const persistUnlockedCategory = useCallback(async (categoryId: QuizCategoryId) => {
    setStoredUnlockedCategories((previous) => {
      if (previous.includes(categoryId)) return previous;
      const next = [...previous, categoryId];
      writeStoredArray(unlockedCategoriesStorageKey, next);
      return next;
    });
  }, []);

  const startCategory = useCallback(
    async (category: QuizCategory) => {
      if (category.isLocked) return;

      await persistUnlockedCategory(category.id);

      const completedLevels = normalizeLevel(storedCategoryLevels[category.id] ?? 0);
      const nextLevel = Math.min(levelsPerCategory, completedLevels + 1);

      setCurrentLevel(nextLevel);
      setSelectedCategory({ ...category, isLocked: false });
      setQuestions(buildRoundQuestions(category.id, questionsPerRound));
      resetRoundState();
      setScreenMode('question');
      requestAnimationFrame(playQuestionAnimation);
    },
    [persistUnlockedCategory, playQuestionAnimation, resetRoundState, storedCategoryLevels]
  );

  const confirmSelectedAnswer = useCallback(() => {
    if (!currentQuestion) return;
    if (!selectedAnswer || isAnswerConfirmed) return;

    setIsAnswerConfirmed(true);

    const isCorrect = selectedAnswer === currentQuestion.correct;
    setLastAnswerCorrect(isCorrect);

    if (isCorrect) {
      setCorrectAnswersCount((previous) => previous + 1);
      setEarnedTicketsCount((previous) => previous + 2);
      addTickets(2).then(setTicketsTotal).catch(() => {});
      if (selectedCategory?.id) {
        addCorrectAnswer(selectedCategory.id, 1).catch(() => {});
      }
      showToast();
    } else {
      Vibration.vibrate(110);
    }
  }, [currentQuestion, isAnswerConfirmed, selectedAnswer, selectedCategory?.id, showToast]);

  const saveLevelProgressIfNeeded = useCallback(async () => {
    if (!selectedCategory?.id) return;

    const categoryId = selectedCategory.id;
    const completedLevels = normalizeLevel(storedCategoryLevels[categoryId] ?? 0);

    if (currentLevel <= completedLevels) return;

    const nextCompletedLevels = Math.max(
      completedLevels,
      Math.min(levelsPerCategory, currentLevel)
    );

    const nextLevelsMap = {
      ...storedCategoryLevels,
      [categoryId]: nextCompletedLevels,
    };

    setStoredCategoryLevels(nextLevelsMap);
    await writeStoredLevels(nextLevelsMap);
  }, [currentLevel, selectedCategory?.id, storedCategoryLevels]);

  useEffect(() => {
    if (screenMode === 'result') {
      saveLevelProgressIfNeeded().catch(() => {});
    }
  }, [saveLevelProgressIfNeeded, screenMode]);

  const goToNextQuestion = useCallback(() => {
    hideToast();

    if (currentQuestionIndex >= questions.length - 1) {
      setScreenMode('result');
      requestAnimationFrame(playResultAnimation);
      return;
    }

    setCurrentQuestionIndex((previous) => previous + 1);
    setSelectedAnswer(null);
    setIsAnswerConfirmed(false);
    setLastAnswerCorrect(null);
    requestAnimationFrame(playQuestionAnimation);
  }, [
    currentQuestionIndex,
    hideToast,
    playQuestionAnimation,
    playResultAnimation,
    questions.length,
  ]);

  const playAgain = useCallback(() => {
    hideToast();

    if (!selectedCategory) {
      goToHome();
      return;
    }

    startCategory({ ...selectedCategory, isLocked: false });
  }, [goToHome, hideToast, selectedCategory, startCategory]);

  const openNextLevel = useCallback(() => {
    hideToast();

    if (!selectedCategory) {
      goToHome();
      return;
    }

    const completedLevels = normalizeLevel(storedCategoryLevels[selectedCategory.id] ?? 0);
    const nextLevel = Math.min(levelsPerCategory, completedLevels + 1);

    setCurrentLevel(nextLevel);
    setQuestions(buildRoundQuestions(selectedCategory.id, questionsPerRound));
    resetRoundState();
    setScreenMode('question');
    requestAnimationFrame(playQuestionAnimation);
  }, [
    goToHome,
    hideToast,
    playQuestionAnimation,
    resetRoundState,
    selectedCategory,
    storedCategoryLevels,
  ]);

  const resultData = useMemo(() => {
    const text = 'Great job! Every comparison helps you understand sports stats better.';
    if (earnedTicketsCount <= 4) return { image: bronzeRewardImage, text };
    if (earnedTicketsCount <= 8) return { image: silverRewardImage, text };
    return { image: goldRewardImage, text };
  }, [earnedTicketsCount]);

  if (screenMode === 'home') {
    return (
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Animated.View
            style={{
              flex: 1,
              opacity: homeOpacity,
              transform: [{ translateY: homeTranslate }],
            }}
          >
            <View style={[styles.homeHeader, { paddingHorizontal: layout.sidePadding }]}>
              <Text style={[styles.homeTitle, { fontSize: layout.titleFont }]}>Quiz</Text>

              <View style={styles.ticketsCapsule}>
                <Text style={[styles.ticketsCapsuleText, { fontSize: isVerySmall ? 12 : 14 }]}>
                  Tickets: {ticketsTotal}
                </Text>
              </View>
            </View>

            <Image
              source={kangarooImage}
              resizeMode="contain"
              style={{
                width: layout.mascotSize,
                height: layout.mascotSize,
                alignSelf: 'center',
                marginTop: 8,
                marginBottom: 6,
              }}
            />

            <Text
              style={[
                styles.sectionTitle,
                { fontSize: layout.sectionFont, paddingHorizontal: layout.sidePadding },
              ]}
            >
              Categories
            </Text>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: layout.catalogBottomPadding }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.categoriesGrid,
                  {
                    paddingHorizontal: layout.sidePadding,
                    columnGap: layout.gap,
                    rowGap: layout.gap,
                  },
                ]}
              >
                {visibleCategories.map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    index={index}
                    width={layout.categoryWidth}
                    height={layout.categoryHeight}
                    iconSize={layout.categoryIcon}
                    completedLevels={normalizeLevel(storedCategoryLevels[category.id] ?? 0)}
                    dotSize={layout.levelDotSize}
                    dotGap={layout.levelDotGap}
                    counterWidth={layout.levelCounterWidth}
                    onPress={() => startCategory(category)}
                  />
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (screenMode === 'result') {
    const categoryId = selectedCategory?.id ?? '';
    const completedLevels = normalizeLevel(storedCategoryLevels[categoryId] ?? 0);
    const canOpenNextLevel = !!selectedCategory && completedLevels < levelsPerCategory;

    return (
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={[styles.topBar, { paddingHorizontal: layout.sidePadding }]}>
            <Text style={[styles.topBarTitle, { fontSize: isVerySmall ? 16 : isSmall ? 18 : 20 }]}>
              Correct Answers: {correctAnswersCount}
            </Text>

            <View style={styles.ticketsCapsule}>
              <Text style={[styles.ticketsCapsuleText, { fontSize: isVerySmall ? 12 : 14 }]}>
                Tickets: {ticketsTotal}
              </Text>
            </View>
          </View>

          <Animated.View
            style={{
              flex: 1,
              opacity: resultOpacity,
              transform: [{ translateY: resultTranslate }],
            }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.resultInfoCard,
                  {
                    marginHorizontal: layout.sidePadding,
                    paddingVertical: isVerySmall ? 12 : isSmall ? 14 : 18,
                    paddingHorizontal: isVerySmall ? 12 : isSmall ? 14 : 16,
                  },
                ]}
              >
                <Text style={[styles.resultInfoTitle, { fontSize: isVerySmall ? 15 : isSmall ? 16 : 18 }]}>
                  {resultData.text}
                </Text>

                <Text style={[styles.resultInfoSubtitle, { fontSize: isVerySmall ? 13 : 14 }]}>
                  You got {earnedTicketsCount} tickets this round.
                </Text>

                {selectedCategory ? (
                  <View style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={styles.resultLevelText}>
                      Level {Math.min(levelsPerCategory, completedLevels)} / {levelsPerCategory}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Image
                source={resultData.image}
                resizeMode="contain"
                style={{
                  width: layout.resultImageWidth,
                  height: layout.resultImageHeight,
                  alignSelf: 'center',
                  marginTop: 12,
                }}
              />

              <View style={{ paddingHorizontal: layout.sidePadding, marginTop: 14 }}>
                {canOpenNextLevel ? (
                  <Pressable
                    onPress={openNextLevel}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { height: layout.buttonHeight },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Next Level</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={playAgain}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { height: layout.buttonHeight },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Play Again</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={goToHome}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { height: layout.buttonHeight },
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Quiz Categories</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { paddingHorizontal: layout.sidePadding }]}>
          <Pressable
            onPress={goToHome}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.backButtonText}>{'‹'}</Text>
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.topBarTitle, { fontSize: isVerySmall ? 15 : isSmall ? 16 : 18 }]}>
              Tickets: {ticketsTotal}
            </Text>

            {selectedCategory ? (
              <Text style={styles.topBarSubtitle}>
                Level {currentLevel} / {levelsPerCategory}
              </Text>
            ) : null}
          </View>

          <View style={styles.scoreCapsule}>
            <Text style={styles.scoreCapsuleText}>+{earnedTicketsCount}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: layout.sidePadding, marginTop: 8 }}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.toastBubble,
              {
                opacity: toastOpacity,
                transform: [{ scale: toastScale }],
              },
            ]}
          >
            <Text style={[styles.toastBubbleText, { fontSize: layout.toastFont }]}>
              +2 tickets for correct answer
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: questionOpacity,
            transform: [{ translateY: questionTranslate }],
          }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: layout.roundBottomPadding }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.questionCard,
                {
                  marginHorizontal: layout.sidePadding,
                  marginTop: 14,
                  padding: layout.cardPadding,
                },
              ]}
            >
              {selectedCategory?.illustration ? (
                <Image
                  source={selectedCategory.illustration}
                  resizeMode="contain"
                  style={{
                    width: '100%',
                    height: layout.heroHeight,
                    marginBottom: 10,
                  }}
                />
              ) : null}

              <Text style={[styles.questionTitle, { fontSize: layout.questionFont }]}>
                {currentQuestion?.prompt}
              </Text>

              <View style={{ height: 10 }} />

              <AnswerCard
                text={currentQuestion?.a ?? ''}
                onPress={() => setSelectedAnswer('A')}
                disabled={isAnswerConfirmed}
                state={
                  isAnswerConfirmed
                    ? currentQuestion?.correct === 'A'
                      ? 'correct'
                      : selectedAnswer === 'A'
                      ? 'wrong'
                      : 'idle'
                    : selectedAnswer === 'A'
                    ? 'selected'
                    : 'idle'
                }
                fontSize={layout.answerFont}
                verticalPadding={layout.answerPaddingVertical}
              />

              <View style={{ height: 10 }} />

              <AnswerCard
                text={currentQuestion?.b ?? ''}
                onPress={() => setSelectedAnswer('B')}
                disabled={isAnswerConfirmed}
                state={
                  isAnswerConfirmed
                    ? currentQuestion?.correct === 'B'
                      ? 'correct'
                      : selectedAnswer === 'B'
                      ? 'wrong'
                      : 'idle'
                    : selectedAnswer === 'B'
                    ? 'selected'
                    : 'idle'
                }
                fontSize={layout.answerFont}
                verticalPadding={layout.answerPaddingVertical}
              />

              {!isAnswerConfirmed ? (
                <Pressable
                  onPress={confirmSelectedAnswer}
                  disabled={!selectedAnswer}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { height: layout.buttonHeight, marginTop: 14 },
                    !selectedAnswer && { opacity: 0.35 },
                    pressed && selectedAnswer && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Confirm</Text>
                </Pressable>
              ) : (
                <View style={styles.factCard}>
                  <View style={styles.factRow}>
                    {lastAnswerCorrect !== null ? <StatusMark isCorrect={lastAnswerCorrect} /> : null}
                    <Text style={[styles.factText, { fontSize: layout.factFont }]}>
                      {currentQuestion?.fact}
                    </Text>
                  </View>

                  <Pressable
                    onPress={goToNextQuestion}
                    style={({ pressed }) => [
                      styles.nextButton,
                      { height: layout.buttonHeight },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    </Text>
                  </Pressable>
                </View>
              )}

              <Text style={styles.progressText}>
                {currentQuestionIndex + 1} / {questions.length}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  safe: {
    flex: 1,
  },

  homeHeader: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  homeTitle: {
    color: '#fff',
    fontWeight: '900',
  },

  ticketsCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  ticketsCapsuleText: {
    color: 'rgba(255,255,255,0.93)',
    fontWeight: '800',
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 12,
    color: 'rgba(255,255,255,0.94)',
    fontWeight: '900',
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  categoryCard: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(98, 54, 166, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },

  categoryCardLocked: {
    opacity: 0.56,
  },

  categoryCardInner: {
    flex: 1,
  },

  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  openBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,200,120,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,120,0.35)',
  },

  openBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  lockedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  lockedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  categoryCardTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    marginTop: 8,
  },

  categoryCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
    marginTop: 8,
  },

  categoryDotsWrap: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },

  categoryCounterText: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'right',
    flexShrink: 0,
  },

  levelDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },

  levelDot: {
    borderWidth: 1,
  },

  levelDotActive: {
    backgroundColor: 'rgba(243,154,46,0.92)',
    borderColor: 'rgba(243,154,46,0.98)',
  },

  levelDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.14)',
  },

  topBar: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },

  topBarTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  topBarSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.76)',
    fontWeight: '900',
    fontSize: 13,
  },

  scoreCapsule: {
    minWidth: 54,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(243,154,46,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(243,154,46,0.35)',
  },

  scoreCapsuleText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  toastBubble: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(0,200,120,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,120,0.35)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  toastBubbleText: {
    color: 'rgba(255,255,255,0.96)',
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  questionCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(98, 54, 166, 0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },

  questionTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },

  answerCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },

  answerCardText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },

  primaryButton: {
    width: '100%',
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F39A2E',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }
      : {
          elevation: 8,
        }),
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  nextButton: {
    width: '100%',
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A2BE2',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  secondaryButton: {
    width: '100%',
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.10,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        }
      : {
          elevation: 6,
        }),
  },

  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  factCard: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  factText: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    lineHeight: 18,
  },

  statusMark: {
    width: 44,
    height: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 28,
  },

  progressText: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '800',
    fontSize: 12,
  },

  resultInfoCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(160, 90, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 150, 70, 0.55)',
  },

  resultInfoTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 24,
  },

  resultInfoSubtitle: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 14,
  },

  resultLevelText: {
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '900',
    fontSize: 13,
  },
});