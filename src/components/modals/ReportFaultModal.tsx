import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { DeviceBackend } from '../../services/deviceApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDevicesThunk, reportDeviceFaultThunk } from '../../store/slices/deviceSlice';
import { showToast } from '../../store/slices/uiSlice';
import { BottomSheetModal, PrimaryButton, StatusDot, useFontScale } from '../ui';

const QUICK_FAULTS = [
  'Mất nguồn / lỏng dây',
  'Đầu dò DO sai số',
  'Đầu dò pH lệch chuẩn',
  'Mất sóng Wi-Fi bờ ao',
];

export interface ReportFaultModalProps {
  visible: boolean;
  device: DeviceBackend | null;
  pondName?: string;
  onClose: () => void;
}

export const ReportFaultModal: React.FC<ReportFaultModalProps> = ({
  visible,
  device,
  pondName,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const { faultSubmitting } = useAppSelector((state) => state.device);

  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedChips([]);
      setNote('');
      setErrorMsg(null);
    }
  }, [visible, device?.deviceId]);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmit = async () => {
    if (!device) return;
    setErrorMsg(null);

    const parts = [...selectedChips];
    if (note.trim()) parts.push(note.trim());
    const combinedReason = parts.join('. ').slice(0, 500);

    const res = await dispatch(
      reportDeviceFaultThunk({
        deviceId: device.deviceId,
        reason: combinedReason || 'Báo cáo sự cố cảm biến từ ứng dụng di động',
      })
    );

    if (reportDeviceFaultThunk.fulfilled.match(res)) {
      await dispatch(fetchDevicesThunk());
      dispatch(
        showToast({
          text: 'Đã gửi báo hỏng! Trạm đã chuyển sang chế độ Bảo trì.',
          tone: 'warning',
        })
      );
      onClose();
    } else {
      setErrorMsg((res.payload as string) || 'Không thể gửi báo cáo sự cố.');
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Báo hỏng cảm biến"
      footer={
        <View style={styles.footerRow}>
          <PrimaryButton
            title="Hủy"
            variant="ghost"
            compact
            style={styles.cancelBtn}
            onPress={onClose}
          />
          <PrimaryButton
            title="Gửi báo hỏng"
            iconName="send"
            variant="danger"
            compact
            loading={faultSubmitting}
            style={styles.submitBtn}
            onPress={handleSubmit}
          />
        </View>
      }
    >
      {device ? (
        <View style={styles.deviceSummary}>
          <View style={styles.deviceIconBox}>
            <MaterialIcons name="sensors-off" size={22} color={colors.dangerText} />
          </View>
          <View style={styles.deviceInfo}>
            <View style={styles.deviceTitleRow}>
              <Text style={[styles.deviceTitle, { fontSize: fs(15) }]}>
                {device.deviceName}
              </Text>
              <StatusDot
                tone={
                  device.status === 'ONLINE'
                    ? 'safe'
                    : device.status === 'MAINTENANCE'
                    ? 'warning'
                    : 'danger'
                }
                size={9}
              />
            </View>
            <Text style={[styles.deviceSub, { fontSize: fs(12) }]}>
              MAC: {device.macAddress}
              {pondName ? ` · ${pondName}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { fontSize: fs(12) }]}>
        CHỌN NHANH TÌNH TRẠNG GẶP PHẢI
      </Text>
      <View style={styles.chipGrid}>
        {QUICK_FAULTS.map((chip) => {
          const active = selectedChips.includes(chip);
          return (
            <TouchableOpacity
              key={chip}
              activeOpacity={0.8}
              onPress={() => toggleChip(chip)}
              style={[styles.faultChip, active && styles.faultChipActive]}
            >
              <Text
                style={[
                  styles.faultChipText,
                  { fontSize: fs(13) },
                  active && styles.faultChipTextActive,
                ]}
              >
                {chip}
              </Text>
              {active ? <MaterialIcons name="check-circle" size={16} color="#FFFFFF" /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.noteHeader}>
        <Text style={[styles.noteLabel, { fontSize: fs(13) }]}>Mô tả thêm (tùy chọn)</Text>
        <Text style={styles.charCount}>{note.length}/500</Text>
      </View>
      <TextInput
        value={note}
        onChangeText={(txt) => setNote(txt.slice(0, 500))}
        multiline
        numberOfLines={3}
        placeholder="Ví dụ: Đầu dò bị rong rêu bám hoặc dây nguồn bờ ao bị ẩm..."
        placeholderTextColor={colors.subtle}
        style={[styles.textarea, { fontSize: fs(14) }]}
      />

      <View style={styles.infoNote}>
        <MaterialIcons name="build" size={16} color={colors.primary} />
        <Text style={[styles.infoText, { fontSize: fs(12) }]}>
          Trạm sẽ tự động chuyển sang Chế độ bảo trì và thông báo kỹ thuật viên hỗ trợ.
        </Text>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  deviceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.card,
    padding: 12,
  },
  deviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    gap: 3,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  deviceSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
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
    fontSize: 13,
    color: colors.dangerText,
  },
  sectionLabel: {
    fontFamily: fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  faultChip: {
    width: '48.5%',
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  faultChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  faultChipText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  faultChipTextActive: {
    color: '#FFFFFF',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteLabel: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  charCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  textarea: {
    minHeight: 88,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
