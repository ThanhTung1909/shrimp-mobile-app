import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radii } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';

export interface OtpCodeInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  accessibilityLabel = 'Nhập mã OTP 6 chữ số',
}) => {
  const [focused, setFocused] = useState(false);
  const clean = value.replace(/\D/g, '').slice(0, length);
  const activeIndex = Math.min(clean.length, length - 1);

  return (
    <View style={styles.container}>
      <View style={styles.slotsRow} pointerEvents="none">
        {Array.from({ length }, (_, idx) => {
          const char = clean[idx] || '';
          const isActive = focused && !disabled && idx === activeIndex;
          return (
            <View
              key={idx}
              style={[
                styles.slot,
                char ? styles.slotFilled : null,
                isActive ? styles.slotActive : null,
                disabled ? styles.slotDisabled : null,
              ]}
            >
              {char ? (
                <Text style={styles.digit}>{char}</Text>
              ) : isActive ? (
                <View style={styles.caret} />
              ) : null}
            </View>
          );
        })}
      </View>

      <TextInput
        value={clean}
        onChangeText={(txt) => onChange(txt.replace(/\D/g, '').slice(0, length))}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        caretHidden={true}
        selectionColor="transparent"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        style={styles.hiddenOverlayInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  slot: {
    flex: 1,
    height: 52,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  slotActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FAFA',
  },
  slotDisabled: {
    opacity: 0.6,
  },
  digit: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 2,
    height: 22,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  hiddenOverlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 16,
    zIndex: 2,
  },
});
