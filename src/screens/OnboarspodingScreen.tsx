import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const bg = require('../assets/bg.png');
const on1 = require('../assets/on_1.png');
const on2 = require('../assets/on_2.png');
const on3 = require('../assets/on_3.png');
const on4 = require('../assets/on_4.png');

type PageItem = {
  key: string;
  image: any;
  title: string;
  desc: string;
  cta: string;
};

const DATA: PageItem[] = [
  {
    key: 'welcome',
    image: on1,
    title: "Hi, I’m RooBert",
    desc: "I’ll guide you through sports using\nsimple and fun comparisons.",
    cta: 'Next',
  },
  {
    key: 'compare',
    image: on2,
    title: 'Compare Athletes',
    desc: 'Choose between two athletes and\ndiscover who is taller, faster, or has\nbetter stats based on real data.',
    cta: 'Next',
  },
  {
    key: 'tickets',
    image: on3,
    title: 'Earn Tickets',
    desc: 'Answer correctly to collect tickets.\nBuild streaks and unlock more\nopportunities as you play.',
    cta: 'Next',
  },
  {
    key: 'wallpapers',
    image: on4,
    title: 'Unlock Wallpapers',
    desc: 'Use your tickets to unlock wallpapers\nand personalize your phone screen.',
    cta: 'Begin',
  },
];

function Dot({
  active,
  width,
}: {
  active: boolean;
  width: Animated.AnimatedInterpolation<string | number>;
}) {
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width,
          opacity: active ? 1 : 0.45,
          backgroundColor: active ? 'rgba(243,154,46,0.98)' : 'rgba(255,255,255,0.20)',
          borderWidth: active ? 0 : 1,
          borderColor: active ? 'transparent' : 'rgba(255,255,255,0.20)',
          transform: [{ scale: active ? 1.04 : 1 }],
        },
      ]}
    />
  );
}

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const compact = width < 360 || height < 700;
  const small = width < 390 || height < 780;

  const [pageIndex, setPageIndex] = useState(0);
  const [renderedPage, setRenderedPage] = useState<PageItem>(DATA[0]);

  const pageAnim = useRef(new Animated.Value(1)).current;
  const imageFloat = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const dotProgress = useRef(
    DATA.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  const ui = useMemo(() => {
    const side = compact ? 14 : small ? 16 : 20;

    const heroWidth = Math.min(width - side * 2, 520);
    const heroHeight = compact
      ? Math.min(height * 0.42, 300)
      : small
      ? Math.min(height * 0.48, 360)
      : Math.min(height * 0.54, 430);

    const cardRadius = compact ? 18 : small ? 20 : 22;
    const cardPadX = compact ? 14 : 16;
    const cardPadTop = compact ? 14 : small ? 16 : 18;
    const cardPadBottom = compact ? 16 : 18;

    const titleSize = compact ? 18 : small ? 19 : 21;
    const descSize = compact ? 11.5 : small ? 12.2 : 13.2;
    const descLine = compact ? 17 : small ? 18 : 20;

    const ctaHeight = compact ? 40 : 42;
    const ctaMinWidth = compact ? 154 : 168;
    const ctaPadX = compact ? 18 : 24;

    const dotsGap = compact ? 8 : 10;
    const dotsTop = compact ? 12 : 14;

    const buttonTop = compact ? 14 : 16;
    const panelBottom = Math.max(insets.bottom + 10, 16);

    return {
      side,
      heroWidth,
      heroHeight,
      cardRadius,
      cardPadX,
      cardPadTop,
      cardPadBottom,
      titleSize,
      descSize,
      descLine,
      ctaHeight,
      ctaMinWidth,
      ctaPadX,
      dotsGap,
      dotsTop,
      buttonTop,
      panelBottom,
    };
  }, [compact, small, width, height, insets.bottom]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(imageFloat, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(imageFloat, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [imageFloat]);

  const imageTranslateY = imageFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const imageScale = pageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const imageOpacity = pageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const imageEnterY = pageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });

  const cardOpacity = pageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardTranslateY = pageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  const pulseButtonIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const pulseButtonOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const animateTo = useCallback(
    (nextIndex: number) => {
      Animated.timing(pageAnim, {
        toValue: 0,
        duration: 130,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setRenderedPage(DATA[nextIndex]);
        setPageIndex(nextIndex);

        dotProgress.forEach((value, i) => {
          Animated.timing(value, {
            toValue: i === nextIndex ? 1 : 0,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        });

        pageAnim.setValue(0);

        Animated.timing(pageAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    },
    [dotProgress, pageAnim]
  );

  const handleNext = useCallback(() => {
    if (pageIndex >= DATA.length - 1) {
      navigation.replace('MainTabs');
      return;
    }

    animateTo(pageIndex + 1);
  }, [animateTo, navigation, pageIndex]);

  const heroShift = compact ? -12 : small ? -18 : -24;

  return (
    <ImageBackground source={bg} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.heroZone, { paddingHorizontal: ui.side }]}>
          <Animated.View
            style={{
              opacity: imageOpacity,
              transform: [
                { translateY: imageEnterY },
                { translateY: imageTranslateY },
                { translateY: heroShift },
                { scale: imageScale },
              ],
            }}
          >
            <Image
              source={renderedPage.image}
              resizeMode="contain"
              style={{
                width: ui.heroWidth,
                height: ui.heroHeight,
              }}
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.panelWrap,
            {
              left: ui.side,
              right: ui.side,
              bottom: ui.panelBottom,
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <View
            style={[
              styles.panel,
              {
                borderRadius: ui.cardRadius,
                paddingHorizontal: ui.cardPadX,
                paddingTop: ui.cardPadTop,
                paddingBottom: ui.cardPadBottom,
              },
            ]}
          >
            <Text style={[styles.title, { fontSize: ui.titleSize }]}>
              {renderedPage.title}
            </Text>

            <Text
              style={[
                styles.desc,
                {
                  fontSize: ui.descSize,
                  lineHeight: ui.descLine,
                },
              ]}
            >
              {renderedPage.desc}
            </Text>

            <View style={[styles.dotsRow, { marginTop: ui.dotsTop, gap: ui.dotsGap }]}>
              {DATA.map((item, i) => {
                const animatedWidth = dotProgress[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [compact ? 8 : 9, compact ? 18 : 20],
                });

                return <Dot key={item.key} active={i === pageIndex} width={animatedWidth} />;
              })}
            </View>

            <View style={[styles.ctaFlowWrap, { marginTop: ui.buttonTop }]}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Pressable
                  onPress={handleNext}
                  onPressIn={pulseButtonIn}
                  onPressOut={pulseButtonOut}
                  style={[
                    styles.cta,
                    {
                      height: ui.ctaHeight,
                      minWidth: ui.ctaMinWidth,
                      borderRadius: ui.ctaHeight / 2,
                      paddingHorizontal: ui.ctaPadX,
                    },
                  ]}
                >
                  <Text style={styles.ctaText}>{renderedPage.cta}</Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
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

  heroZone: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  panelWrap: {
    position: 'absolute',
    zIndex: 20,
  },

  panel: {
    backgroundColor: 'rgba(92, 53, 176, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },

  desc: {
    marginTop: 9,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },

  dotsRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    height: 9,
    borderRadius: 999,
  },

  ctaFlowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  cta: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F39A2E',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        }
      : {
          elevation: 6,
        }),
  },

  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});