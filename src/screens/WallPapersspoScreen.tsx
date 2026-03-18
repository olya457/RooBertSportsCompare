import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTicketsTotal, addTickets } from '../storage/ticketsStorage';

const backgroundImage = require('../assets/bg.png');
const mascotImage = require('../assets/kangaroo_glasses.png');

const wallpapers = [
  { id: 'w1', image: require('../assets/collection/collection_1.png') },
  { id: 'w2', image: require('../assets/collection/collection_2.png') },
  { id: 'w3', image: require('../assets/collection/collection_3.png') },
  { id: 'w4', image: require('../assets/collection/collection_4.png') },
  { id: 'w5', image: require('../assets/collection/collection_5.png') },
  { id: 'w6', image: require('../assets/collection/collection_6.png') },
] as const;

type WallpaperItem = (typeof wallpapers)[number];
type WallpaperId = WallpaperItem['id'];

const unlockedWallpapersStorageKey = 'tickets_exchange_unlocked_wallpapers_v2';
const introSeenStorageKey = 'wallpapers_intro_seen_v1';
const selectedWallpaperStorageKey = 'wallpapers_selected_id_v1';

const unlockPrice = 20;
const alwaysUnlockedId: WallpaperId = 'w1';

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function IntroModal({
  visible,
  opacity,
  scale,
  floatY,
  cardWidth,
  cardHeight,
  textFont,
  lineHeight,
  mascotWidth,
  mascotHeight,
  mascotRight,
  mascotBottom,
  buttonWidth,
  buttonHeight,
  buttonFont,
  onClose,
}: {
  visible: boolean;
  opacity: Animated.Value;
  scale: Animated.Value;
  floatY: Animated.AnimatedInterpolation<string | number>;
  cardWidth: number;
  cardHeight: number;
  textFont: number;
  lineHeight: number;
  mascotWidth: number;
  mascotHeight: number;
  mascotRight: number;
  mascotBottom: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonFont: number;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.modalOverlay, { opacity }]}>
      <View style={styles.modalBackdrop} />

      <Animated.View
        style={[
          styles.modalCard,
          {
            maxWidth: cardWidth,
            height: cardHeight,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={[styles.modalText, { fontSize: textFont, lineHeight }]}>
          One wallpaper is open by default.{'\n'}
          Unlock the rest with tickets{'\n'}
          and share the opened ones.
        </Text>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: mascotRight,
            bottom: mascotBottom,
            transform: [{ translateY: floatY }],
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
          styles.modalButton,
          {
            width: buttonWidth,
            height: buttonHeight,
            borderRadius: buttonHeight / 2,
          },
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
      >
        <Text style={[styles.modalButtonText, { fontSize: buttonFont }]}>Got it</Text>
      </Pressable>
    </Animated.View>
  );
}

function WallpaperCard({
  item,
  index,
  width,
  height,
  radius,
  isCompact,
  badgeFont,
  badgePadHorizontal,
  badgePadVertical,
  buttonHeight,
  buttonFont,
  buttonPaddingHorizontal,
  isUnlocked,
  isSelected,
  canBuy,
  onShare,
  onUnlock,
  onSelect,
}: {
  item: WallpaperItem;
  index: number;
  width: number;
  height: number;
  radius: number;
  isCompact: boolean;
  badgeFont: number;
  badgePadHorizontal: number;
  badgePadVertical: number;
  buttonHeight: number;
  buttonFont: number;
  buttonPaddingHorizontal: number;
  isUnlocked: boolean;
  isSelected: boolean;
  canBuy: boolean;
  onShare: (id: WallpaperId) => void;
  onUnlock: (id: WallpaperId) => void;
  onSelect: (id: WallpaperId) => void;
}) {
  const appearOpacity = useRef(new Animated.Value(0)).current;
  const appearTranslateY = useRef(new Animated.Value(10)).current;
  const appearScale = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    appearOpacity.setValue(0);
    appearTranslateY.setValue(10);
    appearScale.setValue(0.985);

    Animated.parallel([
      Animated.timing(appearOpacity, {
        toValue: 1,
        duration: 240,
        delay: Math.min(index, 10) * 55,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(appearTranslateY, {
        toValue: 0,
        duration: 260,
        delay: Math.min(index, 10) * 55,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(appearScale, {
        toValue: 1,
        friction: 7,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [appearOpacity, appearScale, appearTranslateY, index]);

  const borderColor = isSelected
    ? 'rgba(255,255,255,0.96)'
    : isUnlocked
    ? 'rgba(243,154,46,0.95)'
    : 'rgba(255,255,255,0.12)';

  const borderWidth = isSelected ? 3 : isUnlocked ? 2 : 1;

  const backgroundColor = isSelected
    ? 'rgba(255,255,255,0.10)'
    : isUnlocked
    ? 'rgba(243,154,46,0.10)'
    : 'rgba(94, 45, 160, 0.18)';

  return (
    <Animated.View
      style={{
        width,
        height,
        opacity: appearOpacity,
        transform: [{ translateY: appearTranslateY }, { scale: appearScale }],
      }}
    >
      <Pressable
        onPress={() => onSelect(item.id)}
        style={({ pressed }) => [
          styles.cardRoot,
          {
            borderRadius: radius,
            borderColor,
            borderWidth,
            backgroundColor,
            transform: [{ scale: pressed ? 0.992 : 1 }],
          },
        ]}
      >
        <Image
          source={item.image}
          resizeMode="cover"
          style={[
            styles.cardImage,
            {
              borderRadius: radius,
              opacity: isUnlocked ? 1 : 0.55,
              ...(Platform.OS === 'android' ? ({ overflow: 'hidden' } as any) : null),
            },
          ]}
        />

        {!isUnlocked ? <View style={styles.cardDim} /> : null}

        {isUnlocked ? (
          <View
            style={[
              styles.cardGlow,
              {
                borderRadius: radius,
                borderColor: isSelected ? 'rgba(255,255,255,0.96)' : 'rgba(243,154,46,0.95)',
                borderWidth: isSelected ? 3 : 2,
                shadowOpacity: isSelected ? 0.36 : 0.28,
                shadowRadius: isSelected ? 18 : 14,
                ...(Platform.OS === 'android'
                  ? { elevation: isSelected ? 8 : 6 }
                  : null),
              },
            ]}
          />
        ) : (
          <View style={styles.cardStroke} />
        )}

        {isSelected ? <View style={[styles.selectedOverlay, { borderRadius: radius }]} /> : null}

        <View
          style={[
            styles.badgeWrap,
            {
              top: isCompact ? 9 : 11,
              right: isCompact ? 9 : 11,
            },
          ]}
        >
          <View
            style={[
              styles.badge,
              {
                paddingHorizontal: badgePadHorizontal,
                paddingVertical: badgePadVertical,
                backgroundColor: isUnlocked
                  ? isSelected
                    ? 'rgba(255,255,255,0.22)'
                    : 'rgba(243,154,46,0.26)'
                  : 'rgba(255,255,255,0.18)',
                borderColor: isUnlocked
                  ? isSelected
                    ? 'rgba(255,255,255,0.72)'
                    : 'rgba(243,154,46,0.70)'
                  : 'rgba(255,255,255,0.22)',
              },
            ]}
          >
            <Text style={[styles.badgeText, { fontSize: badgeFont }]}>
              {isUnlocked ? (isSelected ? 'Opened' : 'Unlocked') : `${unlockPrice} Tickets`}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.bottomActionWrap,
            {
              bottom: isCompact ? 10 : 12,
            },
          ]}
        >
          {isUnlocked ? (
            <Pressable
              onPress={() => onShare(item.id)}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  height: buttonHeight,
                  paddingHorizontal: buttonPaddingHorizontal,
                },
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={[styles.actionButtonText, { fontSize: buttonFont }]}>Share</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => onUnlock(item.id)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.unlockActionButton,
                {
                  height: buttonHeight,
                  paddingHorizontal: buttonPaddingHorizontal,
                },
                !canBuy && styles.disabledButton,
                pressed && canBuy && { transform: [{ scale: 0.99 }] },
              ]}
              disabled={!canBuy}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { fontSize: buttonFont },
                  !canBuy && { opacity: 0.6 },
                ]}
              >
                Unlock
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WallPapersspoScreen() {
  const { width, height } = useWindowDimensions();

  const isCompact = height <= 700 || width <= 350;
  const isSmall = height <= 780 || width <= 390;

  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState<WallpaperId[]>([alwaysUnlockedId]);
  const [selectedWallpaperId, setSelectedWallpaperId] = useState<WallpaperId>(alwaysUnlockedId);
  const [introVisible, setIntroVisible] = useState(false);

  const introGuardRef = useRef(false);

  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.985)).current;
  const mascotFloat = useRef(new Animated.Value(0)).current;
  const mascotLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const layout = useMemo(() => {
    const tabBarHeight = isCompact ? 98 : isSmall ? 92 : 88;
    const sidePadding = isCompact ? 12 : isSmall ? 14 : 18;
    const titleFont = isCompact ? 20 : isSmall ? 22 : 26;
    const gridGap = isCompact ? 10 : isSmall ? 12 : 14;

    const maxContentWidth = Math.min(width, 520);
    const availableWidth = maxContentWidth - sidePadding * 2;
    const itemWidth = Math.floor((availableWidth - gridGap) / 2);

    const itemRadius = isCompact ? 16 : isSmall ? 18 : 24;
    const ratio = isCompact ? 0.9 : isSmall ? 0.98 : 1.05;
    const itemHeight = Math.round(itemWidth * ratio);

    const badgeFont = isCompact ? 10 : isSmall ? 12 : 13;
    const badgePadHorizontal = isCompact ? 10 : isSmall ? 12 : 14;
    const badgePadVertical = isCompact ? 4 : 6;

    const buttonHeight = isCompact ? 28 : isSmall ? 34 : 36;
    const buttonFont = isCompact ? 12 : isSmall ? 13 : 14;
    const buttonPaddingHorizontal = isCompact ? 12 : isSmall ? 14 : 18;

    const balanceLabelFont = isCompact ? 12 : isSmall ? 13 : 15;
    const balanceValueFont = isCompact ? 15 : isSmall ? 16 : 18;
    const balancePadVertical = isCompact ? 6 : 8;
    const balancePadHorizontal = isCompact ? 12 : 14;

    const headerTopPadding = isCompact ? 2 : 6;

    const introWidth = isCompact ? 310 : 340;
    const introHeight = isCompact ? 146 : 158;
    const introTextFont = isCompact ? 14 : 16;
    const introTextLineHeight = isCompact ? 18 : 20;
    const introMascotWidth = isCompact ? 118 : 142;
    const introMascotHeight = isCompact ? 146 : 176;
    const introMascotRight = isCompact ? -6 : -10;
    const introMascotBottom = isCompact ? -18 : -20;

    const introButtonWidth = isCompact ? 150 : 160;
    const introButtonHeight = isCompact ? 42 : 44;
    const introButtonFont = isCompact ? 15 : 16;

    const bottomPadding = Math.max(12, tabBarHeight + (isCompact ? 10 : 12));
    const listTopPadding = isCompact ? 2 : 6;

    return {
      sidePadding,
      titleFont,
      gridGap,
      itemWidth,
      itemHeight,
      itemRadius,
      badgeFont,
      badgePadHorizontal,
      badgePadVertical,
      buttonHeight,
      buttonFont,
      buttonPaddingHorizontal,
      balanceLabelFont,
      balanceValueFont,
      balancePadVertical,
      balancePadHorizontal,
      headerTopPadding,
      introWidth,
      introHeight,
      introTextFont,
      introTextLineHeight,
      introMascotWidth,
      introMascotHeight,
      introMascotRight,
      introMascotBottom,
      introButtonWidth,
      introButtonHeight,
      introButtonFont,
      maxContentWidth,
      bottomPadding,
      listTopPadding,
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

  const showIntro = useCallback(() => {
    setIntroVisible(true);
    introOpacity.setValue(0);
    introScale.setValue(0.985);

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

  const hideIntro = useCallback(async () => {
    await AsyncStorage.setItem(introSeenStorageKey, '1');
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
  }, [introOpacity, introScale, stopMascotFloat]);

  const loadScreenData = useCallback(async () => {
    const [tickets, storedUnlocked, storedSelectedId, introSeen] = await Promise.all([
      getTicketsTotal().catch(() => 0),
      readStoredIds(unlockedWallpapersStorageKey),
      AsyncStorage.getItem(selectedWallpaperStorageKey).catch(() => null),
      AsyncStorage.getItem(introSeenStorageKey).catch(() => null),
    ]);

    const normalizedUnlocked = Array.from(
      new Set([alwaysUnlockedId, ...(storedUnlocked.filter(Boolean) as WallpaperId[])])
    ) as WallpaperId[];

    const selectedId =
      storedSelectedId && normalizedUnlocked.includes(storedSelectedId as WallpaperId)
        ? (storedSelectedId as WallpaperId)
        : alwaysUnlockedId;

    setTicketsTotal(tickets);
    setUnlockedIds(normalizedUnlocked);
    setSelectedWallpaperId(selectedId);

    if (introGuardRef.current) return;

    introGuardRef.current = true;

    if (!introSeen) {
      showIntro();
    }
  }, [showIntro]);

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

  const handleSelect = useCallback(async (id: WallpaperId) => {
    if (!unlockedIds.includes(id)) return;

    setSelectedWallpaperId(id);

    try {
      await AsyncStorage.setItem(selectedWallpaperStorageKey, id);
    } catch {}
  }, [unlockedIds]);

  const handleShare = useCallback(
    async (id: WallpaperId) => {
      try {
        await Share.share({ message: `Wallpaper: ${id}` });
      } catch {}
    },
    []
  );

  const handleUnlock = useCallback(
    async (id: WallpaperId) => {
      if (unlockedIds.includes(id)) return;

      if (ticketsTotal < unlockPrice) {
        Alert.alert('Not enough tickets', `You need ${unlockPrice} tickets to unlock this wallpaper.`);
        return;
      }

      const updatedTickets = await addTickets(-unlockPrice)
        .then((value) => value)
        .catch(() => ticketsTotal - unlockPrice);

      const updatedUnlocked = Array.from(new Set([...unlockedIds, id])) as WallpaperId[];

      setTicketsTotal(updatedTickets);
      setUnlockedIds(updatedUnlocked);
      setSelectedWallpaperId(id);

      await Promise.all([
        writeStoredIds(unlockedWallpapersStorageKey, updatedUnlocked),
        AsyncStorage.setItem(selectedWallpaperStorageKey, id).catch(() => {}),
      ]);
    },
    [ticketsTotal, unlockedIds]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: WallpaperItem; index: number }) => {
      const isUnlocked = unlockedIds.includes(item.id);
      const isSelected = selectedWallpaperId === item.id;

      return (
        <WallpaperCard
          item={item}
          index={index}
          width={layout.itemWidth}
          height={layout.itemHeight}
          radius={layout.itemRadius}
          isCompact={isCompact}
          badgeFont={layout.badgeFont}
          badgePadHorizontal={layout.badgePadHorizontal}
          badgePadVertical={layout.badgePadVertical}
          buttonHeight={layout.buttonHeight}
          buttonFont={layout.buttonFont}
          buttonPaddingHorizontal={layout.buttonPaddingHorizontal}
          isUnlocked={isUnlocked}
          isSelected={isSelected}
          canBuy={ticketsTotal >= unlockPrice}
          onShare={handleShare}
          onUnlock={handleUnlock}
          onSelect={handleSelect}
        />
      );
    },
    [
      handleSelect,
      handleShare,
      handleUnlock,
      isCompact,
      layout.badgeFont,
      layout.badgePadHorizontal,
      layout.badgePadVertical,
      layout.buttonFont,
      layout.buttonHeight,
      layout.buttonPaddingHorizontal,
      layout.itemHeight,
      layout.itemRadius,
      layout.itemWidth,
      selectedWallpaperId,
      ticketsTotal,
      unlockedIds,
    ]
  );

  const listKey = useMemo(
    () => `wallpapers_2_${layout.itemWidth}_${layout.itemHeight}`,
    [layout.itemHeight, layout.itemWidth]
  );

  const headerTopPadding = clamp(layout.headerTopPadding, 0, 10);

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.screen, { paddingHorizontal: layout.sidePadding }]}>
          <View style={[styles.titleWrap, { paddingTop: headerTopPadding }]}>
            <Text style={[styles.title, { fontSize: layout.titleFont }]}>Wallpapers</Text>
          </View>

          <View style={{ height: isCompact ? 8 : 10 }} />

          <View
            style={[
              styles.balanceBox,
              {
                paddingVertical: layout.balancePadVertical,
                paddingHorizontal: layout.balancePadHorizontal,
                width: '100%',
                maxWidth: layout.maxContentWidth,
                alignSelf: 'center',
              },
            ]}
          >
            <Text style={[styles.balanceLabel, { fontSize: layout.balanceLabelFont }]}>Tickets</Text>
            <Text style={[styles.balanceAmount, { fontSize: layout.balanceValueFont }]}>
              × {ticketsTotal}
            </Text>
          </View>

          <View style={{ height: isCompact ? 8 : 10 }} />

          <View style={{ flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' }}>
            <FlatList
              data={wallpapers}
              key={listKey}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={2}
              columnWrapperStyle={{ gap: layout.gridGap }}
              contentContainerStyle={{
                gap: layout.gridGap,
                paddingTop: layout.listTopPadding,
                paddingBottom: layout.bottomPadding,
              }}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              removeClippedSubviews={Platform.OS === 'android'}
              initialNumToRender={6}
              windowSize={7}
            />
          </View>
        </View>

        <IntroModal
          visible={introVisible}
          opacity={introOpacity}
          scale={introScale}
          floatY={mascotTranslateY}
          cardWidth={layout.introWidth}
          cardHeight={layout.introHeight}
          textFont={layout.introTextFont}
          lineHeight={layout.introTextLineHeight}
          mascotWidth={layout.introMascotWidth}
          mascotHeight={layout.introMascotHeight}
          mascotRight={layout.introMascotRight}
          mascotBottom={layout.introMascotBottom}
          buttonWidth={layout.introButtonWidth}
          buttonHeight={layout.introButtonHeight}
          buttonFont={layout.introButtonFont}
          onClose={hideIntro}
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

  screen: {
    flex: 1,
  },

  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: 'rgba(255,255,255,0.94)',
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  balanceLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '800',
  },

  balanceAmount: {
    color: '#fff',
    fontWeight: '900',
  },

  cardRoot: {
    flex: 1,
    overflow: 'hidden',
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },

  cardDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  cardStroke: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(243,154,46,0.95)',
    shadowColor: '#F39A2E',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    ...(Platform.OS === 'android' ? { elevation: 6 } : null),
  },

  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  badgeWrap: {
    position: 'absolute',
  },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '900',
  },

  bottomActionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  actionButton: {
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
          elevation: 8,
        }),
  },

  unlockActionButton: {
    backgroundColor: '#8A2BE2',
  },

  disabledButton: {
    opacity: 0.65,
  },

  actionButtonText: {
    color: '#fff',
    fontWeight: '900',
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  modalCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(104, 60, 182, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(243,154,46,0.38)',
    paddingLeft: 18,
    paddingRight: 120,
    justifyContent: 'center',
    overflow: 'visible',
  },

  modalText: {
    color: '#fff',
    fontWeight: '800',
  },

  modalButton: {
    marginTop: 18,
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

  modalButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});