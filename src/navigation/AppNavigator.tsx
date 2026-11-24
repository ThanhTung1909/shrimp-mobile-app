import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { store } from '../store';
import { bootstrapAuthThunk, logoutThunk } from '../store/slices/authSlice';
import { fetchPonds, selectPond } from '../store/slices/pondSlice';
import { fetchAlertsThunk } from '../store/slices/alertSlice';
import { fetchDevicesThunk } from '../store/slices/deviceSlice';
import { clearToast } from '../store/slices/uiSlice';
import { setOnUnauthenticated } from '../services/apiClient';
import { socketService } from '../services/socketService';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { PondDetailScreen } from '../screens/pond/PondDetailScreen';
import { ManualLogCropScreen } from '../screens/pond/ManualLogCropScreen';
import { ThresholdsNotificationsScreen } from '../screens/settings/ThresholdsNotificationsScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { MainTabNavigator, MainTabParamList } from './MainTabNavigator';
import { EmergencyAlertBanner } from '../components/EmergencyAlertBanner';
import { PondSelectorModal } from '../components/modals/PondSelectorModal';
import { colors } from '../constants/colors';
import { fontFamily, typography } from '../constants/typography';
import { shadows } from '../constants/theme';

export type RootStackParamList = {
  Auth: undefined;
  ForceChangePassword: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PondDetail: { pondId?: string } | undefined;
  ManualLogCrop: { pondId?: string; initialTab?: 'testkit' | 'crop' } | undefined;
  ThresholdsNotifications:
    | { pondId?: string; initialSection?: 'thresholds' | 'notifications' }
    | undefined;
  ProfileDetail: undefined;
};

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isBootstrapping, mustChangePassword } = useAppSelector(
    (state) => state.auth
  );
  const ponds = useAppSelector((state) => state.pond.ponds);
  const toastMessage = useAppSelector((state) => state.ui.toastMessage);

  useEffect(() => {
    socketService.setStore(dispatch, store.getState);

    setOnUnauthenticated(() => {
      socketService.disconnect();
      dispatch(logoutThunk());
    });

    dispatch(bootstrapAuthThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => {
      dispatch(clearToast());
    }, 3200);
    return () => clearTimeout(t);
  }, [toastMessage, dispatch]);

  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      socketService.connect();
      dispatch(fetchPonds());
      dispatch(fetchAlertsThunk());
      dispatch(fetchDevicesThunk());

      if (Platform.OS !== 'web') {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            socketService.connect();
          } else if (nextAppState === 'background') {
            socketService.disconnect(false);
          }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
      }
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, mustChangePassword, dispatch]);

  const pondIdsKey = useMemo(
    () => ponds.map((p) => p.id).sort().join(','),
    [ponds]
  );

  // Subscribe to all accessible ponds once loaded so live CRITICAL alerts trigger globally
  useEffect(() => {
    if (!isAuthenticated || mustChangePassword || !pondIdsKey) return;
    const ids = pondIdsKey.split(',').filter(Boolean);
    ids.forEach((id) => {
      socketService.subscribePond(id);
    });
    return () => {
      ids.forEach((id) => {
        socketService.unsubscribePond(id);
      });
    };
  }, [isAuthenticated, mustChangePassword, pondIdsKey]);

  if (isBootstrapping) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu AquaSense...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appRoot}>
      <NavigationContainer ref={rootNavigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={LoginScreen} />
          ) : mustChangePassword ? (
            <Stack.Screen name="ForceChangePassword">
              {() => <ChangePasswordScreen isForced={true} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="PondDetail" component={PondDetailScreen} />
              <Stack.Screen name="ManualLogCrop" component={ManualLogCropScreen} />
              <Stack.Screen
                name="ThresholdsNotifications"
                component={ThresholdsNotificationsScreen}
              />
              <Stack.Screen name="ProfileDetail">
                {({ navigation }) => <ProfileScreen onBack={() => navigation.goBack()} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>

        {isAuthenticated && !mustChangePassword ? (
          <>
            <PondSelectorModal />
            <EmergencyAlertBanner
              onViewAlert={(alert) => {
                if (alert.pondId) {
                  dispatch(selectPond(alert.pondId));
                }
                if (rootNavigationRef.isReady()) {
                  rootNavigationRef.navigate('MainTabs', { screen: 'Alerts' });
                }
              }}
            />
          </>
        ) : null}
      </NavigationContainer>

      {toastMessage ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => dispatch(clearToast())}
          style={[
            styles.toast,
            toastMessage.tone === 'danger'
              ? styles.toastDanger
              : toastMessage.tone === 'warning'
              ? styles.toastWarn
              : styles.toastSafe,
          ]}
        >
          <Text style={styles.toastText}>{toastMessage.text}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.muted,
  },
  toast: {
    position: 'absolute',
    bottom: 84,
    left: 16,
    right: 16,
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadows.floating,
  },
  toastSafe: {
    backgroundColor: colors.primaryDark,
  },
  toastWarn: {
    backgroundColor: colors.warnText,
  },
  toastDanger: {
    backgroundColor: colors.dangerText,
  },
  toastText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
