import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutThunk } from '../../store/slices/authSlice';
import { ProfileScreen } from './ProfileScreen';
import { ChangePasswordScreen } from '../auth/ChangePasswordScreen';

export const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);

  const [activeSubScreen, setActiveSubScreen] = useState<'none' | 'profile' | 'changePassword'>('none');

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng nông dân?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => dispatch(logoutThunk()),
      },
    ]);
  };

  if (activeSubScreen === 'profile') {
    return <ProfileScreen onBack={() => setActiveSubScreen('none')} />;
  }

  if (activeSubScreen === 'changePassword') {
    return (
      <ChangePasswordScreen
        isForced={false}
        onCancel={() => setActiveSubScreen('none')}
        onSuccess={() => setActiveSubScreen('none')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceContainer} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <MaterialIcons name="settings" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>CÀI ĐẶT & TÀI KHOẢN NÔNG DÂN</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainWrapper}>
          {/* User Profile Mini Banner */}
          <TouchableOpacity
            style={styles.profileBanner}
            onPress={() => setActiveSubScreen('profile')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="account-circle" size={48} color={colors.primary} />
            <View style={styles.profileTextWrapper}>
              <Text style={styles.profileName}>{user.fullName || 'Nông dân nuôi tôm'}</Text>
              <Text style={styles.profilePhone}>{user.phoneNumber}</Text>
              <View style={styles.roleBadgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>KỸ THUẬT VIÊN / NÔNG DÂN</Text>
                </View>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          {/* Account & Security Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>TÀI KHOẢN & BẢO MẬT</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('profile')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="person" size={20} color={colors.primary} />
                <Text style={styles.menuItemText}>Hồ sơ cá nhân Nông dân</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('changePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="lock" size={20} color={colors.primary} />
                <Text style={styles.menuItemText}>Đổi mật khẩu truy cập</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>
          </View>

          {/* Telemetry & Push Notification Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>THÔNG BÁO & CẢNH BÁO AO TÔM</Text>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="notifications-active" size={20} color={colors.secondary} />
                <Text style={styles.menuItemText}>Cảnh báo Oxy, pH, Nhiệt độ Khẩn</Text>
              </View>
              <Text style={styles.settingValueText}>Đã bật Push</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="router" size={20} color={colors.onSurfaceVariant} />
                <Text style={styles.menuItemText}>Đồng bộ dữ liệu Cảm biến Telemetry</Text>
              </View>
              <Text style={styles.settingValueText}>Thời gian thực</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={20} color={colors.onErrorContainer} />
            <Text style={styles.logoutText}>ĐĂNG XUẤT TÀI KHOẢN</Text>
          </TouchableOpacity>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>PondLogs Farmer Mobile App v2.8.4</Text>
            <Text style={styles.footerSubText}>Hệ thống Giám sát Đầm tôm thông minh</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  mainWrapper: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  profileBanner: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileTextWrapper: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  profilePhone: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontFamily: 'JetBrains Mono',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  roleBadgeText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  sectionHeader: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  settingValueText: {
    ...typography.bodySm,
    color: colors.secondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: 16,
  },
  logoutBtn: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.onErrorContainer,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    ...typography.headlineSm,
    color: colors.onErrorContainer,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  footerText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  footerSubText: {
    ...typography.labelSm,
    color: colors.outline,
  },
});
