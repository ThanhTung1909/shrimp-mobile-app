import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, shadows } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { PondItem } from '../../store/slices/pondSlice';
import { SafeRangeBar, StatusDot, useFontScale } from '../ui';

interface PondCardProps {
  item: PondItem;
  minDo?: number;
  maxDo?: number;
  onPress?: () => void;
}

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return 'Chờ đồng bộ cảm biến';
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return 'Chờ đồng bộ';
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'Vừa cập nhật';
  if (diffMin < 60) return `Cập nhật ${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Cập nhật ${diffHours} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

function fmtMetric(val: number | null, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '--';
  return val.toFixed(decimals).replace('.', ',');
}

export const PondCard: React.FC<PondCardProps> = ({
  item,
  minDo = 4.0,
  maxDo = 8.0,
  onPress,
}) => {
  const { fs } = useFontScale();

  const isCritical = item.status === 'CRITICAL';
  const isWarning = item.status === 'WARNING';
  const isOffline = item.status === 'OFFLINE' || item.status === 'EMPTY';

  const cardBg = isCritical
    ? colors.dangerBg
    : isWarning
    ? colors.warnBg
    : colors.card;

  const borderColor = isCritical
    ? colors.dangerBorder
    : isWarning
    ? colors.warnBorder
    : colors.border;

  const dotTone = isCritical
    ? 'danger'
    : isWarning
    ? 'warning'
    : isOffline
    ? 'offline'
    : 'safe';

  const doAbnormal = item.doValue !== null && (item.doValue < minDo || item.doValue > maxDo);
  const phAbnormal = item.ph !== null && (item.ph < 7.0 || item.ph > 8.5);
  const tempAbnormal = item.temp !== null && (item.temp < 26 || item.temp > 32);

  const metaParts: string[] = [];
  if (item.shrimpSpecies) metaParts.push(item.shrimpSpecies);
  if (item.docDays !== null) metaParts.push(`DOC ${item.docDays} ngày`);
  else metaParts.push(`${item.areaM2} m²`);
  metaParts.push(formatRelativeTime(item.recordedAt));

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: isCritical || isWarning ? 1.5 : 1,
        },
        shadows.card,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.pondName, { fontSize: fs(17) }]} numberOfLines={1}>
            {item.name}
          </Text>
          <StatusDot tone={dotTone} size={9} />
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </View>

      <Text style={[styles.metaText, { fontSize: fs(12) }]} numberOfLines={1}>
        {metaParts.join(' · ')}
      </Text>

      <View style={styles.metricsPanel}>
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>Oxy (DO)</Text>
          <View style={styles.valueLine}>
            <Text
              style={[
                styles.metricValue,
                {
                  fontSize: fs(19),
                  color: doAbnormal
                    ? isCritical
                      ? colors.dangerText
                      : colors.warnText
                    : colors.ink,
                },
              ]}
            >
              {fmtMetric(item.doValue, 1)}
            </Text>
            <Text style={[styles.unitText, { fontSize: fs(11) }]}>mg/L</Text>
          </View>
        </View>

        <View style={styles.colDivider} />

        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>Độ pH</Text>
          <View style={styles.valueLine}>
            <Text
              style={[
                styles.metricValue,
                {
                  fontSize: fs(19),
                  color: phAbnormal ? colors.warnText : colors.ink,
                },
              ]}
            >
              {fmtMetric(item.ph, 1)}
            </Text>
          </View>
        </View>

        <View style={styles.colDivider} />

        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>Nhiệt độ</Text>
          <View style={styles.valueLine}>
            <Text
              style={[
                styles.metricValue,
                {
                  fontSize: fs(19),
                  color: tempAbnormal ? colors.warnText : colors.ink,
                },
              ]}
            >
              {fmtMetric(item.temp, 1)}
            </Text>
            <Text style={[styles.unitText, { fontSize: fs(11) }]}>°C</Text>
          </View>
        </View>
      </View>

      <SafeRangeBar
        value={item.doValue}
        minSafe={minDo}
        maxSafe={maxDo}
        scaleMin={0}
        scaleMax={10}
        severity={
          item.doValue === null
            ? 'offline'
            : isCritical && doAbnormal
            ? 'danger'
            : doAbnormal
            ? 'warning'
            : 'safe'
        }
        height={5}
      />

      <View style={styles.footerRow}>
        <Text
          style={[
            styles.footerLeft,
            {
              fontSize: fs(11),
              color:
                item.status === 'EMPTY'
                  ? colors.muted
                  : item.status === 'OFFLINE'
                  ? colors.muted
                  : doAbnormal
                  ? isCritical
                    ? colors.dangerText
                    : colors.warnText
                  : colors.safeText,
            },
          ]}
        >
          {item.status === 'EMPTY'
            ? 'Ao đang trống / nghỉ vụ'
            : item.status === 'OFFLINE'
            ? 'Chưa có tín hiệu cảm biến'
            : doAbnormal
            ? `DO hiện tại: ${fmtMetric(item.doValue, 1)} mg/L`
            : 'Các chỉ số ổn định'}
        </Text>
        <Text style={[styles.footerRight, { fontSize: fs(11) }]}>
          Ngưỡng DO ≥ {minDo.toFixed(1).replace('.', ',')} mg/L
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pondName: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
  metricsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  metricCol: {
    flex: 1,
    gap: 2,
  },
  colDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  metricLabel: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
  },
  valueLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  metricValue: {
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerLeft: {
    fontFamily: fontFamily.semiBold,
  },
  footerRight: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
});
