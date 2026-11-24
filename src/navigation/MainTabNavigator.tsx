import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fontFamily } from '../constants/typography';
import { useAppSelector } from '../store/hooks';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { AiForecastScreen } from '../screens/ai/AiForecastScreen';
import { AlertCenterScreen } from '../screens/alert/AlertCenterScreen';
import { DeviceManagerScreen } from '../screens/device/DeviceManagerScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

export type MainTabParamList = {
  Overview: undefined;
  AiForecast: undefined;
  Alerts: undefined;
  Devices: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const activeAlertCount = useAppSelector((state) => {
    const restActive = state.alert.alerts.filter((a) => a.status === 'ACTIVE').length;
    return restActive > 0 ? restActive : state.alert.unreadAlertCount;
  });

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.semiBold,
          fontSize: 11,
          lineHeight: 14,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Ao nuôi',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="water" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AiForecast"
        component={AiForecastScreen}
        options={{
          tabBarLabel: 'Dự báo AI',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-awesome" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertCenterScreen}
        options={{
          tabBarLabel: 'Cảnh báo',
          tabBarBadge: activeAlertCount > 0 ? activeAlertCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.dangerText,
            color: '#FFFFFF',
            fontSize: 10,
            fontFamily: fontFamily.bold,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Devices"
        component={DeviceManagerScreen}
        options={{
          tabBarLabel: 'Thiết bị',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="sensors" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
