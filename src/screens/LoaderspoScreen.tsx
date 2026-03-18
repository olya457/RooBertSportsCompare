import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const bg = require('../assets/bg.png');
const logo = require('../assets/logo.png');

const BAR_COUNT = 5;

function AnimatedBar({
  delay,
  isSmall,
}: {
  delay: number;
  isSmall: boolean;
}) {
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(phase, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [delay, phase]);

  const barScaleY = phase.interpolate({
    inputRange: [0, 0.2, 0.45, 0.7, 1],
    outputRange: [1, 1.9, 1.2, 2.25, 1],
    extrapolate: 'clamp',
  });

  const barOpacity = phase.interpolate({
    inputRange: [0, 0.2, 0.45, 0.7, 1],
    outputRange: [0.45, 0.75, 0.6, 1, 0.45],
    extrapolate: 'clamp',
  });

  const glowScale = phase.interpolate({
    inputRange: [0, 0.25, 0.6, 1],
    outputRange: [0.9, 1.12, 1.24, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.barSlot}>
      <Animated.View
        style={[
          styles.glow,
          isSmall && styles.glowSmall,
          {
            opacity: barOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          isSmall && styles.barSmall,
          {
            opacity: barOpacity,
            transform: [{ scaleY: barScaleY }],
          },
        ]}
      />
    </View>
  );
}

export default function LoaderScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isSmall = height < 740 || width < 360;

  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const loaderFade = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(loaderFade, {
        toValue: 1,
        duration: 900,
        delay: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const shine = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    intro.start();
    shine.start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 4200);

    return () => {
      clearTimeout(timer);
      shine.stop();
    };
  }, [loaderFade, logoFade, logoScale, navigation, shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.5],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-22, 22],
  });

  return (
    <ImageBackground source={bg} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoFade,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={logo}
              resizeMode="contain"
              style={[styles.logo, isSmall && styles.logoSmall]}
            />

            <Animated.View
              pointerEvents="none"
              style={[
                styles.logoShine,
                isSmall && styles.logoShineSmall,
                {
                  opacity: shimmerOpacity,
                  transform: [{ translateX: shimmerTranslate }, { rotate: '-10deg' }],
                },
              ]}
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.loaderArea,
            isSmall && styles.loaderAreaSmall,
            { opacity: loaderFade },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.loaderCard, isSmall && styles.loaderCardSmall]}>
            <View style={styles.loaderRow}>
              {Array.from({ length: BAR_COUNT }).map((_, index) => (
                <AnimatedBar
                  key={index}
                  delay={index * 120}
                  isSmall={isSmall}
                />
              ))}
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

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 300,
    maxWidth: 460,
    height: 170,
  },

  logoSmall: {
    width: 250,
    height: 140,
  },

  logoShine: {
    position: 'absolute',
    width: 120,
    height: 34,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },

  logoShineSmall: {
    width: 96,
    height: 28,
  },

  loaderArea: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'android' ? 34 : 30,
    alignItems: 'center',
  },

  loaderAreaSmall: {
    left: 14,
    right: 14,
    bottom: Platform.OS === 'android' ? 26 : 24,
  },

  loaderCard: {
    width: 170,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 19, 31, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(130, 241, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  loaderCardSmall: {
    width: 150,
    height: 64,
    borderRadius: 22,
  },

  loaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
  },

  barSlot: {
    width: 14,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow: {
    position: 'absolute',
    width: 12,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(82, 247, 255, 0.22)',
  },

  glowSmall: {
    width: 10,
    height: 20,
  },

  bar: {
    width: 8,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#67F6FF',
  },

  barSmall: {
    width: 7,
    height: 18,
  },
});