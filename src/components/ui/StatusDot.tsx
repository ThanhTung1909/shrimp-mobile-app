import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamily } from '../../constants/typography';

export type StatusDotTone = 'safe' | 'warning' | 'danger' | 'offline' | 'teal';

interface StatusDotProps {
  tone: StatusDotTone;
  size?: number;
  label?: string;
}

const DOT_COLORS: Record<StatusDotTone, string> = {
  safe: colors.safeDot,
  warning: colors.warnDot,
  danger: colors.dangerDot,
  offline: colors.offlineDot,
  teal: colors.primary,
};

export const StatusDot: React.FC<StatusDotProps> = ({ tone, size = 9, label }) => {
  const color = DOT_COLORS[tone];
  return (
    <View style={styles.row}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
});
