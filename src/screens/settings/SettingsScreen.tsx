import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { Role } from '../../services/authApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProfileThunk } from '../../store/slices/userSlice';
import { toggleLargeTextMode } from '../../store/slices/uiSlice';
import { AquaToggleSwitch, DaylightCard, useFontScale } from '../../components/ui';
import { ChangePasswordModal } from '../../components/modals/ChangePasswordModal';
import { LogoutConfirmModal } from '../../components/modals/LogoutConfirmModal';

function getInitials(name: string): string {
  if (!name?.trim()) return 'AS';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleLabel(role: Role | null): string {
  if (role === Role.ADMIN) return 'Quản trị viên hệ thống';
  if (role === Role.MANAGER) return 'Quản lý trại nuôi';
  return 'Kỹ thuật viên / Nông dân';
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { fs, largeTextMode } = useFontScale();

  const user = useAppSelector((state) => state.user);
  const authRole = useAppSelector((state) => state.auth.role);
  const { selectedPondId, farms } = useAppSelector((state) => state.pond);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutDefaultAll, setLogoutDefaultAll] = useState(false);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  const effectiveRole = user.role || authRole;
  const farmLabel = farms[0]?.farmName ? ` · ${farms[0].farmName}` : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: fs(21) }]}>Cá nhân & Cài đặt</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DaylightCard padding={16} style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={[styles.userName, { fontSize: fs(18) }]} numberOfLines={1}>
                {user.fullName || 'Thành viên AquaSense'}
              </Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{getRoleLabel(effectiveRole)}</Text>
              </View>
              <Text style={[styles.phoneMeta, { fontSize: fs(13) }]} numberOfLines={1}>
                {user.phoneNumber || '--'}
                {farmLabel}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileDetail')}
            style={styles.editProfileBtn}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
            <Text style={[styles.editProfileText, { fontSize: fs(14) }]}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </DaylightCard>

        <Text style={[styles.sectionLabel, { fontSize: fs(12) }]}>
          CÀI ĐẶT AO NUÔI & THÔNG BÁO
        </Text>
        <DaylightCard padding={0}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('ThresholdsNotifications', {
                pondId: selectedPondId,
                initialSection: 'thresholds',
              })
            }
            style={styles.menuRow}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="tune" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={[styles.menuTitle, { fontSize: fs(15) }]}>
                Cài đặt ngưỡng an toàn ao nuôi
              </Text>
              <Text style={[styles.menuSub, { fontSize: fs(12) }]}>
                Min/Max DO, pH, Nhiệt độ, Độ mặn từng ao
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('ThresholdsNotifications', {
                pondId: selectedPondId,
                initialSection: 'notifications',
              })
            }
            style={styles.menuRow}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="notifications-active" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={[styles.menuTitle, { fontSize: fs(15) }]}>
                Kênh nhận cảnh báo
              </Text>
              <Text style={[styles.menuSub, { fontSize: fs(12) }]}>
                Thông báo đẩy (Push FCM), SMS khẩn cấp, Email
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </TouchableOpacity>
        </DaylightCard>

        <Text style={[styles.sectionLabel, { fontSize: fs(12) }]}>
          HIỂN THỊ NGOÀI TRỜI & BẢO MẬT
        </Text>
        <DaylightCard padding={0}>
          <View style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <MaterialIcons name="wb-sunny" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={[styles.menuTitle, { fontSize: fs(15) }]}>
                Chế độ chữ lớn dễ đọc (+15%)
              </Text>
              <Text style={[styles.menuSub, { fontSize: fs(12) }]}>
                Phóng to thông số khi quan sát ngoài bờ ao
              </Text>
            </View>
            <AquaToggleSwitch
              value={largeTextMode}
              onValueChange={() => dispatch(toggleLargeTextMode())}
              accessibilityLabel="Bật chế độ chữ lớn"
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setChangePasswordOpen(true)}
            style={styles.menuRow}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="lock-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={[styles.menuTitle, { fontSize: fs(15) }]}>
                Đổi mật khẩu tài khoản
              </Text>
              <Text style={[styles.menuSub, { fontSize: fs(12) }]}>
                Xác thực qua mã OTP bảo vệ tài khoản
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setLogoutDefaultAll(true);
              setLogoutModalOpen(true);
            }}
            style={styles.menuRow}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="devices" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={[styles.menuTitle, { fontSize: fs(15) }]}>
                Đăng xuất trên thiết bị khác
              </Text>
              <Text style={[styles.menuSub, { fontSize: fs(12) }]}>
                Thu hồi toàn bộ phiên đăng nhập đang hoạt động
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </TouchableOpacity>
        </DaylightCard>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {
            setLogoutDefaultAll(false);
            setLogoutModalOpen(true);
          }}
          style={styles.logoutBtn}
        >
          <MaterialIcons name="logout" size={20} color={colors.dangerText} />
          <Text style={[styles.logoutText, { fontSize: fs(15) }]}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>AquaSense · Hệ thống giám sát ao tôm</Text>
      </ScrollView>

      <ChangePasswordModal
        visible={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <LogoutConfirmModal
        visible={logoutModalOpen}
        defaultAllDevices={logoutDefaultAll}
        onClose={() => setLogoutModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  identityCard: {
    gap: 14,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  identityInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  rolePillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  phoneMeta: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  editProfileBtn: {
    minHeight: 46,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editProfileText: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
  },
  sectionLabel: {
    fontFamily: fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: -4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: touchTargets.min + 12,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  menuSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  logoutBtn: {
    minHeight: touchTargets.cta,
    borderRadius: radii.control,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  logoutText: {
    fontFamily: fontFamily.bold,
    color: colors.dangerText,
  },
  versionText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});
