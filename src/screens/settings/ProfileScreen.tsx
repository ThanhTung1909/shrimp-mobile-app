import React, { useState, useEffect } from 'react';
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
import { updateProfileThunk, fetchProfileThunk } from '../../store/slices/userSlice';
import { Gender } from '../../services/authApi';

interface ProfileScreenProps {
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [gender, setGender] = useState<Gender | ''>(user.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setGender(user.gender || '');
    setDateOfBirth(user.dateOfBirth || '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống');
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      updateProfileThunk({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        gender: gender ? (gender as Gender) : undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
      })
    );
    setIsSubmitting(false);

    if (updateProfileThunk.fulfilled.match(result)) {
      Alert.alert('Thành công', 'Cập nhật thông tin cá nhân thành công!');
      setIsEditing(false);
    } else {
      Alert.alert('Lỗi', (result.payload as string) || 'Cập nhật thất bại');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceContainer} />
      {/* Header Bar */}
      <View style={styles.headerBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>HỒ SƠ NÔNG DÂN NUÔI TÔM</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editHeaderBtn}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={isEditing ? 'close' : 'edit'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          {/* User Profile Card Header */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBox}>
              <MaterialIcons name="account-circle" size={64} color={colors.primary} />
            </View>

            <Text style={styles.userName}>{user.fullName || 'Nông dân nuôi tôm'}</Text>

            {/* Role Badge */}
            <View style={styles.roleBadge}>
              <MaterialIcons name="engineering" size={14} color={colors.onPrimary} />
              <Text style={styles.roleBadgeText}>KỸ THUẬT VIÊN / NÔNG DÂN</Text>
            </View>

            <View style={styles.phoneBox}>
              <MaterialIcons name="phone" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.phoneText}>{user.phoneNumber}</Text>
            </View>
          </View>

          {/* Detailed Info / Edit Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Thông tin Cá nhân</Text>
            </View>

            <View style={styles.cardBody}>
              {/* Field 1: Full Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>HỌ VÀ TÊN NÔNG DÂN</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={colors.outline}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{user.fullName || 'Chưa cập nhật'}</Text>
                )}
              </View>

              {/* Field 2: Phone Number (Read-only) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>SỐ ĐIỆN THOẠI ĐĂNG NHẬP (CỐ ĐỊNH)</Text>
                <Text style={[styles.fieldValue, styles.readOnlyValue]}>{user.phoneNumber}</Text>
              </View>

              {/* Field 3: Email */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>EMAIL THÔNG BÁO</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Ví dụ: nongdan@shrimp.com"
                    placeholderTextColor={colors.outline}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{user.email || 'Chưa thiết lập'}</Text>
                )}
              </View>

              {/* Field 4: Gender */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>GIỚI TÍNH</Text>
                {isEditing ? (
                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        gender === Gender.MALE && styles.genderBtnActive,
                      ]}
                      onPress={() => setGender(Gender.MALE)}
                    >
                      <Text
                        style={[
                          styles.genderBtnText,
                          gender === Gender.MALE && styles.genderBtnTextActive,
                        ]}
                      >
                        Nam
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        gender === Gender.FEMALE && styles.genderBtnActive,
                      ]}
                      onPress={() => setGender(Gender.FEMALE)}
                    >
                      <Text
                        style={[
                          styles.genderBtnText,
                          gender === Gender.FEMALE && styles.genderBtnTextActive,
                        ]}
                      >
                        Nữ
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        gender === Gender.OTHER && styles.genderBtnActive,
                      ]}
                      onPress={() => setGender(Gender.OTHER)}
                    >
                      <Text
                        style={[
                          styles.genderBtnText,
                          gender === Gender.OTHER && styles.genderBtnTextActive,
                        ]}
                      >
                        Khác
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>
                    {user.gender === Gender.MALE
                      ? 'Nam'
                      : user.gender === Gender.FEMALE
                      ? 'Nữ'
                      : user.gender === Gender.OTHER
                      ? 'Khác'
                      : 'Chưa cập nhật'}
                  </Text>
                )}
              </View>

              {/* Field 5: Date of Birth */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>NGÀY SINH (YYYY-MM-DD)</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholder="Ví dụ: 1985-08-15"
                    placeholderTextColor={colors.outline}
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user.dateOfBirth
                      ? String(user.dateOfBirth).split('T')[0]
                      : 'Chưa cập nhật'}
                  </Text>
                )}
              </View>

              {isEditing && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelBtnText}>HỦY BỎ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
                    onPress={handleSaveProfile}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={18} color={colors.onPrimary} />
                        <Text style={styles.saveBtnText}>LƯU THÔNG TIN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
  editHeaderBtn: {
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
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  avatarBox: {
    marginBottom: 4,
  },
  userName: {
    ...typography.headlineLg,
    color: colors.primary,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  roleBadgeText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontFamily: 'JetBrains Mono',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  cardTitle: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  cardBody: {
    padding: 16,
    gap: 14,
  },
  fieldContainer: {
    gap: 4,
  },
  fieldLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  fieldValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    paddingVertical: 4,
  },
  readOnlyValue: {
    color: colors.outline,
    fontFamily: 'JetBrains Mono',
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 6,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  genderBtnText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  genderBtnTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.headlineSm,
    color: colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
});
