import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { authApi, Role } from '../../services/authApi';
import { useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/uiSlice';
import { BottomSheetModal, PrimaryButton, useFontScale } from '../ui';

export interface OtpForgotModalProps {
  visible: boolean;
  initialMode: 'forgot' | 'register';
  prefillPhone?: string;
  onClose: () => void;
}

export const OtpForgotModal: React.FC<OtpForgotModalProps> = ({
  visible,
  initialMode,
  prefillPhone = '',
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const [mode, setMode] = useState<'forgot' | 'register'>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Shared recovery / registration fields
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(prefillPhone);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>(Role.FARMER);

  // OTP & Password
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [managerGuidance, setManagerGuidance] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setStep(1);
      setChannel('phone');
      setPhoneNumber(prefillPhone || '');
      setEmail('');
      setFullName('');
      setRole(Role.FARMER);
      setOtp('');
      setDevOtpHint(null);
      setCountdown(0);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setManagerGuidance(false);
    }
  }, [visible, initialMode, prefillPhone]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const identifierText =
    mode === 'forgot' && channel === 'email' ? email.trim() : phoneNumber.trim();

  const handleSendStep1 = async () => {
    setErrorMsg(null);
    if (mode === 'forgot') {
      if (channel === 'phone' && !/^[0-9]{10,11}$/.test(phoneNumber.trim())) {
        setErrorMsg('Số điện thoại phải gồm 10–11 chữ số.');
        return;
      }
      if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ.');
        return;
      }

      setLoading(true);
      try {
        const res = await authApi.forgotPassword(
          channel === 'email' ? { email: email.trim() } : { phoneNumber: phoneNumber.trim() }
        );
        setDevOtpHint(res?.otp || null);
        setCountdown(60);
        setStep(2);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Không thể gửi mã OTP đặt lại mật khẩu.';
        setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Register mode
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên.');
      return;
    }
    if (!/^[0-9]{10,11}$/.test(phoneNumber.trim())) {
      setErrorMsg('Số điện thoại phải gồm 10–11 chữ số.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp({
        phoneNumber: phoneNumber.trim(),
        purpose: 'REGISTER',
      });
      setDevOtpHint(res?.otp || null);
      setCountdown(60);
      setStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi mã OTP qua SMS.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    await handleSendStep1();
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg('Mã OTP phải bao gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      const purpose = mode === 'forgot' ? 'RESET_PASSWORD' : 'REGISTER';
      await authApi.verifyOtp(
        mode === 'forgot' && channel === 'email'
          ? { email: email.trim(), otp: cleanOtp, purpose }
          : { phoneNumber: phoneNumber.trim(), otp: cleanOtp, purpose }
      );

      if (mode === 'forgot') {
        setStep(3);
      } else {
        // Complete registration right after OTP verification
        try {
          await authApi.register({
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim(),
            role,
          });
          dispatch(
            showToast({
              text: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
              tone: 'safe',
            })
          );
          onClose();
        } catch (regErr: any) {
          const status = regErr?.response?.status;
          if (status === 401 || status === 403) {
            setManagerGuidance(true);
            setStep(3);
          } else {
            const msg = regErr?.response?.data?.message || 'Không thể hoàn tất đăng ký tài khoản.';
            setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
          }
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(
        channel === 'email'
          ? { email: email.trim(), newPassword }
          : { phoneNumber: phoneNumber.trim(), newPassword }
      );
      dispatch(
        showToast({
          text: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay!',
          tone: 'safe',
        })
      );
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể đặt lại mật khẩu.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const title =
    step === 2
      ? 'Xác thực mã OTP'
      : mode === 'forgot'
      ? 'Quên mật khẩu'
      : 'Đăng ký bằng mã OTP';

  const subtitle =
    step === 2
      ? `Mã 6 số đã gửi tới ${identifierText}`
      : mode === 'forgot'
      ? 'Nhập SĐT hoặc Email để nhận mã khôi phục tài khoản'
      : 'Xác thực số điện thoại của bạn với hệ thống AquaSense';

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
      <View style={styles.modeTabs}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setMode('forgot');
            setStep(1);
            setErrorMsg(null);
            setManagerGuidance(false);
          }}
          style={[styles.modeTab, mode === 'forgot' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, mode === 'forgot' && styles.modeTabTextActive]}>
            Quên mật khẩu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setMode('register');
            setStep(1);
            setErrorMsg(null);
            setManagerGuidance(false);
          }}
          style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
            Đăng ký tài khoản
          </Text>
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
          <Text style={[styles.errorText, { fontSize: fs(13) }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {step === 1 && mode === 'forgot' && (
        <View style={styles.formBlock}>
          <View style={styles.channelRow}>
            <TouchableOpacity
              onPress={() => setChannel('phone')}
              style={[styles.chipBtn, channel === 'phone' && styles.chipBtnActive]}
            >
              <Text style={[styles.chipText, channel === 'phone' && styles.chipTextActive]}>
                Số điện thoại
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChannel('email')}
              style={[styles.chipBtn, channel === 'email' && styles.chipBtnActive]}
            >
              <Text style={[styles.chipText, channel === 'email' && styles.chipTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {channel === 'phone' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Số điện thoại đăng ký</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Ví dụ: 0908123456"
                placeholderTextColor={colors.subtle}
                keyboardType="phone-pad"
                style={[styles.input, { fontSize: fs(15) }]}
              />
            </View>
          ) : (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Địa chỉ Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Ví dụ: farmer@example.com"
                placeholderTextColor={colors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { fontSize: fs(15) }]}
              />
            </View>
          )}

          <PrimaryButton
            title="Gửi mã OTP xác thực"
            iconName="send"
            loading={loading}
            onPress={handleSendStep1}
          />
        </View>
      )}

      {step === 1 && mode === 'register' && (
        <View style={styles.formBlock}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn An"
              placeholderTextColor={colors.subtle}
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="0908123456"
              placeholderTextColor={colors.subtle}
              keyboardType="phone-pad"
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email nhận thông báo</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tenban@example.com"
              placeholderTextColor={colors.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Vai trò mong muốn</Text>
            <View style={styles.channelRow}>
              <TouchableOpacity
                onPress={() => setRole(Role.FARMER)}
                style={[styles.chipBtn, role === Role.FARMER && styles.chipBtnActive]}
              >
                <Text style={[styles.chipText, role === Role.FARMER && styles.chipTextActive]}>
                  Kỹ thuật viên / Nông dân
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole(Role.MANAGER)}
                style={[styles.chipBtn, role === Role.MANAGER && styles.chipBtnActive]}
              >
                <Text style={[styles.chipText, role === Role.MANAGER && styles.chipTextActive]}>
                  Quản lý trại
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <PrimaryButton
            title="Gửi mã OTP qua SMS"
            iconName="sms"
            loading={loading}
            onPress={handleSendStep1}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.formBlock}>
          {devOtpHint ? (
            <View style={styles.devOtpBox}>
              <MaterialIcons name="info-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.devOtpText}>Mã OTP thử nghiệm: {devOtpHint}</Text>
            </View>
          ) : null}

          <View style={styles.otpVisualRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const char = otp[i] || '';
              const isFocusedSlot = i === otp.length && otp.length < 6;
              return (
                <View
                  key={i}
                  style={[
                    styles.otpSlot,
                    char ? styles.otpSlotFilled : null,
                    isFocusedSlot ? styles.otpSlotActive : null,
                  ]}
                >
                  <Text style={styles.otpChar}>{char || '•'}</Text>
                </View>
              );
            })}
          </View>

          <TextInput
            value={otp}
            onChangeText={(txt) => setOtp(txt.replace(/\D/g, '').slice(0, 6))}
            placeholder="Nhập 6 chữ số OTP"
            placeholderTextColor={colors.subtle}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, styles.otpInputField]}
          />

          <View style={styles.otpMetaRow}>
            <TouchableOpacity disabled={countdown > 0} onPress={handleResendOtp}>
              <Text style={[styles.resendText, countdown > 0 && { color: colors.muted }]}>
                {countdown > 0 ? `Gửi lại mã sau ${formatCountdown(countdown)}` : 'Gửi lại mã OTP'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.changeInfoText}>Đổi thông tin</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoNote}>
            <MaterialIcons name="info-outline" size={16} color={colors.muted} />
            <Text style={styles.infoNoteText}>
              {mode === 'forgot'
                ? 'Sau khi xác thực OTP, bạn có thể đặt mật khẩu mới ngay.'
                : 'Tài khoản mới cần Quản lý trại phê duyệt kích hoạt sau khi xác thực OTP.'}
            </Text>
          </View>

          <PrimaryButton
            title="Xác nhận mã OTP →"
            loading={loading}
            onPress={handleVerifyOtp}
          />
        </View>
      )}

      {step === 3 && mode === 'forgot' && (
        <View style={styles.formBlock}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mật khẩu mới (tối thiểu 8 ký tự)</Text>
            <View style={styles.passRow}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPass}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={colors.subtle}
                style={styles.passInput}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <MaterialIcons
                  name={showPass ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPass}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={colors.subtle}
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>

          <PrimaryButton
            title="Hoàn tất đặt lại mật khẩu"
            iconName="check-circle"
            loading={loading}
            onPress={handleResetPassword}
          />
        </View>
      )}

      {step === 3 && mode === 'register' && managerGuidance && (
        <View style={styles.guidanceCard}>
          <View style={styles.guidanceHead}>
            <MaterialIcons name="verified-user" size={24} color={colors.primary} />
            <Text style={[styles.guidanceTitle, { fontSize: fs(16) }]}>
              Đã xác thực SĐT — Chờ Quản lý trại kích hoạt
            </Text>
          </View>
          <Text style={[styles.guidanceBody, { fontSize: fs(14) }]}>
            Tài khoản mới cần được Quản lý trại hoặc Quản trị viên phê duyệt cấp quyền. Số điện thoại{' '}
            <Text style={{ fontFamily: fontFamily.bold }}>{phoneNumber}</Text> đã xác thực OTP — vui
            lòng liên hệ Quản lý trại để kích hoạt tài khoản cho bạn.
          </Text>
          <PrimaryButton title="Quay lại đăng nhập" onPress={onClose} />
        </View>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.control,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.card,
  },
  modeTabText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
  modeTabTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  errorBanner: {
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
  formBlock: {
    gap: 12,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipBtn: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chipBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  chipTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  fieldGroup: {
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
    paddingVertical: 10,
    fontFamily: fontFamily.regular,
    color: colors.ink,
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
  },
  passInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.ink,
  },
  eyeBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    padding: 10,
  },
  devOtpText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  otpVisualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpSlot: {
    flex: 1,
    height: 52,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSlotFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  otpSlotActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpChar: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  otpInputField: {
    textAlign: 'center',
    letterSpacing: 6,
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  otpMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resendText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  changeInfoText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  infoNoteText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  guidanceCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    borderRadius: radii.card,
    padding: 16,
    gap: 12,
  },
  guidanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guidanceTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  guidanceBody: {
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 21,
  },
});
