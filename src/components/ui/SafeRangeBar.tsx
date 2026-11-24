import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

export type RangeSeverity = 'safe' | 'warning' | 'danger' | 'offline';

interface SafeRangeBarProps {
  value: number | null | undefined;
  minSafe: number;
  maxSafe: number;
  scaleMin?: number;
  scaleMax?: number;
  severity: RangeSeverity;
  height?: number;
}

export const SafeRangeBar: React.FC<SafeRangeBarProps> = ({
  value,
  minSafe,
  maxSafe,
  scaleMin,
  scaleMax,
  severity,
  height = 6,
}) => {
  const span = Math.max(maxSafe - minSafe, 1);
  const low = scaleMin ?? Math.max(0, minSafe - span * 0.5);
  const high = scaleMax ?? maxSafe + span * 0.5;
  const totalSpan = Math.max(high - low, 0.001);

  const safeStartPct = Math.max(0, Math.min(100, ((minSafe - low) / totalSpan) * 100));
  const safeEndPct = Math.max(safeStartPct, Math.min(100, ((maxSafe - low) / totalSpan) * 100));

  const markerPct =
    value !== null && value !== undefined && !isNaN(value)
      ? Math.max(3, Math.min(97, ((value - low) / totalSpan) * 100))
      : null;

  const markerColor =
    severity === 'danger'
      ? colors.dangerDot
      : severity === 'warning'
      ? colors.warnDot
      : severity === 'safe'
      ? colors.safeDot
      : colors.offlineDot;

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.safeZone,
          {
            left: `${safeStartPct}%`,
            width: `${Math.max(safeEndPct - safeStartPct, 4)}%`,
            height,
          },
        ]}
      />
      {markerPct !== null && (
        <View
          style={[
            styles.marker,
            {
              left: `${markerPct}%`,
              backgroundColor: markerColor,
              width: height + 4,
              height: height + 4,
              borderRadius: (height + 4) / 2,
              top: -2,
              marginLeft: -((height + 4) / 2),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#E5ECEB',
    borderRadius: 9999,
    position: 'relative',
    overflow: 'visible',
    marginVertical: 4,
  },
  safeZone: {
    position: 'absolute',
    backgroundColor: '#CFEBD9',
    borderRadius: 9999,
    top: 0,
  },
  marker: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
