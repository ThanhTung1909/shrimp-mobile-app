import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { useAppDispatch } from '../../store/hooks';
import { logoutAllThunk, logoutThunk } from '../../store/slices/authSlice';
import { AquaToggleSwitch, CenterDialogModal, PrimaryButton, useFontScale } from '../ui';

export interface LogoutConfirmModalProps {
  visible: boolean;
  defaultAllDevices?: boolean;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  visible,
  defaultAllDevices = false,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const [logoutAll, setLogoutAll] = useState(defaultAllDevices);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setLogoutAll(defaultAllDevices);
      setSubmitting(false);
    }
  }, [visible, defaultAllDevices]);

  const handleConfirmLogout = async () => {
    setSubmitting(true);
    if (logoutAll) {
      await dispatch(logoutAllThunk());
    } else {
      await dispatch(logoutThunk());
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <CenterDialogModal visible={visible} onClose={onClose}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="logout" size={26} color={colors.dangerText} />
      </View>

      <Text style={[styles.title, { fontSize: fs(19) }]}>Đăng xuất khỏi AquaSense?</Text>
      <Text style={[styles.desc, { fontSize: fs(13) }]}>
        Thiết bị này sẽ ngừng nhận thông báo đẩy cảnh báo ao nuôi cho đến khi bạn đăng nhập lại.
      </Text>

      <View style={styles.optionCard}>
        <MaterialIcons name="devices" size={20} color={colors.primaryDark} />
        <View style={styles.optionTextWrap}>
          <Text style={[styles.optionTitle, { fontSize: fs(13) }]}>
            Đăng xuất khỏi mọi thiết bị khác
          </Text>
          <Text style={[styles.optionSub, { fontSize: fs(12) }]}>
            Bảo vệ tài khoản khi đổi hoặc mất máy
          </Text>
        </View>
        <AquaToggleSwitch
          value={logoutAll}
          onValueChange={setLogoutAll}
          accessibilityLabel="Đăng xuất khỏi mọi thiết bị khác"
        />
      </View>

      <View style={styles.btnRow}>
        <PrimaryButton
          title="Ở lại"
          variant="ghost"
          compact
          style={styles.halfBtn}
          onPress={onClose}
        />
        <PrimaryButton
          title="Đăng xuất"
          iconName="logout"
          variant="danger"
          compact
          loading={submitting}
          style={styles.halfBtn}
          onPress={handleConfirmLogout}
        />
      </View>
    </CenterDialogModal>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  optionSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  halfBtn: {
    flex: 1,
  },
});
