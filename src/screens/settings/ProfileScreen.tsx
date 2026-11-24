import React, { useEffect, useState } from 'react';
import {
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
import { Gender } from '../../services/authApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProfileThunk, updateProfileThunk } from '../../store/slices/userSlice';
import { showToast } from '../../store/slices/uiSlice';
import { DaylightCard, PrimaryButton, useFontScale } from '../../components/ui';

interface ProfileScreenProps {
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const user = useAppSelector((state) => state.user);

  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [gender, setGender] = useState<Gender | ''>(user.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    user.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setGender(user.gender || '');
    setDateOfBirth(user.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : '');
  }, [user]);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!fullName.trim()) {
      setErrorMsg('Họ và tên không được để trống.');
      return;
    }
    if (dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      setErrorMsg('Ngày sinh phải theo định dạng YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    const res = await dispatch(
      updateProfileThunk({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        gender: gender ? (gender as Gender) : undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
      })
    );
    setSaving(false);

    if (updateProfileThunk.fulfilled.match(res)) {
      dispatch(showToast({ text: 'Cập nhật hồ sơ cá nhân thành công!', tone: 'safe' }));
      onBack?.();
    } else {
      setErrorMsg((res.payload as string) || 'Không thể cập nhật thông tin.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Quay lại">
          <MaterialIcons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { fontSize: fs(18) }]}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: touchTargets.min }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <DaylightCard padding={18} style={styles.card}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Số điện thoại đăng nhập (cố định)</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{user.phoneNumber || '--'}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor={colors.subtle}
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email nhận cảnh báo</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={colors.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderRow}>
              {(
                [
                  { key: Gender.MALE, label: 'Nam' },
                  { key: Gender.FEMALE, label: 'Nữ' },
                  { key: Gender.OTHER, label: 'Khác' },
                ] as const
              ).map((g) => {
                const active = gender === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGender(g.key)}
                    style={[styles.genderBtn, active && styles.genderBtnActive]}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="1990-05-20"
              placeholderTextColor={colors.subtle}
              style={[styles.input, { fontSize: fs(15) }]}
            />
          </View>

          <PrimaryButton
            title="Lưu hồ sơ cá nhân"
            iconName="save"
            loading={saving}
            onPress={handleSave}
          />
        </DaylightCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    gap: 14,
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
  readOnlyBox: {
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  readOnlyText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
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
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  genderText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.muted,
  },
  genderTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
});
