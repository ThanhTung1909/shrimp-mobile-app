import { colors } from './colors';
import { typography } from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  marginMobile: 12,
  gutterMobile: 12,
};

export const rounded = {
  sm: 2,
  default: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const theme = {
  colors,
  typography,
  spacing,
  rounded,
};

export type Theme = typeof theme;
