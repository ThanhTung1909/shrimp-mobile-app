import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { fontFamily } from '../../constants/typography';

export interface LineChartPoint {
  xLabel: string;
  value: number;
  subLabel?: string;
}

interface LineChartSvgProps {
  points: LineChartPoint[];
  unit?: string;
  safeMin?: number;
  safeMax?: number;
  lineColor?: string;
  height?: number;
  emptyText?: string;
  decimals?: number;
}

export const LineChartSvg: React.FC<LineChartSvgProps> = ({
  points,
  unit = '',
  safeMin,
  safeMax,
  lineColor = colors.primary,
  height = 200,
  emptyText = 'Chưa có dữ liệu biểu đồ',
  decimals = 2,
}) => {
  const [width, setWidth] = useState<number>(320);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 40 && Math.abs(w - width) > 2) {
      setWidth(w);
    }
  };

  const padLeft = 40;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 28;
  const chartW = Math.max(width - padLeft - padRight, 60);
  const chartH = Math.max(height - padTop - padBottom, 60);

  const { yMin, yMax, coords, pathD, areaD, ticks } = useMemo(() => {
    if (!points || points.length === 0) {
      return {
        yMin: 0,
        yMax: 10,
        coords: [] as Array<{ x: number; y: number; point: LineChartPoint; idx: number }>,
        pathD: '',
        areaD: '',
        ticks: [0, 5, 10],
      };
    }

    const vals = points.map((p) => p.value);
    if (safeMin !== undefined) vals.push(safeMin);
    if (safeMax !== undefined) vals.push(safeMax);

    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);
    if (maxVal === minVal) {
      minVal = minVal - 1;
      maxVal = maxVal + 1;
    } else {
      const margin = (maxVal - minVal) * 0.14;
      minVal = Math.max(0, minVal - margin);
      maxVal = maxVal + margin;
    }

    const spanY = Math.max(maxVal - minVal, 0.01);
    const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;

    const computedCoords = points.map((pt, idx) => {
      const x = points.length === 1 ? padLeft + chartW / 2 : padLeft + idx * stepX;
      const y = padTop + chartH - ((pt.value - minVal) / spanY) * chartH;
      return { x, y, point: pt, idx };
    });

    const linePath = computedCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const areaPath =
      computedCoords.length > 1
        ? `${linePath} L ${computedCoords[computedCoords.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${computedCoords[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
        : '';

    const mid = (minVal + maxVal) / 2;
    return {
      yMin: minVal,
      yMax: maxVal,
      coords: computedCoords,
      pathD: linePath,
      areaD: areaPath,
      ticks: [minVal, mid, maxVal],
    };
  }, [points, safeMin, safeMax, chartW, chartH, padLeft, padTop]);

  if (!points || points.length === 0) {
    return (
      <View style={[styles.emptyBox, { height }]}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const activeIndex = selectedIdx !== null && coords[selectedIdx] ? selectedIdx : coords.length - 1;
  const activeCoord = coords[activeIndex];

  const yForValue = (v: number) =>
    padTop + chartH - ((v - yMin) / Math.max(yMax - yMin, 0.01)) * chartH;

  let bandTop = padTop;
  let bandHeight = 0;
  if (safeMin !== undefined && safeMax !== undefined) {
    const yTop = Math.max(padTop, Math.min(padTop + chartH, yForValue(safeMax)));
    const yBot = Math.max(padTop, Math.min(padTop + chartH, yForValue(safeMin)));
    bandTop = yTop;
    bandHeight = Math.max(0, yBot - yTop);
  }

  const xLabelStride = Math.max(1, Math.ceil(coords.length / 5));

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      {activeCoord ? (
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipTime}>
            {activeCoord.point.xLabel}
            {activeCoord.point.subLabel ? ` • ${activeCoord.point.subLabel}` : ''}
          </Text>
          <Text style={[styles.tooltipVal, { color: lineColor }]}>
            {activeCoord.point.value.toFixed(decimals)}
            {unit ? ` ${unit}` : ''}
          </Text>
        </View>
      ) : null}

      <Svg width={width} height={height}>
        {bandHeight > 0 ? (
          <Rect
            x={padLeft}
            y={bandTop}
            width={chartW}
            height={bandHeight}
            fill="#E7F6EC"
            opacity={0.75}
          />
        ) : null}

        {ticks.map((tick, idx) => {
          const y = yForValue(tick);
          return (
            <React.Fragment key={`grid-${idx}`}>
              <Line
                x1={padLeft}
                y1={y}
                x2={padLeft + chartW}
                y2={y}
                stroke={colors.border}
                strokeDasharray="3,3"
                strokeWidth={1}
              />
              <SvgText
                x={padLeft - 6}
                y={y + 4}
                fontSize={10}
                fill={colors.muted}
                textAnchor="end"
              >
                {tick.toFixed(decimals > 1 ? 1 : 0)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {safeMin !== undefined ? (
          <Line
            x1={padLeft}
            y1={yForValue(safeMin)}
            x2={padLeft + chartW}
            y2={yForValue(safeMin)}
            stroke={colors.safeDot}
            strokeDasharray="4,4"
            strokeWidth={1}
            opacity={0.7}
          />
        ) : null}

        {areaD ? <Path d={areaD} fill={lineColor} opacity={0.1} /> : null}
        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {coords.map((c, idx) => {
          const isSelected = idx === activeIndex;
          const outOfRange =
            (safeMin !== undefined && c.point.value < safeMin) ||
            (safeMax !== undefined && c.point.value > safeMax);
          const dotColor = outOfRange ? colors.dangerText : lineColor;

          return (
            <React.Fragment key={`pt-${idx}`}>
              <Circle
                cx={c.x}
                cy={c.y}
                r={isSelected ? 5.5 : coords.length <= 14 ? 3.5 : 2.5}
                fill={isSelected ? '#FFFFFF' : dotColor}
                stroke={dotColor}
                strokeWidth={isSelected ? 2.5 : 1}
              />
              {((idx % xLabelStride === 0 && idx < coords.length - 2) ||
                idx === coords.length - 1) && (
                <SvgText
                  x={c.x}
                  y={height - 8}
                  fontSize={10}
                  fill={colors.muted}
                  textAnchor="middle"
                >
                  {c.point.xLabel}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {coords.length > 1 && coords.length <= 24 ? (
        <View style={styles.tapOverlay}>
          {coords.map((c) => (
            <TouchableOpacity
              key={`tap-${c.idx}`}
              style={styles.tapSlice}
              onPress={() => setSelectedIdx(c.idx)}
              accessibilityLabel={`Điểm ${c.point.xLabel}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  tooltipTime: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.muted,
  },
  tooltipVal: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
  tapOverlay: {
    position: 'absolute',
    top: 24,
    bottom: 18,
    left: 40,
    right: 14,
    flexDirection: 'row',
  },
  tapSlice: {
    flex: 1,
    height: '100%',
  },
});
