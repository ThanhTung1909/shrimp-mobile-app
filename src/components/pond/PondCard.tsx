import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { PondItem } from '../../store/slices/pondSlice';

interface PondCardProps {
  item: PondItem;
  onPress?: () => void;
}

export const PondCard: React.FC<PondCardProps> = ({ item, onPress }) => {
  const isAlert = item.status === 'ALERT' || item.isAlert;

  const stripColor = isAlert ? colors.onTertiaryContainer : colors.secondary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.cardContainer}
      onPress={onPress}
    >
      {/* Left indicator strip */}
      <View style={[styles.leftStrip, { backgroundColor: stripColor }]} />

      <View style={styles.cardContent}>
        {/* Main Line: Identity (Left) & Status Badge + Arrow (Right) */}
        <View style={styles.headerRow}>
          <Text style={styles.nameVi}>{item.nameVi}</Text>

          <View style={styles.rightGroup}>
            {/* Status badge: CẢNH BÁO | AO TRỐNG | ĐANG NUÔI */}
            {isAlert ? (
              <View style={styles.alertStatusBadge}>
                <View style={styles.alertDot} />
                <Text style={styles.alertStatusText}>CẢNH BÁO</Text>
              </View>
            ) : item.status === 'EMPTY' || item.status === 'HARVESTED' ? (
              <View style={styles.emptyStatusBadge}>
                <View style={styles.emptyDot} />
                <Text style={styles.emptyStatusText}>AO TRỐNG</Text>
              </View>
            ) : (
              <View style={styles.activeStatusBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeStatusText}>ĐANG NUÔI</Text>
              </View>
            )}

            <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </View>
        </View>

        {/* Telemetry Data Strip (Horizontal 4 Columns) */}
        <View style={styles.metricsGrid}>
          {/* Column 1: Temp */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>NHIỆT ĐỘ</Text>
            <View style={styles.valueRow}>
              <Text style={styles.metricValue}>{item.temp}</Text>
              <Text style={styles.metricUnit}>°C</Text>
            </View>
          </View>

          {/* Column 2: DO */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>DO</Text>
            <View style={styles.valueRow}>
              <Text
                style={[
                  styles.metricValue,
                  isAlert ? styles.doValueAlert : styles.doValueActive,
                ]}
              >
                {item.doValue}
              </Text>
              <Text style={styles.metricUnit}>mg/L</Text>
            </View>
          </View>

          {/* Column 3: Feed */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>FEED</Text>
            <View style={styles.valueRow}>
              <Text style={styles.metricValue}>{item.feedKgPerDay}</Text>
              <Text style={styles.metricUnit}>kg/d</Text>
            </View>
          </View>

          {/* Column 4: DOC */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>DOC</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.metricValue, styles.boldValue]}>{item.docDays}</Text>
              <Text style={styles.metricUnit}>Days</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  leftStrip: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  identityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameVi: {
    ...typography.headlineSm,
    fontWeight: '700',
    color: colors.onSurface,
  },
  nameEn: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(134, 242, 228, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  activeStatusText: {
    ...typography.labelSm,
    color: colors.onSecondaryContainer,
    fontWeight: '600',
  },
  alertStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onTertiaryContainer,
  },
  alertStatusText: {
    ...typography.labelSm,
    color: colors.onTertiaryFixed,
    fontWeight: '600',
  },
  harvestedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  harvestedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiary,
  },
  harvestedStatusText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  emptyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.outline,
  },
  emptyStatusText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  healthGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  normalHealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  normalHealthText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  alertHealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 218, 214, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertHealthText: {
    ...typography.labelSm,
    color: colors.onErrorContainer,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(242, 243, 255, 0.7)',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'column',
  },
  metricLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metricValue: {
    ...typography.telemetryValueMd,
    color: colors.onSurface,
  },
  boldValue: {
    fontWeight: '700',
  },
  doValueActive: {
    color: colors.secondary,
    fontWeight: '700',
  },
  doValueAlert: {
    color: colors.onTertiaryContainer,
    fontWeight: '700',
  },
  metricUnit: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
});
