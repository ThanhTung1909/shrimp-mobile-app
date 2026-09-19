import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>System Settings</Text>
        <Text style={styles.subtitle}>SCADA Node & Telemetry Configuration</Text>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(logout())}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    ...typography.headlineSm,
    color: colors.onErrorContainer,
  },
});
