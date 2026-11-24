import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semiBold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
};

export const scaleFont = (size: number, largeTextMode: boolean): number => {
  return largeTextMode ? Math.round(size * 1.15) : size;
};

export const tabularStyle: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const typography: Record<string, TextStyle> = {
  displayHero: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headlineLg: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  headlineMd: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  headlineSm: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  titleLg: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  titleMd: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  titleSm: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  labelLg: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  labelMd: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  labelSm: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  kpiLg: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  kpiMd: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
};
