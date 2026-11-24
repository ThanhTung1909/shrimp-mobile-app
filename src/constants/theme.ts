import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';
import { typography, fontFamily } from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screenPadding: 16,
};

export const radii = {
  sm: 8,
  control: 12,
  card: 16,
  sheet: 24,
  pill: 9999,
};

export const rounded = radii;

export const touchTargets = {
  min: 48,
  cta: 54,
  stepper: 56,
  switchWidth: 56,
  switchHeight: 32,
};

export const shadows: Record<'card' | 'floating' | 'none', ViewStyle> = {
  none: {},
  card: Platform.select({
    ios: {
      shadowColor: '#0B2428',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      boxShadow: '0px 2px 8px rgba(11, 36, 40, 0.05)',
    } as any,
  }) as ViewStyle,
  floating: Platform.select({
    ios: {
      shadowColor: '#0B2428',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {
      boxShadow: '0px 6px 18px rgba(11, 36, 40, 0.12)',
    } as any,
  }) as ViewStyle,
};

export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  radii,
  rounded,
  touchTargets,
  shadows,
};

export type Theme = typeof theme;
