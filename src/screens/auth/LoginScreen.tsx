import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  clearAuthError,
  loginThunk,
  setRememberDevice,
  setUserPhone,
} from '../../store/slices/authSlice';
import { DaylightCard, PrimaryButton, useFontScale } from '../../components/ui';
import { OtpForgotModal } from '../../components/modals/OtpForgotModal';

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const { isLoading, error, userPhone, rememberDevice } = useAppSelector((state) => state.auth);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [otpModalMode, setOtpModalMode] = useState<'forgot' | 'register' | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    dispatch(clearAuthError());

    const cleanPhone = userPhone.trim();
    if (!cleanPhone || !password) {
      setLocalError('Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
      return;
    }
    if (!/^[0-9]{10,11}$/.test(cleanPhone)) {
      setLocalError('Số điện thoại không hợp lệ (10–11 chữ số).');
      return;
    }

    await dispatch(loginThunk({ phoneNumber: cleanPhone, password }));
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="waves" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { fontSize: fs(28) }]}>AquaSense</Text>
            <Text style={[styles.brandSub, { fontSize: fs(14) }]}>
              Đồng hành cùng người nuôi tôm mỗi ngày
            </Text>
          </View>

          <DaylightCard padding={18} style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { fontSize: fs(19) }]}>Đăng nhập tài khoản</Text>
              <View style={styles.secureBadge}>
                <Text style={styles.secureBadgeText}>Bảo mật 2 lớp</Text>
              </View>
            </View>

            {displayError ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
                <Text style={[styles.errorText, { fontSize: fs(13) }]}>{displayError}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontSize: fs(13) }]}>Số điện thoại</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="phone" size={20} color={colors.primary} />
                <TextInput
                  value={userPhone}
                  onChangeText={(txt) => dispatch(setUserPhone(txt))}
                  placeholder="0908123456"
                  placeholderTextColor={colors.subtle}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={[styles.input, { fontSize: fs(15) }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontSize: fs(13) }]}>Mật khẩu</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock-outline" size={20} color={colors.primary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor={colors.subtle}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { fontSize: fs(15) }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  accessibilityLabel="Ẩn/hiện mật khẩu"
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => dispatch(setRememberDevice(!rememberDevice))}
                style={styles.rememberWrap}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberDevice && styles.checkboxChecked,
                  ]}
                >
                  {rememberDevice ? <MaterialIcons name="check" size={15} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.rememberText, { fontSize: fs(13) }]}>
                  Ghi nhớ thiết bị này
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setOtpModalMode('forgot')}
                style={styles.forgotBtn}
              >
                <Text style={[styles.forgotText, { fontSize: fs(13) }]}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title="Đăng nhập"
              iconName="login"
              loading={isLoading}
              onPress={handleLogin}
            />
          </DaylightCard>

          <DaylightCard padding={16} style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <MaterialIcons name="verified-user" size={20} color={colors.primary} />
              <Text style={[styles.otpTitle, { fontSize: fs(15) }]}>
                Xác thực nhanh bằng mã OTP
              </Text>
            </View>
            <Text style={[styles.otpDesc, { fontSize: fs(13) }]}>
              Dùng khi quên mật khẩu hoặc xác thực số điện thoại để đăng ký tài khoản trại mới.
            </Text>
            <PrimaryButton
              title="Đăng ký tài khoản bằng mã OTP"
              iconName="sms"
              variant="secondary"
              onPress={() => setOtpModalMode('register')}
            />
          </DaylightCard>

          <DaylightCard padding={14} style={styles.statusFooterCard}>
            <View style={styles.pulseBadge}>
              <MaterialIcons name="sensors" size={20} color={colors.safeText} />
            </View>
            <View style={styles.statusFooterTextWrap}>
              <Text style={[styles.statusFooterTitle, { fontSize: fs(13) }]}>
                Kết nối trạm đo nước liên tục
              </Text>
              <Text style={[styles.statusFooterSub, { fontSize: fs(12) }]} numberOfLines={2}>
                Sẵn sàng nhận cảnh báo độ mặn, pH và Oxy hòa tan theo thời gian thực.
              </Text>
            </View>
          </DaylightCard>

          <Text style={[styles.copyright, { fontSize: fs(12) }]}>
            AquaSense Việt Nam · Hỗ trợ kỹ thuật trại nuôi
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpForgotModal
        visible={otpModalMode !== null}
        initialMode={otpModalMode || 'forgot'}
        prefillPhone={userPhone}
        onClose={() => setOtpModalMode(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#E5F5F6',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBE7E9',
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTitle: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  brandSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
  },
  formCard: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  secureBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  secureBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.control,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.dangerText,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: '#CFE5E7',
    paddingLeft: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.ink,
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  eyeBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  rememberText: {
    fontFamily: fontFamily.regular,
    color: colors.ink,
  },
  forgotBtn: {
    minHeight: 40,
    justifyContent: 'center',
  },
  forgotText: {
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  otpCard: {
    gap: 10,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otpTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  otpDesc: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    lineHeight: 20,
  },
  statusFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulseBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusFooterTextWrap: {
    flex: 1,
    gap: 2,
  },
  statusFooterTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  statusFooterSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
  copyright: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
});
