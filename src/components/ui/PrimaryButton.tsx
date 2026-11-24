import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  testID?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.onPrimary },
  secondary: { bg: colors.primarySoft, border: '#B2DCE0', text: colors.primaryDark },
  danger: { bg: colors.dangerText, border: colors.dangerText, text: '#FFFFFF' },
  ghost: { bg: colors.card, border: colors.borderStrong, text: colors.ink },
};

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconName,
  style,
  compact = false,
  testID,
}) => {
  const palette = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      activeOpacity={0.82}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          minHeight: compact ? touchTargets.min : touchTargets.cta,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {iconName ? <MaterialIcons name={iconName} size={20} color={palette.text} /> : null}
          <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.control,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
});
