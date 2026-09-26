import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export interface SensorData {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  standard: string;
  trendText: string;
  trendIcon: string;
  iconName: string;
  isCommunityIcon?: boolean;
  percent: number;
  isError?: boolean;
  errorTagText?: string;
}

interface SensorCardProps {
  sensor: SensorData;
}

export const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const isError = sensor.isError;

  const headerLabelColor = isError ? colors.error : colors.onSurfaceVariant;
  const valueColor = isError ? colors.error : colors.onSurface;
  const trendColor = isError
    ? colors.error
    : sensor.trendText.includes('NTU')
    ? colors.onTertiaryContainer
    : colors.secondary;
  const progressFillColor = isError ? colors.error : colors.secondary;

  return (
    <View
      style={[
        styles.cardContainer,
        isError && styles.errorCardBorder,
      ]}
    >
      {/* Top Header Line */}
      <View style={styles.headerRow}>
        <Text style={[styles.sensorName, { color: headerLabelColor }]}>
          {sensor.name}
        </Text>
        <View style={styles.headerRightIcons}>
          <MaterialIcons
            name={sensor.trendIcon as any}
            size={15}
            color={trendColor}
          />
          {sensor.isCommunityIcon ? (
            <MaterialCommunityIcons
              name={sensor.iconName as any}
              size={16}
              color={isError ? colors.error : colors.secondary}
            />
          ) : (
            <MaterialIcons
              name={sensor.iconName as any}
              size={16}
              color={isError ? colors.error : colors.secondary}
            />
          )}
        </View>
      </View>

      {/* Middle Value Section */}
      <View style={styles.middleSection}>
        <View style={styles.valueRow}>
          <Text style={[styles.sensorValue, { color: valueColor }]}>
            {sensor.value}
          </Text>
          <Text style={[styles.sensorUnit, isError && { color: colors.error }]}>
            {sensor.unit}
          </Text>
        </View>

        <View style={styles.subRow}>
          {isError ? (
            <View style={styles.errorTag}>
              <View style={styles.errorDot} />
              <Text style={styles.errorTagText}>
                {sensor.errorTagText || 'Cảnh báo thấp'}
              </Text>
            </View>
          ) : (
            <View style={styles.standardTag}>
              <Text style={styles.standardTagText}>{sensor.standard}</Text>
            </View>
          )}
          <Text style={[styles.trendText, { color: trendColor }]}>
            {sensor.trendText}
          </Text>
        </View>
      </View>

      {/* Bottom Progress Bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${sensor.percent}%`, backgroundColor: progressFillColor },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 8,
    flex: 1,
  },
  errorCardBorder: {
    borderColor: 'rgba(186, 26, 26, 0.4)',
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sensorName: {
    ...typography.labelSm,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  middleSection: {
    marginVertical: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  sensorValue: {
    ...typography.telemetryValueLg,
  },
  sensorUnit: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  standardTag: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  standardTagText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  errorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  errorTagText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.onErrorContainer,
    fontWeight: '700',
  },
  trendText: {
    ...typography.labelSm,
    fontSize: 10,
  },
  progressBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
