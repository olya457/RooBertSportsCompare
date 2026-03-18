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
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTicketsTotal } from '../storage/ticketsStorage';
import { getCorrectStats } from '../storage/quizStatsStorage';
import { CATEGORIES, type QuizCategoryId } from '../data/quizData';

const backgroundImage = require('../assets/bg.png');
const kangarooImage = require('../assets/kangaroo_glasses.png');

const introSeenStorageKey = 'stats_intro_seen_v1';
const accentColor = '#F39A2E';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCategoryGoal(id: QuizCategoryId, title: string) {
  const normalizedTitle = String(title || '').toLowerCase();
  const normalizedId = String(id || '').toLowerCase();

  if (
    normalizedId.includes('mixed') ||
    normalizedTitle.includes('mixed') ||
    normalizedId.includes('random') ||
    normalizedTitle.includes('random')
  ) {
    return 100;
  }

  return 20;
}

function ProgressRow({
  title,
  value,
  goal,
  progress,
  height,
  titleFont,
  valueFont,
  compact,
}: {
  title: string;
  value: number;
  goal: number;
  progress: number;
  height: number;
  titleFont: number;
  valueFont: number;
  compact: boolean;
}) {
  const fillAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fillAnimation.setValue(0);
    Animated.timing(fillAnimation, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fillAnimation, progress]);

  const fillWidth = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isCompleted = value >= goal && goal > 0;

  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: fillWidth,
            height,
            borderRadius: height / 2,
          },
        ]}
      />

      <View style={styles.progressContent}>
        <Text style={[styles.progressTitle, { fontSize: titleFont }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.progressBottomRow}>
          <Text style={[styles.progressValue, { fontSize: valueFont }]}>
            {value}/{goal}
          </Text>

          {isCompleted ? (
            <Text style={[styles.completedMark, compact && { fontSize: 14 }]}>★</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function IntroModal({
  visible,
  opacity,
  scale,
  floatY,
  maxWidth,
  padding,
  textFont,
  lineHeight,
  mascotWidth,
  mascotHeight,
  buttonWidth,
  buttonHeight,
  buttonFont,
  onClose,
}: {
  visible: boolean;
  opacity: Animated.Value;
  scale: Animated.Value;
  floatY: Animated.AnimatedInterpolation<string | number>;
  maxWidth: number;
  padding: number;
  textFont: number;
  lineHeight: number;
  mascotWidth: number;
  mascotHeight: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonFont: number;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.introOverlay, { opacity }]}>
      <View style={styles.introBackdrop} />

      <Animated.View
        style={[
          styles.introCard,
          {
            maxWidth,
            padding,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.introRow}>
          <View style={styles.introTextWrap}>
            <Text style={[styles.introText, { fontSize: textFont, lineHeight }]}>
              Track your progress and{'\n'}
              see how many correct{'\n'}
              answers you&apos;ve made in{'\n'}
              each sport.
            </Text>
          </View>

          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <Image
              source={kangarooImage}
              resizeMode="contain"
              style={{ width: mascotWidth, height: mascotHeight }}
            />
          </Animated.View>
        </View>
      </Animated.View>

      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          styles.introButton,
          {
            width: buttonWidth,
            height: buttonHeight,
            borderRadius: buttonHeight / 2,
          },
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
      >
        <Text style={[styles.introButtonText, { fontSize: buttonFont }]}>Got it</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function StatisticsspoScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isCompact = height <= 700 || width <= 350;
  const isSmall = height <= 760 || width <= 390;

  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [correctStats, setCorrectStats] = useState<Record<QuizCategoryId, number>>(
    {} as Record<QuizCategoryId, number>
  );
  const [introVisible, setIntroVisible] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.98)).current;
  const mascotFloat = useRef(new Animated.Value(0)).current;
  const mascotLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const layout = useMemo(() => {
    const sidePadding = isCompact ? 14 : isSmall ? 16 : 18;
    const trackHeight = isCompact ? 52 : isSmall ? 58 : 62;
    const titleFont = isCompact ? 14 : isSmall ? 15 : 16;
    const valueFont = isCompact ? 13 : isSmall ? 14 : 15;
    const gap = isCompact ? 10 : isSmall ? 12 : 14;
    const topOffset = isCompact ? 26 : isSmall ? 30 : 34;
    const ticketFont = isCompact ? 20 : 22;

    const introWidth = Math.min(isCompact ? 320 : 360, width - 40);
    const introPadding = isCompact ? 16 : 18;
    const introTextFont = isCompact ? 14 : 16;
    const introLineHeight = isCompact ? 18 : 20;
    const introMascotWidth = isCompact ? 104 : 124;
    const introMascotHeight = isCompact ? 104 : 124;
    const introButtonWidth = isCompact ? 170 : 190;
    const introButtonHeight = isCompact ? 42 : 44;
    const introButtonFont = isCompact ? 15 : 16;

    return {
      sidePadding,
      trackHeight,
      titleFont,
      valueFont,
      gap,
      topOffset,
      ticketFont,
      introWidth,
      introPadding,
      introTextFont,
      introLineHeight,
      introMascotWidth,
      introMascotHeight,
      introButtonWidth,
      introButtonHeight,
      introButtonFont,
    };
  }, [isCompact, isSmall, width]);

  const mascotTranslateY = useMemo(
    () =>
      mascotFloat.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6],
      }),
    [mascotFloat]
  );

  const startMascotFloat = useCallback(() => {
    mascotFloat.stopAnimation();
    mascotFloat.setValue(0);

    mascotLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(mascotFloat, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    mascotLoopRef.current.start();
  }, [mascotFloat]);

  const stopMascotFloat = useCallback(() => {
    mascotLoopRef.current?.stop();
    mascotFloat.stopAnimation();
    mascotFloat.setValue(0);
  }, [mascotFloat]);

  const playContentAnimation = useCallback(() => {
    contentOpacity.setValue(0);
    contentTranslateY.setValue(12);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  const openIntro = useCallback(() => {
    setIntroVisible(true);
    introOpacity.setValue(0);
    introScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(introScale, {
        toValue: 1,
        friction: 7,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startMascotFloat();
    });
  }, [introOpacity, introScale, startMascotFloat]);

  const closeIntro = useCallback(async () => {
    stopMascotFloat();

    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(introScale, {
        toValue: 0.99,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIntroVisible(false);
    });

    await AsyncStorage.setItem(introSeenStorageKey, '1');
  }, [introOpacity, introScale, stopMascotFloat]);

  const loadScreenData = useCallback(async () => {
    const [tickets, stats, introSeen] = await Promise.all([
      getTicketsTotal().catch(() => 0),
      getCorrectStats().catch(() => ({} as Record<QuizCategoryId, number>)),
      AsyncStorage.getItem(introSeenStorageKey),
    ]);

    setTicketsTotal(tickets);
    setCorrectStats(stats);

    requestAnimationFrame(playContentAnimation);

    if (!introSeen) {
      openIntro();
    }
  }, [openIntro, playContentAnimation]);

  useFocusEffect(
    useCallback(() => {
      loadScreenData();

      return () => {
        stopMascotFloat();
      };
    }, [loadScreenData, stopMascotFloat])
  );

  useEffect(() => {
    return () => {
      stopMascotFloat();
    };
  }, [stopMascotFloat]);

  const progressItems = useMemo(() => {
    return CATEGORIES.map((category) => {
      const rawValue = Math.max(0, Math.floor(Number((correctStats as any)[category.id]) || 0));
      const goal = getCategoryGoal(category.id, category.title);
      const value = clamp(rawValue, 0, goal);
      const progress = goal > 0 ? value / goal : 0;

      return {
        id: category.id,
        title: category.title,
        value,
        goal,
        progress,
      };
    });
  }, [correctStats]);

  const contentBottomPadding = Math.max(16, insets.bottom + 16);
  const minimumContentHeight = height - insets.top - insets.bottom;

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View
          style={{
            flex: 1,
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          }}
        >
          <ScrollView
            style={{ flex: 1 }}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: layout.topOffset,
              paddingHorizontal: layout.sidePadding,
              paddingBottom: contentBottomPadding,
              minHeight: minimumContentHeight,
            }}
          >
            <View style={styles.ticketRow}>
              <Text style={styles.ticketIcon}>🎟️</Text>
              <Text style={[styles.ticketAmount, { fontSize: layout.ticketFont }]}>
                × {ticketsTotal}
              </Text>
            </View>

            <View style={{ height: isCompact ? 12 : 16 }} />

            <View style={{ gap: layout.gap }}>
              {progressItems.map((item) => (
                <ProgressRow
                  key={String(item.id)}
                  title={item.title}
                  value={item.value}
                  goal={item.goal}
                  progress={item.progress}
                  height={layout.trackHeight}
                  titleFont={layout.titleFont}
                  valueFont={layout.valueFont}
                  compact={isCompact}
                />
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        <IntroModal
          visible={introVisible}
          opacity={introOpacity}
          scale={introScale}
          floatY={mascotTranslateY}
          maxWidth={layout.introWidth}
          padding={layout.introPadding}
          textFont={layout.introTextFont}
          lineHeight={layout.introLineHeight}
          mascotWidth={layout.introMascotWidth}
          mascotHeight={layout.introMascotHeight}
          buttonWidth={layout.introButtonWidth}
          buttonHeight={layout.introButtonHeight}
          buttonFont={layout.introButtonFont}
          onClose={closeIntro}
        />
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

  ticketRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  ticketIcon: {
    fontSize: 18,
  },

  ticketAmount: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  progressTrack: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(104, 64, 204, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: accentColor,
  },

  progressContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  progressTitle: {
    color: 'rgba(255,255,255,0.98)',
    fontWeight: '900',
    textAlign: 'center',
  },

  progressBottomRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  progressValue: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
  },

  completedMark: {
    color: accentColor,
    fontWeight: '900',
    fontSize: 16,
  },

  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },

  introBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  introCard: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(84, 38, 150, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,170,90,0.35)',
  },

  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  introTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  introText: {
    color: '#fff',
    fontWeight: '800',
  },

  introButton: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accentColor,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
        }
      : {
          elevation: 8,
        }),
  },

  introButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});