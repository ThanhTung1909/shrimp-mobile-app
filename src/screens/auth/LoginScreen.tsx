import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setRememberDevice, setUserPhone, loginSuccess } from '../../store/slices/authSlice';

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userPhone, rememberDevice } = useAppSelector((state) => state.auth);

  const [phone, setPhone] = useState(userPhone || '0987654321');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = () => {
    setIsLoggingIn(true);
    dispatch(setUserPhone(phone));
    setTimeout(() => {
      setIsLoggingIn(false);
      dispatch(loginSuccess());
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceContainer} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtle Ambient Farm Status Ribbon */}
        <View style={styles.statusRibbon}>
          <View style={styles.ribbonLeft}>
            <View style={styles.onlineDot} />
            <Text style={styles.ribbonText}>NÚT GATEWAY: HOẠT ĐỘNG</Text>
          </View>
          <View style={styles.ribbonRight}>
            <MaterialIcons name="lock" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.ribbonText}>BẢO MẬT TLS 1.3</Text>
          </View>
        </View>

        <View style={styles.mainWrapper}>
          {/* Sign In Module Card */}
          <View style={styles.card}>
            {/* Top Light Blue Header Container */}
            <View style={styles.brandHeader}>
              <View style={styles.brandLogoBox}>
                <MaterialCommunityIcons name="waves" size={34} color={colors.primary} />
                <View style={styles.wifiBadge}>
                  <MaterialIcons name="wifi" size={10} color={colors.onSecondary} />
                </View>
              </View>
              <Text style={styles.brandTitle}>PondLogs</Text>
              <Text style={styles.brandSubtitle}>
                Giám sát Telemetry & Quản lý Đầm tôm
              </Text>
            </View>

            {/* Sign In Form Body */}
            <View style={styles.formBody}>
              {/* Field: Phone Number */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>SỐ ĐIỆN THOẠI HỆ THỐNG</Text>
                  <View style={styles.ssoBadge}>
                    <MaterialIcons name="badge" size={12} color={colors.secondary} />
                    <Text style={styles.ssoBadgeText}>SSO Kỹ thuật</Text>
                  </View>
                </View>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="smartphone"
                    size={20}
                    color={colors.onSurfaceVariant}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Ví dụ: 0912345678"
                    placeholderTextColor={colors.outline}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Field: Password */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>MẬT KHẨU TRUY CẬP</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="vpn-key"
                    size={20}
                    color={colors.onSurfaceVariant}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.monoInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nhập mật khẩu bảo mật"
                    placeholderTextColor={colors.outline}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={18}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Checkbox: Remember Device */}
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => dispatch(setRememberDevice(!rememberDevice))}
              >
                <View style={styles.checkboxOuter}>
                  {rememberDevice && (
                    <MaterialIcons name="check" size={14} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Ghi nhớ thiết bị này trong 30 ngày</Text>
              </TouchableOpacity>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.signInBtn, isLoggingIn && styles.signInBtnDisabled]}
                onPress={handleSignIn}
                activeOpacity={0.9}
                disabled={isLoggingIn}
              >
                <Text style={styles.signInBtnText}>
                  {isLoggingIn ? 'Đang kết nối Nút SCADA...' : 'Đăng nhập Trung tâm Telemetry'}
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
              </TouchableOpacity>

              {/* Industrial Quick Auth Helpers */}
              <View style={styles.quickAuthRow}>
                <TouchableOpacity style={styles.quickAuthBtn} activeOpacity={0.7}>
                  <MaterialIcons name="qr-code-scanner" size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.quickAuthText}>Quét mã QR Trạm</Text>
                </TouchableOpacity>
                <View style={styles.quickAuthDivider} />
                <TouchableOpacity style={styles.quickAuthBtn} activeOpacity={0.7}>
                  <MaterialIcons name="nfc" size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.quickAuthText}>Chạm thẻ NFC</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Farm Infrastructure Security Note Card */}
          <View style={styles.securityCard}>
            <MaterialIcons
              name="shield"
              size={18}
              color={colors.secondary}
              style={styles.securityIcon}
            />
            <Text style={styles.securityText}>
              Quyền truy cập công nghiệp hạn chế cho kỹ sư trại giống, đầm tôm và trung tâm điều coordination. Mọi truy cập không hợp lệ đều được ghi nhận bởi SCADA Gateway #4.
            </Text>
          </View>

          {/* Footer Meta */}
          <View style={styles.footer}>
            <View style={styles.footerStatusRow}>
              <View style={styles.footerGreenDot} />
              <Text style={styles.footerStatusText}>PondLogs Mobile v2.8.4</Text>
              <Text style={styles.footerDotSeparator}>•</Text>
              <Text style={styles.footerStatusText}>IoT Gateway Sẵn sàng</Text>
            </View>
            <View style={styles.footerLinksRow}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Tài liệu Hoạt động Offline</Text>
              </TouchableOpacity>
              <Text style={styles.footerDotSeparator}>•</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Giao thức Quạt nước Khẩn cấp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statusRibbon: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  ribbonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ribbonText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  mainWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  brandHeader: {
    backgroundColor: 'rgba(212, 227, 255, 0.4)',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  brandLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  wifiBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.headlineXlMobile,
    fontWeight: '700',
    color: colors.primary,
  },
  brandSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  formBody: {
    padding: 16,
    gap: 14,
    backgroundColor: colors.surfaceContainerLowest,
  },
  fieldContainer: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  ssoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ssoBadgeText: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  forgotText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  monoInput: {
    ...typography.telemetryValueMd,
  },
  eyeBtn: {
    padding: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    ...typography.bodySm,
    color: colors.onSurface,
  },
  signInBtn: {
    width: '100%',
    marginTop: 4,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signInBtnDisabled: {
    opacity: 0.8,
  },
  signInBtnText: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
  quickAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 4,
  },
  quickAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickAuthText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  quickAuthDivider: {
    height: 12,
    width: 1,
    backgroundColor: colors.outlineVariant,
  },
  securityCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  securityIcon: {
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  footerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  footerStatusText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  footerDotSeparator: {
    ...typography.labelSm,
    color: colors.outline,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    ...typography.labelSm,
    color: colors.outline,
    textDecorationLine: 'underline',
  },
});
