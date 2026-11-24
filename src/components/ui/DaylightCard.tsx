import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, shadows } from '../../constants/theme';

export type DaylightTone = 'neutral' | 'safe' | 'warning' | 'danger' | 'teal' | 'offline';

interface DaylightCardProps {
  children: React.ReactNode;
  tone?: DaylightTone;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevated?: boolean;
}

const TONE_MAP: Record<DaylightTone, { bg: string; border: string; borderWidth: number }> = {
  neutral: { bg: colors.card, border: colors.border, borderWidth: 1 },
  safe: { bg: colors.safeBg, border: colors.safeBorder, borderWidth: 1 },
  warning: { bg: colors.warnBg, border: colors.warnBorder, borderWidth: 1.5 },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, borderWidth: 1.5 },
  teal: { bg: colors.primarySoft, border: '#B2DCE0', borderWidth: 1 },
  offline: { bg: colors.offlineBg, border: colors.offlineBorder, borderWidth: 1 },
};

export const DaylightCard: React.FC<DaylightCardProps> = ({
  children,
  tone = 'neutral',
  style,
  padding = 16,
  elevated = true,
}) => {
  const palette = TONE_MAP[tone];
  return (
    <View
      style={[
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
          borderRadius: radii.card,
          padding,
        },
        elevated ? shadows.card : shadows.none,
        style,
      ]}
    >
      {children}
    </View>
  );
};
