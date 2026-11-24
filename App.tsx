import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/colors';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError && !fontTimedOut) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.splashText}>Đang tải AquaSense...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar style="dark" />
        <AppNavigator />
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  splashText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
  },
});
