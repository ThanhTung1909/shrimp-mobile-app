import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { touchTargets } from '../../constants/theme';

interface AquaToggleSwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const AquaToggleSwitch: React.FC<AquaToggleSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.hitArea,
        { opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: value ? colors.primary : '#CBD5E1' },
        ]}
      >
        <View
          style={[
            styles.thumb,
            { transform: [{ translateX: value ? 24 : 0 }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hitArea: {
    minHeight: touchTargets.min,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  track: {
    width: touchTargets.switchWidth,
    height: touchTargets.switchHeight,
    borderRadius: 9999,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
});
