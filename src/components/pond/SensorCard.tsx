import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fontFamily } from '../../constants/typography';
import { SensorMetric } from '../../store/slices/pondSlice';
import { DaylightCard, SafeRangeBar, StatusDot, useFontScale } from '../ui';

interface SensorCardProps {
  sensor: SensorMetric;
}

export const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const { fs } = useFontScale();

  const tone =
    sensor.severity === 'danger'
      ? 'danger'
      : sensor.severity === 'warning'
      ? 'warning'
      : 'neutral';

  const dotTone =
    sensor.severity === 'danger'
      ? 'danger'
      : sensor.severity === 'warning'
      ? 'warning'
      : sensor.severity === 'offline'
      ? 'offline'
      : 'safe';

  const valueColor =
    sensor.severity === 'danger'
      ? colors.dangerText
      : sensor.severity === 'warning'
      ? colors.warnText
      : sensor.severity === 'offline'
      ? colors.muted
      : colors.ink;

  const formattedVal =
    sensor.value !== null && sensor.value !== undefined && !isNaN(sensor.value)
      ? String(sensor.value).replace('.', ',')
      : '--';

  return (
    <DaylightCard tone={tone} padding={12} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {sensor.isCommunityIcon ? (
            <MaterialCommunityIcons name={sensor.iconName as any} size={15} color={colors.primary} />
          ) : (
            <MaterialIcons name={sensor.iconName as any} size={15} color={colors.primary} />
          )}
          <Text style={[styles.nameText, { fontSize: fs(12) }]} numberOfLines={1}>
            {sensor.name}
          </Text>
        </View>
        <StatusDot tone={dotTone} size={8} />
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color: valueColor, fontSize: fs(25) }]}>
          {formattedVal}
        </Text>
        <Text
          style={[
            styles.unitText,
            {
              color:
                sensor.severity === 'danger'
                  ? colors.dangerText
                  : sensor.severity === 'warning'
                  ? colors.warnText
                  : colors.muted,
              fontSize: fs(12),
            },
          ]}
        >
          {sensor.unit}
        </Text>
      </View>

      <SafeRangeBar
        value={sensor.value}
        minSafe={sensor.minSafe}
        maxSafe={sensor.maxSafe}
        scaleMin={sensor.scaleMin}
        scaleMax={sensor.scaleMax}
        severity={sensor.severity}
      />

      <View style={styles.scaleRow}>
        <Text style={[styles.scaleText, { fontSize: fs(10) }]}>{sensor.scaleMin}</Text>
        <Text style={[styles.rangeLabel, { fontSize: fs(11) }]} numberOfLines={1}>
          {sensor.rangeLabel}
        </Text>
        <Text style={[styles.scaleText, { fontSize: fs(10) }]}>{sensor.scaleMax}</Text>
      </View>
    </DaylightCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nameText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  valueText: {
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
    lineHeight: 30,
  },
  unitText: {
    fontFamily: fontFamily.medium,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  scaleText: {
    fontFamily: fontFamily.regular,
    color: colors.subtle,
    fontVariant: ['tabular-nums'],
  },
  rangeLabel: {
    fontFamily: fontFamily.medium,
    color: colors.safeText,
    textAlign: 'center',
    flexShrink: 1,
  },
});
