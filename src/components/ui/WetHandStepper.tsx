import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';

interface WetHandStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  disabled?: boolean;
}

export const WetHandStepper: React.FC<WetHandStepperProps> = ({
  label,
  value,
  onChange,
  step = 0.1,
  min = 0,
  max = 100,
  unit,
  decimals = 2,
  disabled = false,
}) => {
  const clampRound = (num: number) => {
    const clamped = Math.min(max, Math.max(min, num));
    const factor = Math.pow(10, decimals);
    return Math.round(clamped * factor) / factor;
  };

  const formatValue = (num: number) =>
    decimals >= 2 ? num.toFixed(decimals) : String(Number(num.toFixed(decimals)));

  const [focused, setFocused] = useState(false);
  const [draftText, setDraftText] = useState(() => formatValue(value));
  const lastPropValueRef = useRef(value);

  useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      if (!focused) {
        setDraftText(formatValue(value));
      } else {
        const parsedDraft = parseFloat(draftText.replace(',', '.'));
        if (isNaN(parsedDraft) || Math.abs(clampRound(parsedDraft) - value) > 1e-9) {
          setDraftText(formatValue(value));
        }
      }
    }
  }, [value, decimals, focused]);

  const handleStep = (delta: number) => {
    const next = clampRound(value + delta);
    lastPropValueRef.current = next;
    setDraftText(formatValue(next));
    onChange(next);
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={disabled || value <= min}
          onPress={() => handleStep(-step)}
          style={[
            styles.stepBtn,
            (disabled || value <= min) && styles.stepBtnDisabled,
          ]}
          accessibilityLabel={`Giảm ${label || ''}`}
        >
          <MaterialIcons name="remove" size={24} color={disabled ? colors.subtle : colors.primaryDark} />
        </TouchableOpacity>

        <View style={styles.valueBox}>
          <TextInput
            value={draftText}
            editable={!disabled}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onFocus={() => setFocused(true)}
            onChangeText={(txt) => {
              if (!/^\d*[.,]?\d*$/.test(txt)) return;
              setDraftText(txt);
              const cleaned = txt.replace(',', '.');
              if (cleaned === '' || cleaned === '.' || cleaned.endsWith('.')) return;
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                onChange(clampRound(parsed));
              }
            }}
            onBlur={() => {
              setFocused(false);
              const cleaned = draftText.trim().replace(',', '.');
              if (cleaned === '' || cleaned === '.') {
                setDraftText(formatValue(value));
                return;
              }
              const parsed = parseFloat(cleaned);
              if (isNaN(parsed)) {
                setDraftText(formatValue(value));
                return;
              }
              const next = clampRound(parsed);
              lastPropValueRef.current = next;
              setDraftText(formatValue(next));
              onChange(next);
            }}
            style={styles.valueInput}
          />
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          disabled={disabled || value >= max}
          onPress={() => handleStep(step)}
          style={[
            styles.stepBtn,
            (disabled || value >= max) && styles.stepBtnDisabled,
          ]}
          accessibilityLabel={`Tăng ${label || ''}`}
        >
          <MaterialIcons name="add" size={24} color={disabled ? colors.subtle : colors.primaryDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: touchTargets.stepper,
    height: touchTargets.stepper,
    borderRadius: radii.control,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    opacity: 0.55,
  },
  valueBox: {
    flex: 1,
    minWidth: 0,
    height: touchTargets.stepper,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  valueInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fontFamily.bold,
    fontSize: 19,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    paddingVertical: 0,
  },
  unit: {
    flexShrink: 0,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
});
