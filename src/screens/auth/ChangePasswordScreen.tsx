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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { changePasswordThunk, logoutThunk } from '../../store/slices/authSlice';

interface ChangePasswordScreenProps {
  isForced?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  isForced = false,
  onSuccess,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setValidationError(null);

    if (!currentPassword) {
      setValidationError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setValidationError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword === currentPassword) {
      setValidationError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp');
      return;
    }

    const result = await dispatch(
      changePasswordThunk({
        currentPassword,
        newPassword,
      })
    );

    if (changePasswordThunk.fulfilled.match(result)) {
      Alert.alert('Thành công', 'Đổi mật khẩu tài khoản thành công!');
      if (onSuccess) onSuccess();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceContainer} />
      <View style={styles.headerBar}>
        {!isForced && onCancel ? (
          <TouchableOpacity onPress={onCancel} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>ĐỔI MẬT KHẨU TÀI KHOẢN</Text>
        <TouchableOpacity
          onPress={() => dispatch(logoutThunk())}
          style={styles.logoutHeaderBtn}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          {isForced && (
            <View style={styles.forcedBanner}>
              <MaterialIcons name="warning" size={22} color={colors.onTertiaryContainer} />
              <View style={styles.forcedTextWrapper}>
                <Text style={styles.forcedTitle}>Bắt buộc thay đổi mật khẩu lần đầu</Text>
                <Text style={styles.forcedSub}>
                  Hệ thống yêu cầu cập nhật mật khẩu mới để đảm bảo an toàn truy cập trạm điều khiển SCADA.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="security" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Thiết lập Mật khẩu mới</Text>
            </View>

            <View style={styles.formBody}>
              {(validationError || error) && (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error-outline" size={18} color={colors.error} />
                  <Text style={styles.errorBannerText}>{validationError || error}</Text>
                </View>
              )}

              {/* Mật khẩu hiện tại */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>MẬT KHẨU HIỆN TẠI</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={[styles.input, styles.monoInput]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Nhập mật khẩu hiện tại"
                    placeholderTextColor={colors.outline}
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                    <MaterialIcons
                      name={showCurrent ? 'visibility' : 'visibility-off'}
                      size={18}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mật khẩu mới */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>MẬT KHẨU MỚI (TỐI THIỂU 6 KÝ TỰ)</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="vibration" size={20} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={[styles.input, styles.monoInput]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor={colors.outline}
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                    <MaterialIcons
                      name={showNew ? 'visibility' : 'visibility-off'}
                      size={18}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Xác nhận mật khẩu mới */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>XÁC NHẬN MẬT KHẨU MỚI</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={[styles.input, styles.monoInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor={colors.outline}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    <MaterialIcons
                      name={showConfirm ? 'visibility' : 'visibility-off'}
                      size={18}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleChangePassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={20} color={colors.onPrimary} />
                    <Text style={styles.submitBtnText}>CẬP NHẬT MẬT KHẨU</Text>
                  </>
                )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '700',
  },
  logoutHeaderBtn: {
    padding: 4,
  },
  container: {
    flex: 1,
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
  forcedBanner: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.onErrorContainer,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  forcedTextWrapper: {
    flex: 1,
    gap: 2,
  },
  forcedTitle: {
    ...typography.headlineSm,
    color: colors.onErrorContainer,
    fontWeight: '700',
  },
  forcedSub: {
    ...typography.bodySm,
    color: colors.onSurface,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  cardTitle: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  formBody: {
    padding: 16,
    gap: 14,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBannerText: {
    ...typography.bodySm,
    color: '#B91C1C',
    flex: 1,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 12,
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
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
});
