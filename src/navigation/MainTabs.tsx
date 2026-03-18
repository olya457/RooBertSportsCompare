import React from 'react';
import { View, StyleSheet, Image, Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';

import QuizScreen from '../screens/QuizspoScreen';
import TicketsExchangeScreen from '../screens/TicketsExchangespoScreen';
import WallPapersScreen from '../screens/WallPapersspoScreen';
import StatisticsScreen from '../screens/StatisticsspoScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<keyof MainTabParamList, any> = {
  Quiz: require('../assets/icon/ic_quiz.png'),
  TicketsExchange: require('../assets/icon/ic_tickets.png'),
  WallPapers: require('../assets/icon/ic_wallpapers.png'),
  Statistics: require('../assets/icon/ic_stats.png'),
  Settings: require('../assets/icon/ic_settings.png'),
};

function TabIcon({
  focused,
  source,
  size,
  wrapSize,
  radius,
  shiftY,
}: {
  focused: boolean;
  source: any;
  size: number;
  wrapSize: number;
  radius: number;
  shiftY: number;
}) {
  return (
    <View style={{ transform: [{ translateY: shiftY }] }}>
      <View
        style={[
          styles.iconWrap,
          { width: wrapSize, height: wrapSize, borderRadius: radius },
          focused && styles.iconWrapActive,
        ]}
      >
        <Image source={source} resizeMode="contain" style={{ width: size, height: size, tintColor: '#FFFFFF' }} />
      </View>
    </View>
  );
}

export default function MainTabs() {
  const { width, height } = useWindowDimensions();
  const isTiny = height <= 700 || width <= 350;
  const isSmall = height <= 760 || width <= 380;

  const barHeight = isTiny ? 60 : isSmall ? 66 : 74;
  const barRadius = isTiny ? 18 : isSmall ? 20 : 22;

  const iconSize = isTiny ? 20 : isSmall ? 22 : 24;
  const wrapSize = isTiny ? 44 : isSmall ? 48 : 52;
  const iconShiftY = isTiny ? 8 : isSmall ? 12 : 18;
  const baseBottom = 30;
  const androidLift = 20;
  const marginBottom = Platform.OS === 'android' ? baseBottom + androidLift : baseBottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,

        tabBarStyle: [
          styles.tabBar,
          {
            height: barHeight,
            borderRadius: barRadius,
            marginBottom,
          },
        ],

        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },

        tabBarIcon: ({ focused }) => (
          <TabIcon
            focused={focused}
            source={icons[route.name as keyof MainTabParamList]}
            size={iconSize}
            wrapSize={wrapSize}
            radius={16}
            shiftY={iconShiftY}
          />
        ),
      })}
    >
      <Tab.Screen name="Quiz" children={() => <QuizScreen />} />
      <Tab.Screen name="TicketsExchange" component={TicketsExchangeScreen} />
      <Tab.Screen name="WallPapers" component={WallPapersScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    backgroundColor: 'rgba(94, 45, 160, 0.55)',
    borderTopWidth: 0,

    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
        }
      : { elevation: 10 }),
  },

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  iconWrapActive: {
    backgroundColor: '#F39A2E',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }
      : { elevation: 8 }),
  },
});
