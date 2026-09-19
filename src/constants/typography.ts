import { Platform, TextStyle } from 'react-native';

const MONO_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

const SANS_FONT = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  headlineXl: {
    fontFamily: SANS_FONT,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineXlMobile: {
    fontFamily: SANS_FONT,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  headlineLg: {
    fontFamily: SANS_FONT,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  headlineMd: {
    fontFamily: SANS_FONT,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.09,
  },
  headlineSm: {
    fontFamily: SANS_FONT,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: SANS_FONT,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: SANS_FONT,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: SANS_FONT,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  telemetryValueLg: {
    fontFamily: MONO_FONT,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.84,
  },
  telemetryValueMd: {
    fontFamily: MONO_FONT,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.36,
  },
  telemetryValueSm: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
  },
  labelMd: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.48,
  },
  labelSm: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.66,
  },
};
