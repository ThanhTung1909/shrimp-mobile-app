import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { radii, touchTargets } from '../constants/theme';
import { fontFamily } from '../constants/typography';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { dismissCurrentAlert, EmergencyAlert } from '../store/slices/alertSlice';
import { CenterDialogModal, PrimaryButton, useFontScale } from './ui';

export interface EmergencyAlertBannerProps {
  onViewAlert?: (alert: EmergencyAlert) => void;
}

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  dissolvedOxygen: { label: 'DO tụt xuống', unit: 'mg/L' },
  do: { label: 'DO tụt xuống', unit: 'mg/L' },
  pH: { label: 'Độ pH vượt ngưỡng', unit: 'pH' },
  ph: { label: 'Độ pH vượt ngưỡng', unit: 'pH' },
  temperature: { label: 'Nhiệt độ biến động', unit: '°C' },
  salinity: { label: 'Độ mặn vượt ngưỡng', unit: 'ppt' },
  turbidity: { label: 'Độ đục vượt ngưỡng', unit: 'NTU' },
  waterLevel: { label: 'Mực nước biến động', unit: 'm' },
  nh3: { label: 'Nồng độ NH3 cao', unit: 'mg/L' },
  no2: { label: 'Nồng độ NO2 cao', unit: 'mg/L' },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatAlertMessage(msg?: string | null): string {
  if (!msg) return '';
  return msg
    .replace(/\bdissolvedOxygen\b/gi, 'Oxy hòa tan (DO)')
    .replace(/\btemperature\b/gi, 'Nhiệt độ')
    .replace(/\bsalinity\b/gi, 'Độ mặn')
    .replace(/\bturbidity\b/gi, 'Độ đục')
    .replace(/\bwaterLevel\b/gi, 'Mực nước');
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({ onViewAlert }) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const alert = useAppSelector((state) => state.alert.currentActiveAlert);
  const ponds = useAppSelector((state) => state.pond.ponds);

  const pondName = useMemo(() => {
    if (!alert) return '';
    if (alert.pondName && !UUID_PATTERN.test(alert.pondName.trim())) return alert.pondName;
    const matched = ponds.find((p) => p.id === alert.pondId);
    return matched?.name || 'Ao nuôi cần kiểm tra';
  }, [alert, ponds]);

  if (!alert) return null;

  const metricInfo = alert.metric ? METRIC_LABELS[alert.metric] : undefined;
  const formattedValue =
    alert.value !== undefined && !isNaN(alert.value)
      ? `${String(alert.value).replace('.', ',')} ${metricInfo?.unit || ''}`.trim()
      : null;

  const formattedTime = new Date(alert.timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleViewDetail = () => {
    const captured = alert;
    dispatch(dismissCurrentAlert());
    onViewAlert?.(captured);
  };

  return (
    <CenterDialogModal
      visible={true}
      dismissOnBackdrop={false}
      accentBorderColor={colors.dangerBorder}
    >
      <View style={styles.dangerHeader}>
        <View style={styles.dangerIconWrap}>
          <MaterialIcons name="warning-amber" size={22} color={colors.dangerText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { fontSize: fs(14) }]} numberOfLines={1}>
            Cảnh báo khẩn cấp · {pondName}
          </Text>
          <Text style={[styles.headerTime, { fontSize: fs(12) }]}>
            Vừa ghi nhận · {formattedTime}
          </Text>
        </View>
      </View>

      <View style={styles.metricHero}>
        <Text style={[styles.metricHeadline, { fontSize: fs(26) }]}>
          {metricInfo && formattedValue
            ? `${metricInfo.label} ${formattedValue}`
            : alert.title}
        </Text>
        <Text style={[styles.metricSub, { fontSize: fs(13) }]}>
          {formatAlertMessage(alert.message) || 'Phát hiện chỉ số môi trường vượt ngưỡng an toàn.'}
        </Text>
      </View>

      <View style={styles.aiBox}>
        <View style={styles.aiTitleRow}>
          <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
          <Text style={styles.aiTitleText}>KHUYẾN NGHỊ XỬ LÝ NGAY</Text>
        </View>
        <Text style={[styles.aiBody, { fontSize: fs(13) }]}>
          {alert.actionSuggestion ||
            'Bật ngay toàn bộ quạt nước / máy sục khí tại ao, giảm cữ ăn và kiểm tra đàn tôm thực địa.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={`Xem chi tiết ${pondName} →`}
          variant="danger"
          onPress={handleViewDetail}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => dispatch(dismissCurrentAlert())}
          style={styles.dismissBtn}
        >
          <MaterialIcons name="check-circle-outline" size={18} color={colors.primaryDark} />
          <Text style={[styles.dismissText, { fontSize: fs(14) }]}>
            Đã bật quạt · Đóng thông báo
          </Text>
        </TouchableOpacity>
      </View>
    </CenterDialogModal>
  );
};

const styles = StyleSheet.create({
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.control,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    color: colors.dangerText,
  },
  headerTime: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  metricHero: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  metricHeadline: {
    fontFamily: fontFamily.bold,
    color: colors.dangerText,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  metricSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  aiBox: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    borderRadius: radii.control,
    padding: 12,
    gap: 6,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitleText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  aiBody: {
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  actions: {
    gap: 10,
  },
  dismissBtn: {
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  dismissText: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
  },
});
