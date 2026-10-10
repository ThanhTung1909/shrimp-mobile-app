import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapAuthThunk, logoutThunk } from '../store/slices/authSlice';
import { setOnUnauthenticated } from '../services/apiClient';
import { socketService } from '../services/socketService';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { EmergencyAlertBanner } from '../components/EmergencyAlertBanner';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export type RootStackParamList = {
  Auth: undefined;
  ForceChangePassword: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isBootstrapping, mustChangePassword } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Đăng ký Redux dispatch handler vào SocketService
    socketService.setDispatch(dispatch);

    // Đăng ký callback khi Token hết hạn hoặc bị lỗi thu hồi
    setOnUnauthenticated(() => {
      socketService.disconnect();
      dispatch(logoutThunk());
    });

    // Khởi tạo phiên làm việc từ SecureStore
    dispatch(bootstrapAuthThunk());
  }, [dispatch]);

  // Quản lý kết nối Socket theo trạng thái Đăng nhập & Vòng đời App (Foreground / Background)
  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      console.log('🔑 [AppNavigator] Đã xác thực thành công. Khởi tạo WebSocket kết nối...');
      socketService.connect();

      // Chỉ lắng nghe AppState để ngắt/khôi phục socket trên Mobile Native (iOS / Android)
      if (Platform.OS !== 'web') {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            console.log('📱 [AppLifecycleManager] App vào Foreground: Khôi phục kết nối WebSocket.');
            socketService.connect();
          } else if (nextAppState === 'background') {
            console.log('💤 [AppLifecycleManager] App vào Background: Tạm ngắt kết nối WebSocket.');
            socketService.disconnect();
          }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
          subscription.remove();
        };
      }
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, mustChangePassword]);

  if (isBootstrapping) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang khởi tạo Trạm điều khiển SCADA...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <EmergencyAlertBanner />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={LoginScreen} />
          ) : mustChangePassword ? (
            <Stack.Screen name="ForceChangePassword">
              {() => <ChangePasswordScreen isForced={true} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
