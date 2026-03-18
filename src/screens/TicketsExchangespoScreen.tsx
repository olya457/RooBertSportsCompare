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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addTickets, getTicketsTotal } from '../storage/ticketsStorage';

const backgroundImage = require('../assets/bg.png');
const mascotImage = require('../assets/kangaroo_glasses.png');

const wallpaperItems = [
  { id: 'w1', image: require('../assets/collection/collection_1.png') },
  { id: 'w2', image: require('../assets/collection/collection_2.png') },
  { id: 'w3', image: require('../assets/collection/collection_3.png') },
  { id: 'w4', image: require('../assets/collection/collection_4.png') },
  { id: 'w5', image: require('../assets/collection/collection_5.png') },
  { id: 'w6', image: require('../assets/collection/collection_6.png') },
] as const;

type WallpaperId = (typeof wallpaperItems)[number]['id'];

type UnlockedWallpaper = {
  id: WallpaperId;
  image: any;
  title: string;
};

const unlockedWallpapersStorageKey = 'tickets_exchange_unlocked_wallpapers_v2';
const spinCost = 20;

function pickRandomItem<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

async function readStoredIds(key: string): Promise<string[]> {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch {
    return [];
  }
}

async function writeStoredIds(key: string, value: string[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function IntroModal({
  visible,
  overlayOpacity,
  cardScale,
  mascotFloat,
  maxWidth,
  cardHeight,
  cardRadius,
  textFont,
  textLineHeight,
  mascotWidth,
  mascotHeight,
  mascotRight,
  mascotBottom,
  buttonWidth,
  buttonHeight,
  buttonFont,
  paddingLeft,
  paddingRight,
  buttonTop,
  onClose,
}: {
  visible: boolean;
  overlayOpacity: Animated.Value;
  cardScale: Animated.Value;
  mascotFloat: Animated.AnimatedInterpolation<string | number>;
  maxWidth: number;
  cardHeight: number;
  cardRadius: number;
  textFont: number;
  textLineHeight: number;
  mascotWidth: number;
  mascotHeight: number;
  mascotRight: number;
  mascotBottom: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonFont: number;
  paddingLeft: number;
  paddingRight: number;
  buttonTop: number;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.introOverlay, { opacity: overlayOpacity }]}>
      <View style={styles.introBackdrop} />

      <Animated.View
        style={[
          styles.introCard,
          {
            maxWidth,
            height: cardHeight,
            borderRadius: cardRadius,
            paddingLeft,
            paddingRight,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <Text style={[styles.introText, { fontSize: textFont, lineHeight: textLineHeight }]}>
          Use your tickets to{'\n'}
          unlock surprises and{'\n'}
          discover new content.
        </Text>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: mascotRight,
            bottom: mascotBottom,
            transform: [{ translateY: mascotFloat }],
          }}
        >
          <Image
            source={mascotImage}
            resizeMode="contain"
            style={{ width: mascotWidth, height: mascotHeight }}
          />
        </Animated.View>
      </Animated.View>

      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          styles.introButton,
          {
            marginTop: buttonTop,
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

function RewardStage({
  isSpinning,
  rotation,
  revealedWallpaper,
  size,
  radius,
  questionSize,
  questionRadius,
  questionFont,
  revealScale,
}: {
  isSpinning: boolean;
  rotation: Animated.AnimatedInterpolation<string | number>;
  revealedWallpaper: UnlockedWallpaper | null;
  size: number;
  radius: number;
  questionSize: number;
  questionRadius: number;
  questionFont: number;
  revealScale: Animated.Value;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.stageShadow,
          {
            width: size,
            height: size,
            borderRadius: radius + 6,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.stageCard,
          {
            width: size,
            height: size,
            borderRadius: radius,
            transform: [{ scale: revealScale }],
          },
        ]}
      >
        {isSpinning ? (
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <View style={styles.questionWrap}>
              <View
                style={[
                  styles.questionCircle,
                  {
                    width: questionSize,
                    height: questionSize,
                    borderRadius: questionRadius,
                  },
                ]}
              >
                <Text style={[styles.questionSymbol, { fontSize: questionFont }]}>?</Text>
              </View>
            </View>
          </Animated.View>
        ) : revealedWallpaper ? (
          <View style={styles.revealWrap}>
            <Image source={revealedWallpaper.image} resizeMode="contain" style={styles.revealImage} />
          </View>
        ) : (
          <View style={styles.questionWrap}>
            <View
              style={[
                styles.questionCircle,
                {
                  width: questionSize,
                  height: questionSize,
                  borderRadius: questionRadius,
                },
              ]}
            >
              <Text style={[styles.questionSymbol, { fontSize: questionFont }]}>?</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

export default function TicketsExchangeScreen() {
  const { width, height } = useWindowDimensions();

  const isCompact = height < 700 || width < 350;
  const isSmall = height < 780 || width < 390;

  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [unlockedWallpapers, setUnlockedWallpapers] = useState<WallpaperId[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastUnlockedWallpaper, setLastUnlockedWallpaper] = useState<UnlockedWallpaper | null>(null);
  const [showcaseWallpaper, setShowcaseWallpaper] = useState<UnlockedWallpaper | null>(null);
  const [isIntroVisible, setIsIntroVisible] = useState(false);

  const wheelAnimation = useRef(new Animated.Value(0)).current;
  const revealScaleAnimation = useRef(new Animated.Value(1)).current;
  const successTextAnimation = useRef(new Animated.Value(0)).current;

  const introOpacityAnimation = useRef(new Animated.Value(0)).current;
  const introScaleAnimation = useRef(new Animated.Value(0.98)).current;
  const mascotFloatAnimation = useRef(new Animated.Value(0)).current;

  const introLoopReference = useRef<Animated.CompositeAnimation | null>(null);
  const screenInitializedReference = useRef(false);
  const unlockTimeoutReference = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUnlock = ticketsTotal >= spinCost;

  const lockedWallpapers = useMemo(() => {
    return wallpaperItems.filter((item) => !unlockedWallpapers.includes(item.id));
  }, [unlockedWallpapers]);

  const remainingLockedCount = lockedWallpapers.length;

  const unlockPool = useMemo(() => {
    return lockedWallpapers.map((item) => ({
      id: item.id,
      image: item.image,
      title: 'Unlocked',
    }));
  }, [lockedWallpapers]);

  const hintText = useMemo(() => {
    if (remainingLockedCount === 0) {
      return 'Everything is unlocked.';
    }
    if (!canUnlock) {
      return `You need ${spinCost} tickets to unlock a surprise.`;
    }
    return `Press the button to unlock 1 random surprise (${remainingLockedCount} left).`;
  }, [canUnlock, remainingLockedCount]);

  const wheelRotation = useMemo(
    () =>
      wheelAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [wheelAnimation]
  );

  const mascotTranslateY = useMemo(
    () =>
      mascotFloatAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6],
      }),
    [mascotFloatAnimation]
  );

  const layout = useMemo(() => {
    const sidePadding = isCompact ? 16 : isSmall ? 18 : 22;
    const hintFont = isCompact ? 14 : isSmall ? 16 : 18;
    const hintLineHeight = isCompact ? 19 : isSmall ? 21 : 22;
    const stageSize = isCompact ? 210 : isSmall ? 236 : 258;
    const stageRadius = isCompact ? 40 : 46;
    const buttonHeight = isCompact ? 54 : isSmall ? 60 : 66;
    const titleFont = isCompact ? 26 : isSmall ? 30 : 34;
    const questionSize = isCompact ? 78 : isSmall ? 88 : 96;
    const questionRadius = Math.round(questionSize / 2);
    const questionFont = isCompact ? 54 : isSmall ? 60 : 64;
    const introWidth = isCompact ? 320 : 360;
    const introHeight = isCompact ? 160 : 178;
    const introRadius = isCompact ? 24 : 26;
    const introTextFont = isCompact ? 18 : 20;
    const introTextLineHeight = isCompact ? 22 : 24;
    const mascotWidth = isCompact ? 142 : isSmall ? 162 : 172;
    const mascotHeight = isCompact ? 172 : isSmall ? 198 : 210;
    const mascotRight = isCompact ? -6 : -10;
    const mascotBottom = isCompact ? -18 : -22;
    const introButtonWidth = isCompact ? 220 : 250;
    const introButtonHeight = isCompact ? 52 : 56;
    const introButtonFont = isCompact ? 18 : 19;
    const introButtonTop = isCompact ? 22 : 24;
    const introPaddingLeft = isCompact ? 18 : 22;
    const introPaddingRight = isCompact ? 110 : 128;
    const contentBottomPadding = isCompact ? 110 : 140;

    return {
      sidePadding,
      hintFont,
      hintLineHeight,
      stageSize,
      stageRadius,
      buttonHeight,
      titleFont,
      questionSize,
      questionRadius,
      questionFont,
      introWidth,
      introHeight,
      introRadius,
      introTextFont,
      introTextLineHeight,
      mascotWidth,
      mascotHeight,
      mascotRight,
      mascotBottom,
      introButtonWidth,
      introButtonHeight,
      introButtonFont,
      introButtonTop,
      introPaddingLeft,
      introPaddingRight,
      contentBottomPadding,
    };
  }, [isCompact, isSmall]);

  const stopMascotFloat = useCallback(() => {
    introLoopReference.current?.stop();
    mascotFloatAnimation.stopAnimation();
    mascotFloatAnimation.setValue(0);
  }, [mascotFloatAnimation]);

  const startMascotFloat = useCallback(() => {
    stopMascotFloat();

    introLoopReference.current = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnimation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(mascotFloatAnimation, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    introLoopReference.current.start();
  }, [mascotFloatAnimation, stopMascotFloat]);

  const openIntro = useCallback(() => {
    setIsIntroVisible(true);
    introOpacityAnimation.setValue(0);
    introScaleAnimation.setValue(0.98);

    Animated.parallel([
      Animated.timing(introOpacityAnimation, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(introScaleAnimation, {
        toValue: 1,
        friction: 7,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startMascotFloat();
    });
  }, [introOpacityAnimation, introScaleAnimation, startMascotFloat]);

  const closeIntro = useCallback(() => {
    stopMascotFloat();

    Animated.parallel([
      Animated.timing(introOpacityAnimation, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(introScaleAnimation, {
        toValue: 0.985,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsIntroVisible(false);
    });
  }, [introOpacityAnimation, introScaleAnimation, stopMascotFloat]);

  const playRevealAnimation = useCallback(() => {
    revealScaleAnimation.setValue(0.96);
    successTextAnimation.setValue(0);

    Animated.parallel([
      Animated.spring(revealScaleAnimation, {
        toValue: 1,
        friction: 7,
        tension: 170,
        useNativeDriver: true,
      }),
      Animated.timing(successTextAnimation, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealScaleAnimation, successTextAnimation]);

  const loadScreenData = useCallback(async () => {
    const [tickets, storedIds] = await Promise.all([
      getTicketsTotal().catch(() => 0),
      readStoredIds(unlockedWallpapersStorageKey),
    ]);

    setTicketsTotal(tickets);
    setUnlockedWallpapers(storedIds.filter(Boolean) as WallpaperId[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScreenData();

      if (!screenInitializedReference.current) {
        screenInitializedReference.current = true;
        openIntro();
      }

      return () => {
        if (unlockTimeoutReference.current) {
          clearTimeout(unlockTimeoutReference.current);
          unlockTimeoutReference.current = null;
        }
        stopMascotFloat();
      };
    }, [loadScreenData, openIntro, stopMascotFloat])
  );

  useEffect(() => {
    return () => {
      if (unlockTimeoutReference.current) {
        clearTimeout(unlockTimeoutReference.current);
      }
      stopMascotFloat();
    };
  }, [stopMascotFloat]);

  const handleUnlock = useCallback(async () => {
    if (isSpinning) return;
    if (!canUnlock) return;
    if (remainingLockedCount === 0) return;

    setIsSpinning(true);
    setLastUnlockedWallpaper(null);
    setShowcaseWallpaper(null);
    successTextAnimation.setValue(0);

    wheelAnimation.setValue(0);

    Animated.timing(wheelAnimation, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const updatedTicketsTotal = await addTickets(-spinCost)
      .then((value) => value)
      .catch(() => ticketsTotal - spinCost);

    setTicketsTotal(updatedTicketsTotal);

    const chosenWallpaper = pickRandomItem(unlockPool);

    unlockTimeoutReference.current = setTimeout(async () => {
      if (!chosenWallpaper) {
        setIsSpinning(false);
        return;
      }

      const nextUnlockedWallpapers = Array.from(
        new Set([...unlockedWallpapers, chosenWallpaper.id])
      ) as WallpaperId[];

      setUnlockedWallpapers(nextUnlockedWallpapers);
      await writeStoredIds(unlockedWallpapersStorageKey, nextUnlockedWallpapers);

      setLastUnlockedWallpaper(chosenWallpaper);
      setShowcaseWallpaper(chosenWallpaper);
      playRevealAnimation();
      setIsSpinning(false);
    }, 980);
  }, [
    canUnlock,
    isSpinning,
    playRevealAnimation,
    remainingLockedCount,
    successTextAnimation,
    ticketsTotal,
    unlockPool,
    unlockedWallpapers,
    wheelAnimation,
  ]);

  const buttonDisabled = !canUnlock || isSpinning || remainingLockedCount === 0;

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: layout.contentBottomPadding }}
          bounces={false}
          overScrollMode="never"
        >
          <View style={{ paddingHorizontal: layout.sidePadding }}>
            <View style={{ height: isCompact ? 10 : 14 }} />

            <View style={styles.ticketRow}>
              <Text style={styles.ticketEmoji}>🎟️</Text>
              <Text style={styles.ticketText}>× {ticketsTotal}</Text>
            </View>

            <View style={{ height: isCompact ? 12 : 18 }} />

            <Text
              style={[
                styles.helperText,
                {
                  fontSize: layout.hintFont,
                  lineHeight: layout.hintLineHeight,
                },
              ]}
            >
              {hintText}
            </Text>

            <View style={{ height: isCompact ? 12 : 18 }} />

            <View style={{ height: 26, justifyContent: 'center' }}>
              {lastUnlockedWallpaper ? (
                <Animated.Text style={[styles.noticeText, { opacity: successTextAnimation }]}>
                  New unlock received!
                </Animated.Text>
              ) : (
                <Text style={styles.noticePlaceholder}> </Text>
              )}
            </View>

            <View style={{ height: isCompact ? 10 : 16 }} />

            <View style={{ alignItems: 'center' }}>
              <RewardStage
                isSpinning={isSpinning}
                rotation={wheelRotation}
                revealedWallpaper={showcaseWallpaper}
                size={layout.stageSize}
                radius={layout.stageRadius}
                questionSize={layout.questionSize}
                questionRadius={layout.questionRadius}
                questionFont={layout.questionFont}
                revealScale={revealScaleAnimation}
              />

              <View style={{ height: isCompact ? 10 : 14 }} />

              <Text style={[styles.screenTitle, { fontSize: layout.titleFont }]}>Randomizer</Text>

              <View style={{ height: isCompact ? 14 : 22 }} />

              <Pressable
                onPress={handleUnlock}
                disabled={buttonDisabled}
                style={({ pressed }) => [
                  styles.unlockButton,
                  { height: layout.buttonHeight },
                  buttonDisabled && styles.unlockButtonDisabled,
                  pressed && !buttonDisabled && { transform: [{ scale: 0.992 }] },
                ]}
              >
                <Text
                  style={[
                    styles.unlockButtonText,
                    isCompact && { fontSize: 18 },
                    buttonDisabled && { opacity: 0.55 },
                  ]}
                >
                  Unlock
                </Text>
              </Pressable>
            </View>

            <View style={{ height: isCompact ? 22 : 36 }} />
          </View>
        </ScrollView>

        <IntroModal
          visible={isIntroVisible}
          overlayOpacity={introOpacityAnimation}
          cardScale={introScaleAnimation}
          mascotFloat={mascotTranslateY}
          maxWidth={layout.introWidth}
          cardHeight={layout.introHeight}
          cardRadius={layout.introRadius}
          textFont={layout.introTextFont}
          textLineHeight={layout.introTextLineHeight}
          mascotWidth={layout.mascotWidth}
          mascotHeight={layout.mascotHeight}
          mascotRight={layout.mascotRight}
          mascotBottom={layout.mascotBottom}
          buttonWidth={layout.introButtonWidth}
          buttonHeight={layout.introButtonHeight}
          buttonFont={layout.introButtonFont}
          paddingLeft={layout.introPaddingLeft}
          paddingRight={layout.introPaddingRight}
          buttonTop={layout.introButtonTop}
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

  ticketEmoji: {
    fontSize: 18,
  },

  ticketText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 0.2,
  },

  helperText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
  },

  noticeText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },

  noticePlaceholder: {
    height: 20,
  },

  stageShadow: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },

  stageCard: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(110, 70, 210, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,170,90,0.35)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  questionWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  questionCircle: {
    backgroundColor: '#F39A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  questionSymbol: {
    color: '#2B1E56',
    fontWeight: '900',
    marginTop: -2,
  },

  revealWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  revealImage: {
    width: '92%',
    height: '92%',
  },

  screenTitle: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  unlockButton: {
    width: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F39A2E',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
        }
      : {
          elevation: 10,
        }),
  },

  unlockButtonDisabled: {
    backgroundColor: '#8A5A38',
    opacity: 0.7,
  },

  unlockButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },

  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  introBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },

  introCard: {
    width: '100%',
    backgroundColor: 'rgba(104, 60, 182, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(243,154,46,0.38)',
    justifyContent: 'center',
    overflow: 'visible',
  },

  introText: {
    color: '#fff',
    fontWeight: '800',
  },

  introButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F39A2E',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
        }
      : {
          elevation: 10,
        }),
  },

  introButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});
