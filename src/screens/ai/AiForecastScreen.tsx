import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { RiskLevel } from '../../services/predictionApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDiseaseRiskThunk,
  fetchWaterQualityThunk,
} from '../../store/slices/predictionSlice';
import { setPondSelectorOpen } from '../../store/slices/uiSlice';
import {
  DaylightCard,
  LineChartPoint,
  LineChartSvg,
  PrimaryButton,
  StatusDot,
  useFontScale,
} from '../../components/ui';

type AiTab = 'water' | 'disease';
type WaterMetric = 'do' | 'ph' | 'temp';

function riskMeta(level?: RiskLevel) {
  switch (level) {
    case 'CRITICAL':
      return { label: 'Rất cao', dot: 'danger' as const, bg: colors.dangerBg, border: colors.dangerBorder, ink: colors.dangerText };
    case 'HIGH':
      return { label: 'Cao', dot: 'danger' as const, bg: colors.dangerBg, border: '#FDBA74', ink: '#C2410C' };
    case 'MEDIUM':
      return { label: 'Trung bình', dot: 'warning' as const, bg: colors.warnBg, border: colors.warnBorder, ink: colors.warnText };
    default:
      return { label: 'Thấp / Ổn định', dot: 'safe' as const, bg: colors.safeBg, border: colors.safeBorder, ink: colors.safeText };
  }
}

export const AiForecastScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const { ponds, selectedPondId } = useAppSelector((state) => state.pond);
  const {
    waterQualityByPond,
    diseaseRiskByPond,
    loadingWaterQuality,
    loadingDiseaseRisk,
    errorWaterQuality,
    errorDiseaseRisk,
  } = useAppSelector((state) => state.prediction);

  const activePond = useMemo(
    () => ponds.find((p) => p.id === selectedPondId) || ponds[0] || null,
    [ponds, selectedPondId]
  );
  const pondId = activePond?.id;

  const [tab, setTab] = useState<AiTab>('water');
  const [horizonHours, setHorizonHours] = useState<12 | 24>(24);
  const [waterMetric, setWaterMetric] = useState<WaterMetric>('do');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!pondId) return;
    dispatch(fetchWaterQualityThunk({ pondId, horizonHours, stepHours: 2 }));
    dispatch(fetchDiseaseRiskThunk({ pondId }));
  }, [pondId, horizonHours, dispatch]);

  const handleRefreshAi = async (bypassCache = true) => {
    if (!pondId) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchWaterQualityThunk({ pondId, horizonHours, stepHours: 2, refresh: bypassCache })),
      dispatch(fetchDiseaseRiskThunk({ pondId, refresh: bypassCache })),
    ]);
    setRefreshing(false);
  };

  const wq = pondId ? waterQualityByPond[pondId] : undefined;
  const dr = pondId ? diseaseRiskByPond[pondId] : undefined;

  const chartConfig = useMemo(() => {
    if (waterMetric === 'ph') {
      return { unit: 'pH', safeMin: 7.0, safeMax: 8.5, decimals: 2, color: '#0B6E75' };
    }
    if (waterMetric === 'temp') {
      return { unit: '°C', safeMin: 26.0, safeMax: 32.0, decimals: 1, color: '#D97706' };
    }
    return { unit: 'mg/L', safeMin: 4.0, safeMax: 8.0, decimals: 2, color: '#0B6E75' };
  }, [waterMetric]);

  const wqPoints: LineChartPoint[] = useMemo(() => {
    if (!wq?.series) return [];
    return wq.series.map((pt) => {
      const value =
        waterMetric === 'ph'
          ? pt.predictedPH
          : waterMetric === 'temp'
          ? pt.predictedTemperature
          : pt.predictedDO;
      const dt = new Date(pt.predictedTime);
      const subLabel = isNaN(dt.getTime())
        ? undefined
        : dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return {
        xLabel: `+${pt.offsetHours}h`,
        value: Number(value),
        subLabel,
      };
    });
  }, [wq, waterMetric]);

  const wqRiskStyle = riskMeta(wq?.riskLevel);
  const drRiskStyle = riskMeta(dr?.overallRiskLevel);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => handleRefreshAi(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AQUASENSE · PHÂN TÍCH AI</Text>
            <Text style={[styles.title, { fontSize: fs(22) }]}>Dự báo AI 12h–24h</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRefreshAi(true)}
            style={styles.refreshPill}
          >
            <MaterialIcons name="refresh" size={16} color={colors.primaryDark} />
            <Text style={styles.refreshText}>Cập nhật AI</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pondBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => dispatch(setPondSelectorOpen(true))}
            style={styles.pondSelectBtn}
          >
            <MaterialIcons name="waves" size={18} color={colors.primary} />
            <Text style={[styles.pondSelectText, { fontSize: fs(14) }]} numberOfLines={1}>
              {activePond ? activePond.name : 'Chọn ao nuôi'}
              {activePond?.docDays !== null && activePond?.docDays !== undefined
                ? ` · DOC ${activePond.docDays}`
                : ''}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.segmented}>
          <TouchableOpacity
            onPress={() => setTab('water')}
            style={[styles.segBtn, tab === 'water' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === 'water' && styles.segTextActive]}>
              Chất lượng nước ({horizonHours}h)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('disease')}
            style={[styles.segBtn, tab === 'disease' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === 'disease' && styles.segTextActive]}>
              Nguy cơ dịch bệnh
            </Text>
          </TouchableOpacity>
        </View>

        {!pondId ? (
          <DaylightCard padding={20}>
            <Text style={styles.emptyText}>Vui lòng chọn một ao nuôi để xem dự báo AI.</Text>
          </DaylightCard>
        ) : tab === 'water' ? (
          <View style={styles.tabBody}>
            <View style={styles.horizonRow}>
              {([12, 24] as const).map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setHorizonHours(h)}
                  style={[styles.horizonBtn, horizonHours === h && styles.horizonBtnActive]}
                >
                  <Text
                    style={[styles.horizonText, horizonHours === h && styles.horizonTextActive]}
                  >
                    {h} giờ tới
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {errorWaterQuality ? (
              <DaylightCard tone="danger" padding={14} style={{ gap: 10 }}>
                <Text style={styles.errorText}>{errorWaterQuality}</Text>
                <PrimaryButton
                  title="Thử lại"
                  compact
                  variant="secondary"
                  onPress={() =>
                    dispatch(fetchWaterQualityThunk({ pondId, horizonHours, stepHours: 2, refresh: true }))
                  }
                />
              </DaylightCard>
            ) : null}

            {loadingWaterQuality && !wq ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingLabel}>Đang phân tích chuỗi dữ liệu nước...</Text>
              </View>
            ) : wq ? (
              <>
                <View
                  style={[
                    styles.riskCard,
                    { backgroundColor: wqRiskStyle.bg, borderColor: wqRiskStyle.border },
                  ]}
                >
                  <View style={styles.riskTopRow}>
                    <StatusDot tone={wqRiskStyle.dot} label={`Mức rủi ro: ${wqRiskStyle.label}`} />
                    <Text style={[styles.riskScoreBig, { color: wqRiskStyle.ink }]}>
                      {Math.round(wq.riskScore)}/100
                    </Text>
                  </View>
                  <Text style={[styles.riskMetaLine, { fontSize: fs(12) }]}>
                    Đỉnh rủi ro dự kiến: +{wq.summary?.peakRiskOffsetHours ?? 0}h (
                    {wq.summary?.peakRiskTime
                      ? new Date(wq.summary.peakRiskTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--'}
                    ) · DO TB {Number(wq.summary?.avgDO ?? 0).toFixed(1).replace('.', ',')} mg/L
                  </Text>
                  {wq.isFallback ? (
                    <Text style={styles.fallbackTag}>
                      Nguồn: Mô hình dự phòng cục bộ từ chuỗi đo gần nhất
                    </Text>
                  ) : null}
                </View>

                <View style={styles.metricRow}>
                  {(
                    [
                      { key: 'do', label: 'DO (mg/L)' },
                      { key: 'ph', label: 'Độ pH' },
                      { key: 'temp', label: 'Nhiệt độ (°C)' },
                    ] as const
                  ).map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setWaterMetric(m.key)}
                      style={[styles.metricPill, waterMetric === m.key && styles.metricPillActive]}
                    >
                      <Text
                        style={[
                          styles.metricPillText,
                          waterMetric === m.key && styles.metricPillTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <DaylightCard padding={14} style={{ gap: 10 }}>
                  <View style={styles.chartHeadRow}>
                    <Text style={[styles.cardHeading, { fontSize: fs(15) }]}>
                      Diễn biến dự báo {horizonHours}h tới
                    </Text>
                    <Text style={styles.safeTag}>
                      An toàn {chartConfig.safeMin}–{chartConfig.safeMax} {chartConfig.unit}
                    </Text>
                  </View>

                  <LineChartSvg
                    points={wqPoints}
                    unit={chartConfig.unit}
                    safeMin={chartConfig.safeMin}
                    safeMax={chartConfig.safeMax}
                    lineColor={chartConfig.color}
                    decimals={chartConfig.decimals}
                    height={210}
                  />

                  <View style={styles.summaryStrip}>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Thấp nhất</Text>
                      <Text style={styles.summaryVal}>
                        {waterMetric === 'do'
                          ? wq.summary.minDO
                          : waterMetric === 'ph'
                          ? wq.summary.minPH
                          : wq.summary.minTemperature}
                      </Text>
                    </View>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Cao nhất</Text>
                      <Text style={styles.summaryVal}>
                        {waterMetric === 'do'
                          ? wq.summary.maxDO
                          : waterMetric === 'ph'
                          ? wq.summary.maxPH
                          : wq.summary.maxTemperature}
                      </Text>
                    </View>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Đỉnh rủi ro</Text>
                      <Text style={styles.summaryVal}>+{wq.summary.peakRiskOffsetHours}h</Text>
                    </View>
                  </View>
                </DaylightCard>

                {wq.factors?.length > 0 ? (
                  <DaylightCard padding={14} style={{ gap: 8 }}>
                    <Text style={[styles.cardHeading, { fontSize: fs(15) }]}>Yếu tố ảnh hưởng</Text>
                    {wq.factors.map((f, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <MaterialIcons name="circle" size={7} color={colors.warnDot} />
                        <Text style={[styles.bulletText, { fontSize: fs(13) }]}>{f}</Text>
                      </View>
                    ))}
                  </DaylightCard>
                ) : null}

                {wq.recommendations?.length > 0 ? (
                  <DaylightCard tone="teal" padding={14} style={{ gap: 8 }}>
                    <View style={styles.recHead}>
                      <MaterialIcons name="lightbulb-outline" size={18} color={colors.primaryDark} />
                      <Text style={[styles.cardHeading, { fontSize: fs(15), color: colors.primaryDark }]}>
                        Khuyến nghị vận hành ao
                      </Text>
                    </View>
                    {wq.recommendations.map((r, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <MaterialIcons name="check-circle" size={16} color={colors.primary} />
                        <Text style={[styles.bulletText, { fontSize: fs(13) }]}>{r}</Text>
                      </View>
                    ))}
                  </DaylightCard>
                ) : null}
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.tabBody}>
            {errorDiseaseRisk ? (
              <DaylightCard tone="danger" padding={14} style={{ gap: 10 }}>
                <Text style={styles.errorText}>{errorDiseaseRisk}</Text>
                <PrimaryButton
                  title="Thử lại"
                  compact
                  variant="secondary"
                  onPress={() => dispatch(fetchDiseaseRiskThunk({ pondId, refresh: true }))}
                />
              </DaylightCard>
            ) : null}

            {loadingDiseaseRisk && !dr ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingLabel}>Đang đánh giá rủi ro dịch bệnh...</Text>
              </View>
            ) : dr ? (
              <>
                <View
                  style={[
                    styles.riskCard,
                    { backgroundColor: drRiskStyle.bg, borderColor: drRiskStyle.border },
                  ]}
                >
                  <View style={styles.riskTopRow}>
                    <StatusDot
                      tone={drRiskStyle.dot}
                      label={`Nguy cơ tổng thể: ${drRiskStyle.label}`}
                    />
                    <Text style={[styles.riskScoreBig, { color: drRiskStyle.ink }]}>
                      {Math.round(dr.overallRiskScore)}%
                    </Text>
                  </View>
                  <Text style={[styles.riskMetaLine, { fontSize: fs(12) }]}>
                    {dr.inputSnapshot?.shrimpSpecies || 'Tôm nuôi'}
                    {dr.inputSnapshot?.daysOfCulture !== null &&
                    dr.inputSnapshot?.daysOfCulture !== undefined
                      ? ` · DOC ${dr.inputSnapshot.daysOfCulture}`
                      : ''}
                    {` · Đánh giá lúc ${new Date(dr.assessedAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  </Text>
                </View>

                <DaylightCard padding={12} style={styles.snapshotCard}>
                  <Text style={styles.snapshotTitle}>CHỈ SỐ ĐẦU VÀO MỚI NHẤT</Text>
                  <View style={styles.snapshotGrid}>
                    <Text style={styles.snapItem}>
                      DO: <Text style={styles.snapVal}>{dr.inputSnapshot?.currentDO ?? '--'}</Text>
                    </Text>
                    <Text style={styles.snapItem}>
                      pH: <Text style={styles.snapVal}>{dr.inputSnapshot?.currentPH ?? '--'}</Text>
                    </Text>
                    <Text style={styles.snapItem}>
                      Nhiệt: <Text style={styles.snapVal}>{dr.inputSnapshot?.currentTemp ?? '--'}°C</Text>
                    </Text>
                    <Text style={styles.snapItem}>
                      NH3: <Text style={styles.snapVal}>{dr.inputSnapshot?.nh3 ?? '--'}</Text>
                    </Text>
                    <Text style={styles.snapItem}>
                      NO2: <Text style={styles.snapVal}>{dr.inputSnapshot?.no2 ?? '--'}</Text>
                    </Text>
                  </View>
                </DaylightCard>

                {dr.diseases.map((d) => {
                  const meta = riskMeta(d.riskLevel);
                  const pct = Math.max(0, Math.min(100, Math.round(d.riskScore)));
                  return (
                    <DaylightCard
                      key={d.diseaseCode}
                      tone={
                        d.riskLevel === 'CRITICAL' || d.riskLevel === 'HIGH'
                          ? 'danger'
                          : d.riskLevel === 'MEDIUM'
                          ? 'warning'
                          : 'neutral'
                      }
                      padding={14}
                      style={{ gap: 10 }}
                    >
                      <View style={styles.diseaseHead}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.diseaseName, { fontSize: fs(16) }]}>
                            {d.diseaseName}
                          </Text>
                          <Text style={styles.diseaseCode}>{d.diseaseCode}</Text>
                        </View>
                        <View style={styles.diseaseScoreWrap}>
                          <StatusDot tone={meta.dot} size={9} />
                          <Text style={[styles.diseaseScore, { color: meta.ink }]}>{pct}%</Text>
                        </View>
                      </View>

                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${pct}%`, backgroundColor: meta.ink },
                          ]}
                        />
                      </View>

                      {d.indicators?.length > 0 ? (
                        <View style={styles.innerBox}>
                          <Text style={styles.innerBoxTitle}>DẤU HIỆU / YẾU TỐ THÚC ĐẨY</Text>
                          {d.indicators.map((ind, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                              <MaterialIcons name="circle" size={6} color={meta.ink} />
                              <Text style={[styles.bulletText, { fontSize: fs(12) }]}>{ind}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {d.recommendations?.length > 0 ? (
                        <View style={styles.recInlineBox}>
                          <MaterialIcons name="verified" size={16} color={colors.primary} />
                          <Text style={[styles.recInlineText, { fontSize: fs(13) }]}>
                            {d.recommendations.join(' • ')}
                          </Text>
                        </View>
                      ) : null}
                    </DaylightCard>
                  );
                })}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrow: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  refreshText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  pondBar: {
    flexDirection: 'row',
  },
  pondSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    minHeight: touchTargets.min,
  },
  pondSelectText: {
    flex: 1,
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.control,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segBtnActive: {
    backgroundColor: colors.primary,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  segTextActive: {
    color: '#FFFFFF',
  },
  tabBody: {
    gap: 12,
  },
  horizonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  horizonBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizonBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  horizonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  horizonTextActive: {
    color: colors.primaryDark,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.dangerText,
  },
  riskCard: {
    borderRadius: radii.card,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  riskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskScoreBig: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  riskMetaLine: {
    fontFamily: fontFamily.medium,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  fallbackTag: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.muted,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metricPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  metricPillTextActive: {
    color: '#FFFFFF',
  },
  chartHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeading: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  safeTag: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.safeText,
    fontVariant: ['tabular-nums'],
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.muted,
  },
  summaryVal: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  recHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapshotCard: {
    gap: 8,
  },
  snapshotTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapItem: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
  snapVal: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  diseaseHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  diseaseName: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  diseaseCode: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  diseaseScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diseaseScore: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5ECEB',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  innerBox: {
    backgroundColor: colors.card,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
  },
  innerBoxTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  recInlineBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    padding: 10,
  },
  recInlineText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
});
