import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const bg = require('../assets/bg.png');

const STORAGE_KEYS = {
  notifications: 'settings_notifications_v1',
  vibration: 'settings_vibration_v1',
} as const;

const RESET_STORAGE_KEYS = [
  'tickets_total_v1',
  'tickets_total_v2',
  'tickets_exchange_unlocked_wallpapers_v2',
  'tickets_exchange_unlocked_modes_v2',
  'tickets_exchange_intro_seen_v1',
  'wallpapers_intro_seen_v1',
  'stats_intro_seen_v1',
  'quiz_correct_stats_v1',
  'quiz_correct_stats_v2',
  'quiz_stats_correct_v1',
  'quiz_stats_v1',
];

type ToggleKey = 'notifications' | 'vibration';

async function getStoredToggle(key: string, fallback: boolean) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === '1' || raw === 'true';
  } catch {
    return fallback;
  }
}

async function setStoredToggle(key: string, value: boolean) {
  try {
    await AsyncStorage.setItem(key, value ? '1' : '0');
  } catch {}
}

async function clearProgressData() {
  try {
    await AsyncStorage.multiRemove(RESET_STORAGE_KEYS);
    return true;
  } catch {
    return false;
  }
}

function useAppearAnimation() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const play = useCallback(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();

    opacity.setValue(0);
    translateY.setValue(12);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return { opacity, translateY, play };
}

function useStaggerItem(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const play = useCallback(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();

    opacity.setValue(0);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return { opacity, translateY, play };
}

function useDialogAnimation() {
  const overlay = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  const show = useCallback(() => {
    overlay.stopAnimation();
    scale.stopAnimation();

    overlay.setValue(0);
    scale.setValue(0.95);

    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 185,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlay, scale]);

  const hide = useCallback(
    (onDone?: () => void) => {
      overlay.stopAnimation();
      scale.stopAnimation();

      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.985,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && onDone) onDone();
      });
    },
    [overlay, scale]
  );

  return { overlay, scale, show, hide };
}

function SettingRow({
  label,
  icon,
  height,
  fontSize,
  iconSize,
  children,
}: {
  label: string;
  icon: string;
  height: number;
  fontSize: number;
  iconSize: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.settingRow, { height }]}>
      <Text style={[styles.settingLabel, { fontSize }]}>{label}</Text>
      <View style={styles.settingRight}>
        <Text style={[styles.settingIcon, { fontSize: iconSize }]}>{icon}</Text>
        {children}
      </View>
    </View>
  );
}

function ConfirmResetDialog({
  visible,
  width,
  radius,
  titleSize,
  textSize,
  buttonHeight,
  buttonWidth,
  confirm,
  close,
  overlayOpacity,
  scale,
  compact,
}: {
  visible: boolean;
  width: number;
  radius: number;
  titleSize: number;
  textSize: number;
  buttonHeight: number;
  buttonWidth: number;
  confirm: () => void;
  close: () => void;
  overlayOpacity: Animated.Value;
  scale: Animated.Value;
  compact: boolean;
}) {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.dialogOverlay, { opacity: overlayOpacity }]}>
      <Pressable style={styles.dialogBackdrop} onPress={close} />
      <Animated.View
        style={[
          styles.dialogCard,
          {
            width,
            borderRadius: radius,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={[styles.dialogTitle, { fontSize: titleSize }]}>Reset Progress?</Text>
        <Text style={[styles.dialogText, { fontSize: textSize }]}>This action can’t be undone.</Text>

        <View style={[styles.dialogButtons, { marginTop: compact ? 14 : 16 }]}>
          <Pressable
            onPress={confirm}
            style={({ pressed }) => [
              styles.dialogButton,
              styles.dialogDanger,
              {
                width: buttonWidth,
                height: buttonHeight,
                borderRadius: buttonHeight / 2,
              },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.dialogButtonText}>Confirm</Text>
          </Pressable>

          <Pressable
            onPress={close}
            style={({ pressed }) => [
              styles.dialogButton,
              styles.dialogSafe,
              {
                width: buttonWidth,
                height: buttonHeight,
                borderRadius: buttonHeight / 2,
              },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.dialogButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const compact = height < 700 || width < 350;
  const small = height < 780 || width < 390;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);

  const screenAnim = useAppearAnimation();
  const rowAnim1 = useStaggerItem(40);
  const rowAnim2 = useStaggerItem(95);
  const rowAnim3 = useStaggerItem(150);
  const shareAnim = useStaggerItem(225);
  const dialogAnim = useDialogAnimation();

  const ui = useMemo(() => {
    const padX = compact ? 16 : small ? 18 : 22;
    const titleSize = compact ? 18 : small ? 19 : 20;
    const rowHeight = compact ? 52 : small ? 56 : 60;
    const rowText = compact ? 15 : small ? 16 : 17;
    const iconText = compact ? 19 : 20;
    const shareHeight = compact ? 44 : small ? 46 : 48;
    const shareWidth = Math.min(compact ? 260 : small ? 280 : 300, width - padX * 2);
    const shareText = compact ? 14 : 15;
    const shareBottom = Math.max(12, insets.bottom + 12) + (compact ? 86 : small ? 96 : 104);
    const modalWidth = Math.min(420, width - 44);
    const modalRadius = compact ? 18 : 20;
    const modalButtonHeight = compact ? 44 : 46;
    const modalButtonWidth = Math.floor((modalWidth - 18 - 18 - 14) / 2);
    const listBottomPadding =
      Math.max(12, insets.bottom + 12) + shareHeight + (compact ? 118 : 134);
    const topPadding = compact ? 8 : 12;
    const gap = compact ? 12 : 14;
    const modalTitle = compact ? 18 : 19;
    const modalText = compact ? 14 : 15;

    return {
      padX,
      titleSize,
      rowHeight,
      rowText,
      iconText,
      shareHeight,
      shareWidth,
      shareText,
      shareBottom,
      modalWidth,
      modalRadius,
      modalButtonHeight,
      modalButtonWidth,
      listBottomPadding,
      topPadding,
      gap,
      modalTitle,
      modalText,
    };
  }, [compact, small, width, insets.bottom]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [savedNotifications, savedVibration] = await Promise.all([
        getStoredToggle(STORAGE_KEYS.notifications, true),
        getStoredToggle(STORAGE_KEYS.vibration, true),
      ]);

      if (!mounted) return;

      setNotificationsEnabled(savedNotifications);
      setVibrationEnabled(savedVibration);

      requestAnimationFrame(() => {
        screenAnim.play();
        rowAnim1.play();
        rowAnim2.play();
        rowAnim3.play();
        shareAnim.play();
      });
    })();

    return () => {
      mounted = false;
    };
  }, [rowAnim1, rowAnim2, rowAnim3, screenAnim, shareAnim]);

  const openResetDialog = useCallback(() => {
    setDialogVisible(true);
    requestAnimationFrame(dialogAnim.show);
  }, [dialogAnim]);

  const closeResetDialog = useCallback(() => {
    dialogAnim.hide(() => setDialogVisible(false));
  }, [dialogAnim]);

  const handleConfirmReset = useCallback(async () => {
    dialogAnim.hide(async () => {
      setDialogVisible(false);
      const ok = await clearProgressData();
      if (ok) {
        Alert.alert('Done', 'Progress has been reset.');
      } else {
        Alert.alert('Error', 'Could not reset progress.');
      }
    });
  }, [dialogAnim]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: 'Check out this app!' });
    } catch {}
  }, []);

  const handleToggle = useCallback(async (key: ToggleKey, value: boolean) => {
    if (key === 'notifications') {
      setNotificationsEnabled(value);
      await setStoredToggle(STORAGE_KEYS.notifications, value);
      return;
    }

    setVibrationEnabled(value);
    await setStoredToggle(STORAGE_KEYS.vibration, value);
  }, []);

  return (
    <ImageBackground source={bg} resizeMode="cover" style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View
          style={{
            flex: 1,
            opacity: screenAnim.opacity,
            transform: [{ translateY: screenAnim.translateY }],
          }}
        >
          <ScrollView
            style={{ flex: 1 }}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: ui.topPadding,
              paddingHorizontal: ui.padX,
              paddingBottom: ui.listBottomPadding,
            }}
          >
            <Text style={[styles.screenTitle, { fontSize: ui.titleSize }]}>Settings</Text>

            <View style={{ height: compact ? 16 : 18 }} />

            <Animated.View
              style={{
                opacity: rowAnim1.opacity,
                transform: [{ translateY: rowAnim1.translateY }],
              }}
            >
              <SettingRow
                label="Notifications"
                icon="🔔"
                height={ui.rowHeight}
                fontSize={ui.rowText}
                iconSize={ui.iconText}
              >
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(v) => handleToggle('notifications', v)}
                  trackColor={{
                    false: 'rgba(255,255,255,0.18)',
                    true: 'rgba(243,154,46,0.70)',
                  }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              </SettingRow>
            </Animated.View>

            <View style={{ height: ui.gap }} />

            <Animated.View
              style={{
                opacity: rowAnim2.opacity,
                transform: [{ translateY: rowAnim2.translateY }],
              }}
            >
              <SettingRow
                label="Vibration"
                icon="📳"
                height={ui.rowHeight}
                fontSize={ui.rowText}
                iconSize={ui.iconText}
              >
                <Switch
                  value={vibrationEnabled}
                  onValueChange={(v) => handleToggle('vibration', v)}
                  trackColor={{
                    false: 'rgba(255,255,255,0.18)',
                    true: 'rgba(243,154,46,0.70)',
                  }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              </SettingRow>
            </Animated.View>

            <View style={{ height: ui.gap }} />

            <Animated.View
              style={{
                opacity: rowAnim3.opacity,
                transform: [{ translateY: rowAnim3.translateY }],
              }}
            >
              <SettingRow
                label="Reset Progress"
                icon="↻"
                height={ui.rowHeight}
                fontSize={ui.rowText}
                iconSize={ui.iconText}
              >
                <Pressable
                  onPress={openResetDialog}
                  style={({ pressed }) => [
                    styles.resetAction,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={[styles.settingIcon, { fontSize: ui.iconText }]}>↻</Text>
                </Pressable>
              </SettingRow>
            </Animated.View>
          </ScrollView>

          <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: ui.shareBottom,
                alignItems: 'center',
              }}
            >
              <Animated.View
                style={{
                  opacity: shareAnim.opacity,
                  transform: [{ translateY: shareAnim.translateY }],
                }}
              >
                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [
                    styles.shareButton,
                    {
                      width: ui.shareWidth,
                      height: ui.shareHeight,
                      borderRadius: ui.shareHeight / 2,
                    },
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={[styles.shareButtonText, { fontSize: ui.shareText }]}>Share App</Text>
                  <Text style={[styles.shareButtonIcon, { fontSize: ui.shareText + 2 }]}>⤴︎</Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        <ConfirmResetDialog
          visible={dialogVisible}
          width={ui.modalWidth}
          radius={ui.modalRadius}
          titleSize={ui.modalTitle}
          textSize={ui.modalText}
          buttonHeight={ui.modalButtonHeight}
          buttonWidth={ui.modalButtonWidth}
          confirm={handleConfirmReset}
          close={closeResetDialog}
          overlayOpacity={dialogAnim.overlay}
          scale={dialogAnim.scale}
          compact={compact}
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

  screenTitle: {
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  settingRow: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
  },

  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  settingIcon: {
    color: 'rgba(255,255,255,0.85)',
  },

  resetAction: {
    width: 48,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  shareButton: {
    backgroundColor: '#F39A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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

  shareButtonText: {
    color: '#fff',
    fontWeight: '900',
  },

  shareButtonIcon: {
    color: '#fff',
    fontWeight: '900',
  },

  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  dialogCard: {
    backgroundColor: 'rgba(104, 60, 182, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(243,154,46,0.38)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 12 },
        }
      : {
          elevation: 14,
        }),
  },

  dialogTitle: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },

  dialogText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    textAlign: 'center',
  },

  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },

  dialogButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  dialogDanger: {
    backgroundColor: '#E53935',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        }
      : {
          elevation: 10,
        }),
  },

  dialogSafe: {
    backgroundColor: '#2E7D32',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        }
      : {
          elevation: 10,
        }),
  },

  dialogButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
});