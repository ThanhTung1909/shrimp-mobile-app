import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { AlertBackend } from '../../services/alertApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAlertsThunk, resolveAlertThunk } from '../../store/slices/alertSlice';
import { showToast } from '../../store/slices/uiSlice';
import { BottomSheetModal, PrimaryButton, StatusDot, useFontScale } from '../ui';

const QUICK_ACTIONS = [
  'Đã bật thêm quạt nước',
  'Đã giảm 20% thức ăn',
  'Đã tạt oxy viên',
  'Đã kiểm tra nguồn điện',
];

export interface ResolveAlertModalProps {
  visible: boolean;
  alert: AlertBackend | null;
  pondName?: string;
  onClose: () => void;
}

export const ResolveAlertModal: React.FC<ResolveAlertModalProps> = ({
  visible,
  alert,
  pondName,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const resolvingId = useAppSelector((state) => state.alert.resolvingId);

  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedActions([]);
      setNote('');
      setErrorMsg(null);
    }
  }, [visible, alert?.alertId]);

  const toggleAction = (item: string) => {
    setSelectedActions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleConfirm = async () => {
    if (!alert) return;
    setErrorMsg(null);

    const parts = [...selectedActions];
    if (note.trim()) parts.push(note.trim());
    const resolutionNote = parts.join('. ') || 'Đã kiểm tra và xử lý ngoài ao';

    const res = await dispatch(
      resolveAlertThunk({
        alertId: alert.alertId,
        resolutionNote,
      })
    );

    if (resolveAlertThunk.fulfilled.match(res)) {
      await dispatch(fetchAlertsThunk());
      dispatch(showToast({ text: 'Đã xác nhận xử lý cảnh báo!', tone: 'safe' }));
      onClose();
    } else {
      setErrorMsg((res.payload as string) || 'Không thể cập nhật trạng thái cảnh báo.');
    }
  };

  const isCritical = alert?.alertLevel === 'CRITICAL';

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Xác nhận đã xử lý"
      footer={
        <View style={styles.footerWrap}>
          <PrimaryButton
            title="Hoàn tất & Lưu xử lý"
            iconName="check-circle"
            loading={resolvingId === alert?.alertId}
            onPress={handleConfirm}
          />
          <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
            <Text style={styles.laterText}>Để sau</Text>
          </TouchableOpacity>
        </View>
      }
    >
      {alert ? (
        <View
          style={[
            styles.summaryBox,
            isCritical ? styles.summaryCritical : styles.summaryWarning,
          ]}
        >
          <View style={styles.summaryMetaRow}>
            <StatusDot tone={isCritical ? 'danger' : 'warning'} size={9} />
            <Text style={[styles.summaryMeta, { fontSize: fs(12) }]}>
              {pondName || alert.pond?.pondName || 'Ao nuôi'} ·{' '}
              {new Date(alert.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text
            style={[
              styles.summaryHeadline,
              {
                fontSize: fs(15),
                color: isCritical ? colors.dangerText : colors.warnText,
              },
            ]}
          >
            {alert.message || `${alert.metricName}: ${alert.triggeredValue}`}
          </Text>
        </View>
      ) : null}

      {alert?.recommendation?.actionSuggestion ? (
        <View style={styles.aiRecBox}>
          <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
          <Text style={[styles.aiRecText, { fontSize: fs(13) }]}>
            Gợi ý AI: {alert.recommendation.actionSuggestion}
          </Text>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionLabel, { fontSize: fs(12) }]}>
          THAO TÁC ĐÃ THỰC HIỆN NGOÀI AO
        </Text>
        <Text style={styles.multiHint}>Chọn nhiều</Text>
      </View>

      <View style={styles.chipGrid}>
        {QUICK_ACTIONS.map((item) => {
          const active = selectedActions.includes(item);
          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => toggleAction(item)}
              style={[styles.actionChip, active && styles.actionChipActive]}
            >
              <MaterialIcons
                name={active ? 'check' : 'add'}
                size={16}
                color={active ? '#FFFFFF' : colors.ink}
              />
              <Text
                style={[
                  styles.actionChipText,
                  { fontSize: fs(13) },
                  active && styles.actionChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { fontSize: fs(12) }]}>
        GHI CHÚ KHẮC PHỤC (TÙY CHỌN)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        placeholder="Ví dụ: Đã bật thêm 2 dàn quạt bờ Đông, kiểm tra tôm không nổi đầu..."
        placeholderTextColor={colors.subtle}
        style={[styles.textarea, { fontSize: fs(14) }]}
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  summaryBox: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  summaryCritical: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  summaryWarning: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryMeta: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  summaryHeadline: {
    fontFamily: fontFamily.bold,
  },
  aiRecBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    padding: 10,
  },
  aiRecText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.control,
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.dangerText,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  multiHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    width: '48.5%',
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionChipText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  actionChipTextActive: {
    color: '#FFFFFF',
  },
  textarea: {
    minHeight: 84,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  footerWrap: {
    gap: 6,
  },
  laterBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.muted,
  },
});
