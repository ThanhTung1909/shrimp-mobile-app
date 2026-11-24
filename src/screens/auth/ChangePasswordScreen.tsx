import React, { useEffect, useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { authApi } from '../../services/authApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { changePasswordThunk, logoutThunk } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/uiSlice';
import { DaylightCard, OtpCodeInput, PrimaryButton, useFontScale } from '../../components/ui';

export interface ChangePasswordScreenProps {
  isForced?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  isForced = true,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const phoneNumber = useAppSelector((state) => state.user.phoneNumber || state.auth.userPhone);
  const { isLoading } = useAppSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setErrorMsg('Không tìm thấy số điện thoại tài khoản.');
      return;
    }
    setErrorMsg(null);
    setSendingOtp(true);
    try {
      const res = await authApi.sendOtp({
        phoneNumber,
        purpose: 'CHANGE_PASSWORD',
      });
      setDevOtpHint(res?.otp || null);
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể gửi mã OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường mật khẩu.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải dài tối thiểu 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã OTP xác nhận.');
      return;
    }

    const res = await dispatch(
      changePasswordThunk({
        currentPassword,
        newPassword,
        otp: cleanOtp,
      })
    );

    if (changePasswordThunk.fulfilled.match(res)) {
      dispatch(showToast({ text: 'Đổi mật khẩu thành công!', tone: 'safe' }));
      onSuccess?.();
    } else {
      setErrorMsg((res.payload as string) || 'Đổi mật khẩu thất bại.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <DaylightCard padding={20} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <MaterialIcons name="security" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.title, { fontSize: fs(20) }]}>Đổi mật khẩu tài khoản</Text>
              <Text style={[styles.sub, { fontSize: fs(13) }]}>
                {isForced
                  ? 'Vì lý do bảo mật, bạn cần đổi mật khẩu lần đầu và xác nhận mã OTP trước khi vào hệ thống.'
                  : 'Xác thực mã OTP qua SMS để cập nhật mật khẩu mới an toàn.'}
              </Text>
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu hiện tại</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu mới (tối thiểu 8 ký tự)</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.label}>Mã OTP ({phoneNumber || '--'})</Text>
                <TouchableOpacity
                  disabled={countdown > 0 || sendingOtp}
                  onPress={handleSendOtp}
                  style={[styles.otpBtn, (countdown > 0 || sendingOtp) && { opacity: 0.55 }]}
                >
                  <Text style={styles.otpBtnText}>
                    {sendingOtp ? 'Đang gửi' : countdown > 0 ? `Còn ${countdown}s` : 'Gửi mã OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
              <OtpCodeInput value={otp} onChange={setOtp} disabled={isLoading} />
              {devOtpHint ? (
                <Text style={styles.devOtpHint}>Mã OTP thử nghiệm: {devOtpHint}</Text>
              ) : null}
            </View>

            <PrimaryButton
              title="Xác nhận đổi mật khẩu"
              iconName="check-circle"
              loading={isLoading}
              onPress={handleSubmit}
            />

            <PrimaryButton
              title={isForced ? 'Đăng xuất khỏi phiên hiện tại' : 'Quay lại'}
              variant="ghost"
              compact
              onPress={() => (isForced ? dispatch(logoutThunk()) : onCancel?.())}
            />
          </DaylightCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    gap: 14,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 13,
    color: colors.dangerText,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  input: {
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.ink,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  devOtpHint: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
});
