import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { authApi } from '../../services/authApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { changePasswordThunk } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/uiSlice';
import { BottomSheetModal, PrimaryButton, useFontScale } from '../ui';

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setCountdown(0);
      setDevOtpHint(null);
      setErrorMsg(null);
    }
  }, [visible]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setErrorMsg('Không xác định được số điện thoại tài khoản.');
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
      const msg = err?.response?.data?.message || 'Không thể gửi mã OTP.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!currentPassword || !newPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số mã OTP xác nhận.');
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
      dispatch(showToast({ text: 'Đổi mật khẩu tài khoản thành công!', tone: 'safe' }));
      onSuccess?.();
      onClose();
    } else {
      setErrorMsg((res.payload as string) || 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hoặc OTP.');
    }
  };

  const maskedPhone = phoneNumber
    ? `${phoneNumber.slice(0, 4)} ••• ${phoneNumber.slice(-3)}`
    : '--';

  const hasLength = newPassword.length >= 8;
  const hasLetterAndDigit = /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Đổi mật khẩu tài khoản"
      subtitle="Yêu cầu xác thực OTP để bảo vệ tài khoản trại nuôi"
    >
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
          <Text style={[styles.errorText, { fontSize: fs(13) }]}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { fontSize: fs(13) }]}>Mật khẩu hiện tại</Text>
        <View style={styles.inputBox}>
          <MaterialIcons name="lock-outline" size={18} color={colors.muted} />
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            placeholder="Nhập mật khẩu hiện tại"
            placeholderTextColor={colors.subtle}
            style={[styles.inputField, { fontSize: fs(15) }]}
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
            <MaterialIcons
              name={showCurrent ? 'visibility' : 'visibility-off'}
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { fontSize: fs(13) }]}>Mật khẩu mới</Text>
        <View style={[styles.inputBox, styles.inputBoxHighlight]}>
          <MaterialIcons name="lock-reset" size={18} color={colors.primary} />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            placeholder="Nhập mật khẩu mới"
            placeholderTextColor={colors.subtle}
            style={[styles.inputField, { fontSize: fs(15) }]}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
            <MaterialIcons
              name={showNew ? 'visibility' : 'visibility-off'}
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.checkRow}>
          <MaterialIcons
            name={hasLength ? 'check-circle' : 'radio-button-unchecked'}
            size={15}
            color={hasLength ? colors.safeText : colors.muted}
          />
          <Text style={[styles.checkText, hasLength && { color: colors.safeText }]}>
            Tối thiểu 8 ký tự{hasLetterAndDigit ? ' · Đã gồm chữ và số' : ', nên gồm chữ và số'}
          </Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { fontSize: fs(13) }]}>Xác nhận mật khẩu mới</Text>
        <View style={styles.inputBox}>
          <MaterialIcons name="check-circle-outline" size={18} color={colors.muted} />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showNew}
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor={colors.subtle}
            style={[styles.inputField, { fontSize: fs(15) }]}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.otpHeaderRow}>
          <Text style={[styles.label, { fontSize: fs(13) }]}>Mã OTP 6 số xác nhận</Text>
          {countdown > 0 ? (
            <View style={styles.timerChip}>
              <Text style={styles.timerChipText}>Còn {countdown}s</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.otpActionRow}>
          <TextInput
            value={otp}
            onChangeText={(txt) => setOtp(txt.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="482910"
            placeholderTextColor={colors.subtle}
            style={styles.otpInput}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={countdown > 0 || sendingOtp}
            onPress={handleSendOtp}
            style={[styles.sendOtpBtn, (countdown > 0 || sendingOtp) && styles.sendOtpBtnDisabled]}
          >
            <MaterialIcons name="send" size={16} color={colors.primaryDark} />
            <Text style={styles.sendOtpText}>
              {sendingOtp ? 'Đang gửi...' : countdown > 0 ? `${countdown}s` : 'Gửi mã OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.phoneHint}>Gửi mã xác nhận tới {maskedPhone}</Text>
        {devOtpHint ? (
          <Text style={styles.devOtpHint}>Mã OTP thử nghiệm: {devOtpHint}</Text>
        ) : null}
      </View>

      <PrimaryButton
        title="Xác nhận đổi mật khẩu"
        iconName="verified-user"
        loading={isLoading}
        onPress={handleSubmit}
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
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
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    paddingLeft: 12,
    gap: 8,
  },
  inputBoxHighlight: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  inputField: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    paddingVertical: 10,
  },
  eyeBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  timerChipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  otpActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: 3,
  },
  sendOtpBtn: {
    minHeight: touchTargets.min,
    paddingHorizontal: 14,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sendOtpBtnDisabled: {
    opacity: 0.5,
  },
  sendOtpText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  phoneHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  devOtpHint: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
});
