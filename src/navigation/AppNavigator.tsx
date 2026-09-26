import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapAuthThunk, logoutThunk } from '../store/slices/authSlice';
import { setOnUnauthenticated } from '../services/apiClient';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';
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
    // Đăng ký callback khi Token hết hạn hoặc bị lỗi thu hồi
    setOnUnauthenticated(() => {
      dispatch(logoutThunk());
    });

    // Khởi tạo phiên làm việc từ SecureStore
    dispatch(bootstrapAuthThunk());
  }, [dispatch]);

  if (isBootstrapping) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang khởi tạo Trạm điều khiển SCADA...</Text>
      </View>
    );
  }

  return (
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
