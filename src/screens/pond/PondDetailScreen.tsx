import React, { useEffect, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPondDetail,
  mapTelemetryToSensors,
  selectPond,
  SensorMetric,
} from '../../store/slices/pondSlice';
import { fetchManualLogsThunk } from '../../store/slices/cropSlice';
import { setPondSelectorOpen } from '../../store/slices/uiSlice';
import { usePondSubscription } from '../../utils/usePondSubscription';
import { SensorCard } from '../../components/pond/SensorCard';
import { DaylightCard, PrimaryButton, StatusDot, useFontScale } from '../../components/ui';

function fmtTime(iso?: string | null): string {
  if (!iso) return '--';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatAlertMessage(msg?: string | null): string {
  if (!msg) return '';
  return msg
    .replace(/\bdissolvedOxygen\b/gi, 'Oxy hòa tan (DO)')
    .replace(/\btemperature\b/gi, 'Nhiệt độ')
    .replace(/\bsalinity\b/gi, 'Độ mặn')
    .replace(/\bturbidity\b/gi, 'Độ đục')
    .replace(/\bwaterLevel\b/gi, 'Mực nước');
}

export const PondDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const routePondId = route?.params?.pondId as string | undefined;
  const { ponds, selectedPondId, thresholdsMap, latestTelemetryMap } = useAppSelector(
    (state) => state.pond
  );
  const manualLogsByPond = useAppSelector((state) => state.crop.manualLogsByPond);
  const alerts = useAppSelector((state) => state.alert.alerts);

  const activePond = useMemo(() => {
    const id = routePondId || selectedPondId;
    return ponds.find((p) => p.id === id) || ponds[0] || null;
  }, [ponds, routePondId, selectedPondId]);

  const pondId = activePond?.id;

  usePondSubscription(pondId);

  useEffect(() => {
    if (pondId) {
      if (selectedPondId !== pondId) {
        dispatch(selectPond(pondId));
      }
      dispatch(fetchPondDetail(pondId));
      dispatch(fetchManualLogsThunk(pondId));
    }
  }, [pondId, dispatch, selectedPondId]);

  const sensors = useMemo(() => {
    if (!activePond) return mapTelemetryToSensors(null);
    const telemetry =
      latestTelemetryMap[activePond.id] ||
      (activePond.deviceId ? latestTelemetryMap[activePond.deviceId] : null);
    return mapTelemetryToSensors(telemetry, thresholdsMap[activePond.id]);
  }, [activePond, latestTelemetryMap, thresholdsMap]);

  const sensorRows = useMemo(() => {
    const rows: SensorMetric[][] = [];
    for (let i = 0; i < sensors.length; i += 2) {
      rows.push(sensors.slice(i, i + 2));
    }
    return rows;
  }, [sensors]);

  const latestManualLog = useMemo(() => {
    if (!pondId) return null;
    const logs = manualLogsByPond[pondId] || [];
    return logs[0] || null;
  }, [pondId, manualLogsByPond]);

  const activePondAlert = useMemo(() => {
    if (!pondId) return null;
    return alerts.find((a) => a.pondId === pondId && a.status === 'ACTIVE') || null;
  }, [pondId, alerts]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    if (!pondId) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchPondDetail(pondId)),
      dispatch(fetchManualLogsThunk(pondId)),
    ]);
    setRefreshing(false);
  };

  if (!activePond) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { fontSize: fs(15) }]}>
            Chưa có dữ liệu ao nuôi.
          </Text>
          <PrimaryButton title="Quay lại" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const headerStatusText =
    activePond.status === 'CRITICAL'
      ? 'Nguy hiểm'
      : activePond.status === 'WARNING'
      ? 'Cần chú ý'
      : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Quay lại"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => dispatch(setPondSelectorOpen(true))}
          style={styles.pondTitleBtn}
        >
          <Text style={[styles.topTitle, { fontSize: fs(17) }]} numberOfLines={1}>
            {activePond.name}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.primary} />
        </TouchableOpacity>

        {headerStatusText ? (
          <View
            style={[
              styles.headerBadge,
              activePond.status === 'CRITICAL' ? styles.badgeDanger : styles.badgeWarn,
            ]}
          >
            <MaterialIcons
              name="warning-amber"
              size={14}
              color={activePond.status === 'CRITICAL' ? colors.dangerText : colors.warnText}
            />
            <Text
              style={[
                styles.headerBadgeText,
                {
                  color:
                    activePond.status === 'CRITICAL' ? colors.dangerText : colors.warnText,
                },
              ]}
            >
              {headerStatusText}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ThresholdsNotifications', { pondId: activePond.id })
          }
          style={styles.iconBtn}
          accessibilityLabel="Cài đặt ngưỡng ao"
        >
          <MaterialIcons name="tune" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <DaylightCard padding={14}>
          <Text style={[styles.cropTitle, { fontSize: fs(15) }]}>
            {activePond.shrimpSpecies || 'Ao nuôi thương phẩm'}
            {activePond.docDays !== null ? ` · Ngày nuôi DOC ${activePond.docDays}` : ''}
            {` · ${activePond.areaM2} m² (sâu ${activePond.depthM} m)`}
          </Text>
          <View style={styles.deviceLine}>
            <Text style={[styles.deviceMeta, { fontSize: fs(12) }]} numberOfLines={1}>
              {activePond.deviceName || 'Chưa gắn trạm ESP32'}
              {activePond.recordedAt ? ` · Đồng bộ ${fmtTime(activePond.recordedAt)}` : ''}
            </Text>
            <StatusDot
              tone={
                activePond.deviceStatus === 'ONLINE'
                  ? 'safe'
                  : activePond.deviceStatus === 'MAINTENANCE'
                  ? 'warning'
                  : 'offline'
              }
              label={
                activePond.deviceStatus === 'ONLINE'
                  ? 'Đang hoạt động'
                  : activePond.deviceStatus === 'MAINTENANCE'
                  ? 'Đang bảo trì'
                  : 'Mất kết nối'
              }
            />
          </View>
        </DaylightCard>

        <View style={styles.sensorGrid}>
          {sensorRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.sensorRow}>
              {row.map((sensor) => (
                <SensorCard key={sensor.id} sensor={sensor} />
              ))}
              {row.length === 1 ? <View style={styles.sensorSpacer} /> : null}
            </View>
          ))}
        </View>

        <DaylightCard padding={14} style={styles.testKitCard}>
          <View style={styles.testKitHeader}>
            <Text style={[styles.testKitTitle, { fontSize: fs(15) }]}>
              Kết quả đo tay gần nhất · Test Kit
            </Text>
            <Text style={[styles.testKitTime, { fontSize: fs(12) }]}>
              {latestManualLog
                ? `${new Date(latestManualLog.testedAt).toLocaleDateString('vi-VN')} ${fmtTime(
                    latestManualLog.testedAt
                  )}`
                : 'Chưa có bản ghi'}
            </Text>
          </View>

          {latestManualLog ? (
            <View style={styles.testKitBadges}>
              <View
                style={[
                  styles.kitPill,
                  latestManualLog.nh3Value >= 0.1 ? styles.kitPillWarn : styles.kitPillSafe,
                ]}
              >
                <MaterialIcons
                  name={latestManualLog.nh3Value >= 0.1 ? 'warning-amber' : 'check-circle'}
                  size={16}
                  color={latestManualLog.nh3Value >= 0.1 ? colors.warnText : colors.safeText}
                />
                <Text style={[styles.kitPillText, { fontSize: fs(13) }]}>
                  NH3: {Number(latestManualLog.nh3Value).toFixed(2).replace('.', ',')} mg/L
                </Text>
              </View>

              <View
                style={[
                  styles.kitPill,
                  latestManualLog.no2Value >= 0.5 ? styles.kitPillWarn : styles.kitPillSafe,
                ]}
              >
                <MaterialIcons
                  name={latestManualLog.no2Value >= 0.5 ? 'warning-amber' : 'check-circle'}
                  size={16}
                  color={latestManualLog.no2Value >= 0.5 ? colors.warnText : colors.safeText}
                />
                <Text style={[styles.kitPillText, { fontSize: fs(13) }]}>
                  NO2: {Number(latestManualLog.no2Value).toFixed(2).replace('.', ',')} mg/L
                </Text>
              </View>
            </View>
          ) : null}

          <PrimaryButton
            title="+ Nhập đo tay mới & Nhật ký vụ nuôi"
            variant="ghost"
            compact
            onPress={() =>
              navigation.navigate('ManualLogCrop', {
                pondId: activePond.id,
                initialTab: 'testkit',
              })
            }
          />
        </DaylightCard>

        {activePondAlert ? (
          <DaylightCard
            tone={activePondAlert.alertLevel === 'CRITICAL' ? 'danger' : 'warning'}
            padding={14}
          >
            <View style={styles.alertBoxHead}>
              <MaterialIcons
                name="warning-amber"
                size={20}
                color={
                  activePondAlert.alertLevel === 'CRITICAL'
                    ? colors.dangerText
                    : colors.warnText
                }
              />
              <Text
                style={[
                  styles.alertHeadline,
                  {
                    fontSize: fs(14),
                    color:
                      activePondAlert.alertLevel === 'CRITICAL'
                        ? colors.dangerText
                        : colors.warnText,
                  },
                ]}
              >
                {formatAlertMessage(activePondAlert.message) ||
                  `Cảnh báo ${formatAlertMessage(activePondAlert.metricName)}: ${activePondAlert.triggeredValue}`}
              </Text>
            </View>
            {activePondAlert.recommendation?.actionSuggestion ? (
              <View style={styles.recBox}>
                <MaterialIcons name="lightbulb-outline" size={18} color={colors.primary} />
                <Text style={[styles.recText, { fontSize: fs(13) }]}>
                  Khuyến nghị AI: {activePondAlert.recommendation.actionSuggestion}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'Alerts' })}
              style={styles.alertLinkBtn}
            >
              <Text style={[styles.alertLinkText, { fontSize: fs(13) }]}>
                Xem trung tâm cảnh báo →
              </Text>
            </TouchableOpacity>
          </DaylightCard>
        ) : null}

        <View style={styles.bottomActions}>
          <PrimaryButton
            title="Dự báo AI 24h"
            iconName="auto-awesome"
            style={styles.halfBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'AiForecast' })}
          />
          <PrimaryButton
            title="Cài ngưỡng"
            iconName="tune"
            variant="ghost"
            style={styles.halfBtn}
            onPress={() =>
              navigation.navigate('ThresholdsNotifications', { pondId: activePond.id })
            }
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Devices' })}
          style={styles.deviceLinkCard}
        >
          <MaterialIcons name="sensors" size={20} color={colors.primary} />
          <Text style={[styles.deviceLinkText, { fontSize: fs(14) }]}>
            Xem trạm đo ESP32 & Biểu đồ 24h của ao này
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  iconBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  pondTitleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: touchTargets.min,
  },
  topTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  badgeWarn: {
    backgroundColor: colors.warnBg,
  },
  badgeDanger: {
    backgroundColor: colors.dangerBg,
  },
  headerBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  cropTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  deviceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  deviceMeta: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  sensorGrid: {
    gap: 10,
  },
  sensorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sensorSpacer: {
    flex: 1,
  },
  testKitCard: {
    gap: 10,
  },
  testKitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  testKitTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    flex: 1,
  },
  testKitTime: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  testKitBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  kitPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radii.control,
    borderWidth: 1,
  },
  kitPillSafe: {
    backgroundColor: colors.safeBg,
    borderColor: colors.safeBorder,
  },
  kitPillWarn: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
  },
  kitPillText: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  alertBoxHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertHeadline: {
    flex: 1,
    fontFamily: fontFamily.bold,
    lineHeight: 20,
  },
  recBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  recText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  alertLinkBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
  alertLinkText: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  halfBtn: {
    flex: 1,
  },
  deviceLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    minHeight: touchTargets.cta,
  },
  deviceLinkText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
  },
});
