import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { CenterDialogModal, PrimaryButton, useFontScale } from '../ui';

export const DOC_28_DEFAULTS = {
  do: { min: 4.5, max: 8.0, label: 'Oxy hòa tan (DO)', rangeText: '4,5 – 8,0 mg/L', icon: 'air' as const },
  ph: { min: 7.5, max: 8.3, label: 'Độ pH nước ao', rangeText: '7,5 – 8,3', icon: 'science' as const },
  temp: { min: 27.0, max: 31.0, label: 'Nhiệt độ nước', rangeText: '27,0 – 31,0 °C', icon: 'device-thermostat' as const },
  salinity: { min: 12, max: 20, label: 'Độ mặn', rangeText: '12 – 20 ppt', icon: 'water-drop' as const },
};

export interface ResetThresholdsModalProps {
  visible: boolean;
  pondName: string;
  loading?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const ResetThresholdsModal: React.FC<ResetThresholdsModalProps> = ({
  visible,
  pondName,
  loading = false,
  onConfirm,
  onClose,
}) => {
  const { fs } = useFontScale();

  return (
    <CenterDialogModal visible={visible} onClose={onClose}>
      <View style={styles.iconBox}>
        <MaterialIcons name="restart-alt" size={24} color={colors.primary} />
      </View>

      <Text style={[styles.title, { fontSize: fs(18) }]}>Khôi phục ngưỡng khuyến nghị?</Text>
      <Text style={[styles.subtitle, { fontSize: fs(13) }]}>
        Áp dụng bộ ngưỡng tiêu chuẩn cho{' '}
        <Text style={{ fontFamily: fontFamily.bold, color: colors.ink }}>
          Tôm thẻ chân trắng · DOC 28
        </Text>{' '}
        tại <Text style={{ fontFamily: fontFamily.bold, color: colors.ink }}>{pondName}</Text>:
      </Text>

      <View style={styles.table}>
        {Object.values(DOC_28_DEFAULTS).map((item) => (
          <View key={item.label} style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name={item.icon} size={17} color={colors.primary} />
              <Text style={[styles.rowLabel, { fontSize: fs(13) }]}>{item.label}</Text>
            </View>
            <Text style={[styles.rowVal, { fontSize: fs(13) }]}>{item.rangeText}</Text>
          </View>
        ))}
      </View>

      <View style={styles.noteRow}>
        <MaterialIcons name="info-outline" size={16} color={colors.muted} />
        <Text style={[styles.noteText, { fontSize: fs(12) }]}>
          Bạn vẫn có thể tinh chỉnh lại từng chỉ số sau khi áp dụng.
        </Text>
      </View>

      <View style={styles.btnRow}>
        <PrimaryButton
          title="Giữ nguyên"
          variant="ghost"
          compact
          style={styles.cancelBtn}
          onPress={onClose}
        />
        <PrimaryButton
          title="Áp dụng"
          iconName="check"
          compact
          loading={loading}
          style={styles.confirmBtn}
          onPress={onConfirm}
        />
      </View>
    </CenterDialogModal>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    lineHeight: 20,
  },
  table: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rowLabel: {
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
  rowVal: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1.4,
  },
});
