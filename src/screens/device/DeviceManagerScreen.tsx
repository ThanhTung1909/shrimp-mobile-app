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
import { Role } from '../../services/authApi';
import { DeviceBackend } from '../../services/deviceApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDeviceHistoryThunk,
  fetchDevicesThunk,
  updateDeviceStatusThunk,
} from '../../store/slices/deviceSlice';
import { setPondSelectorOpen, showToast } from '../../store/slices/uiSlice';
import {
  AquaToggleSwitch,
  DaylightCard,
  LineChartPoint,
  LineChartSvg,
  PrimaryButton,
  StatusDot,
  useFontScale,
} from '../../components/ui';
import { ReportFaultModal } from '../../components/modals/ReportFaultModal';

type MetricChartKey = 'do' | 'ph' | 'temp' | 'salinity' | 'turbidity';

const METRIC_META: Record<
  MetricChartKey,
  { label: string; shortLabel: string; unit: string; safeMin: number; safeMax: number; decimals: number }
> = {
  do: { label: 'Oxy (DO)', shortLabel: 'DO mg/L', unit: 'mg/L', safeMin: 4.0, safeMax: 8.0, decimals: 2 },
  ph: { label: 'Độ pH', shortLabel: 'Độ pH', unit: 'pH', safeMin: 7.0, safeMax: 8.5, decimals: 2 },
  temp: { label: 'Nhiệt độ', shortLabel: 'Nhiệt độ', unit: '°C', safeMin: 26.0, safeMax: 32.0, decimals: 1 },
  salinity: { label: 'Độ mặn', shortLabel: 'Độ mặn', unit: 'ppt', safeMin: 10.0, safeMax: 25.0, decimals: 1 },
  turbidity: { label: 'Độ đục', shortLabel: 'Độ đục', unit: 'NTU', safeMin: 0, safeMax: 40, decimals: 1 },
};

function extractMetricVal(record: any, key: MetricChartKey): number | null {
  let raw: any;
  if (key === 'do') raw = record.dissolvedOxygen ?? record.dissolved_oxygen ?? record.do;
  if (key === 'ph') raw = record.ph ?? record.phValue ?? record.ph_value;
  if (key === 'temp') raw = record.temperature ?? record.temp ?? record.temperature_celsius;
  if (key === 'salinity') raw = record.salinity ?? record.sal ?? record.salinity_ppt;
  if (key === 'turbidity') raw = record.turbidity ?? record.turb ?? record.turbidity_ntu;
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  return isNaN(num) ? null : num;
}

export const DeviceManagerScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const { devices, historyMap, loading, historyLoading, updatingStatusId } = useAppSelector(
    (state) => state.device
  );
  const { ponds, selectedPondId } = useAppSelector((state) => state.pond);
  const role = useAppSelector((state) => state.user.role || state.auth.role);
  const isManager = role === Role.MANAGER || role === Role.ADMIN;

  const [viewTab, setViewTab] = useState<'stations' | 'chart'>('stations');
  const [filterBySelectedPond, setFilterBySelectedPond] = useState(false);
  const [chartDeviceId, setChartDeviceId] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<MetricChartKey>('do');
  const [hours, setHours] = useState<6 | 12 | 24>(24);
  const [faultTarget, setFaultTarget] = useState<DeviceBackend | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchDevicesThunk());
  }, [dispatch]);

  const pondMap = useMemo(() => {
    const map: Record<string, string> = {};
    ponds.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [ponds]);

  const getPondName = (d: DeviceBackend): string =>
    d.pond?.pondName || (d.pondId ? pondMap[d.pondId] : '') || 'Chưa gán ao';

  const visibleDevices = useMemo(() => {
    if (filterBySelectedPond && selectedPondId) {
      return devices.filter((d) => d.pondId === selectedPondId);
    }
    return devices;
  }, [devices, filterBySelectedPond, selectedPondId]);

  const activeChartDevice = useMemo(() => {
    if (chartDeviceId && visibleDevices.some((d) => d.deviceId === chartDeviceId)) {
      return visibleDevices.find((d) => d.deviceId === chartDeviceId) || null;
    }
    const pool = visibleDevices.length > 0 ? visibleDevices : devices;
    if (selectedPondId) {
      const onlinePondMatch = pool.find((d) => d.pondId === selectedPondId && d.status === 'ONLINE');
      if (onlinePondMatch) return onlinePondMatch;
      const pondMatch = pool.find((d) => d.pondId === selectedPondId);
      if (pondMatch) return pondMatch;
    }
    return pool.find((d) => d.status === 'ONLINE') || pool[0] || null;
  }, [chartDeviceId, visibleDevices, devices, selectedPondId]);

  useEffect(() => {
    if (activeChartDevice?.deviceId) {
      dispatch(
        fetchDeviceHistoryThunk({
          deviceId: activeChartDevice.deviceId,
          hours,
        })
      );
    }
  }, [activeChartDevice?.deviceId, hours, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDevicesThunk());
    if (activeChartDevice?.deviceId) {
      await dispatch(
        fetchDeviceHistoryThunk({
          deviceId: activeChartDevice.deviceId,
          hours,
        })
      );
    }
    setRefreshing(false);
  };

  const handleToggleMaintenance = async (device: DeviceBackend, nextMaint: boolean) => {
    const nextStatus = nextMaint ? 'MAINTENANCE' : 'ONLINE';
    const res = await dispatch(
      updateDeviceStatusThunk({ deviceId: device.deviceId, status: nextStatus })
    );
    if (updateDeviceStatusThunk.fulfilled.match(res)) {
      dispatch(
        showToast({
          text: nextMaint
            ? `${device.deviceName} đã chuyển sang Chế độ bảo trì.`
            : `${device.deviceName} đã hoạt động trở lại.`,
          tone: nextMaint ? 'warning' : 'safe',
        })
      );
    } else {
      dispatch(
        showToast({
          text: (res.payload as string) || 'Không thể đổi trạng thái thiết bị.',
          tone: 'danger',
        })
      );
    }
  };

  const counts = useMemo(
    () => ({
      online: devices.filter((d) => d.status === 'ONLINE').length,
      maint: devices.filter((d) => d.status === 'MAINTENANCE').length,
      offline: devices.filter((d) => d.status === 'OFFLINE').length,
    }),
    [devices]
  );

  const historyRecords = activeChartDevice ? historyMap[activeChartDevice.deviceId] || [] : [];

  const chartPoints: LineChartPoint[] = useMemo(() => {
    const list: LineChartPoint[] = [];
    historyRecords.forEach((rec) => {
      const val = extractMetricVal(rec, chartMetric);
      if (val === null) return;
      const dt = new Date(rec.recordedAt || rec.recorded_at || '');
      const xLabel = isNaN(dt.getTime())
        ? '--'
        : dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      list.push({
        xLabel,
        value: val,
        subLabel: isNaN(dt.getTime()) ? undefined : dt.toLocaleDateString('vi-VN'),
      });
    });
    // Downsample evenly to max 20 readable points on mobile chart
    if (list.length <= 20) return list;
    const step = Math.ceil(list.length / 20);
    return list.filter((_, idx) => idx % step === 0 || idx === list.length - 1);
  }, [historyRecords, chartMetric]);

  const metricSummary = useMemo(() => {
    if (chartPoints.length === 0) return null;
    const vals = chartPoints.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const latest = vals[vals.length - 1];
    return { min, max, avg, latest };
  }, [chartPoints]);

  const activePondName =
    (selectedPondId ? pondMap[selectedPondId] : '') || 'Tất cả ao nuôi';

  const meta = METRIC_META[chartMetric];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.topHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.headerTitle, { fontSize: fs(21) }]}>Thiết bị & Lịch sử đo</Text>
            <Text style={[styles.headerSub, { fontSize: fs(13) }]}>
              Quản lý trạm đo ESP32 và biểu đồ cảm biến 24h
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.refreshIconBtn}
            accessibilityLabel="Làm mới thiết bị"
          >
            <MaterialIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterControls}>
          <TouchableOpacity
            onPress={() => dispatch(setPondSelectorOpen(true))}
            style={styles.pondPill}
          >
            <MaterialIcons name="waves" size={16} color={colors.primary} />
            <Text style={[styles.pondPillText, { fontSize: fs(13) }]} numberOfLines={1}>
              {activePondName}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterBySelectedPond((v) => !v)}
            style={[styles.scopeToggle, filterBySelectedPond && styles.scopeToggleActive]}
          >
            <Text
              style={[
                styles.scopeToggleText,
                filterBySelectedPond && styles.scopeToggleTextActive,
              ]}
            >
              {filterBySelectedPond ? 'Đang lọc theo ao' : 'Hiện tất cả ao'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewTabRow}>
          <TouchableOpacity
            onPress={() => setViewTab('stations')}
            style={[styles.viewTabBtn, viewTab === 'stations' && styles.viewTabBtnActive]}
          >
            <MaterialIcons
              name="sensors"
              size={16}
              color={viewTab === 'stations' ? '#FFFFFF' : colors.ink}
            />
            <Text style={[styles.viewTabText, viewTab === 'stations' && styles.viewTabTextActive]}>
              Trạm đo ({visibleDevices.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewTab('chart')}
            style={[styles.viewTabBtn, viewTab === 'chart' && styles.viewTabBtnActive]}
          >
            <MaterialIcons
              name="show-chart"
              size={16}
              color={viewTab === 'chart' ? '#FFFFFF' : colors.ink}
            />
            <Text style={[styles.viewTabText, viewTab === 'chart' && styles.viewTabTextActive]}>
              Biểu đồ 24h
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: '#EAF8EF', borderColor: '#B7E4C7' }]}>
            <StatusDot tone="safe" label={`${counts.online} Hoạt động`} />
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.warnBg, borderColor: '#FCD34D' }]}>
            <StatusDot tone="warning" label={`${counts.maint} Bảo trì`} />
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.dangerBg, borderColor: '#FCA5A5' }]}>
            <StatusDot tone="danger" label={`${counts.offline} Mất kết nối`} />
          </View>
        </View>

        {viewTab === 'stations' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: fs(15) }]}>
                Danh sách trạm quan trắc bờ ao
              </Text>
              <Text style={styles.sectionCount}>{visibleDevices.length} trạm</Text>
            </View>

        {loading && devices.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : visibleDevices.length === 0 ? (
          <DaylightCard padding={20}>
            <Text style={styles.emptyText}>Không có thiết bị ESP32 nào trong bộ lọc này.</Text>
          </DaylightCard>
        ) : (
          <View style={styles.deviceList}>
            {visibleDevices.map((device) => {
              const isMaint = device.status === 'MAINTENANCE';
              const isOff = device.status === 'OFFLINE';
              const tone = isOff ? 'danger' : isMaint ? 'warning' : 'neutral';

              return (
                <DaylightCard key={device.deviceId} tone={tone} padding={14} style={styles.devCard}>
                  <View style={styles.devTopRow}>
                    <View
                      style={[
                        styles.devIconBox,
                        isMaint && { backgroundColor: '#FEF3C7' },
                        isOff && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <MaterialIcons
                        name={isOff ? 'sensors-off' : isMaint ? 'build' : 'memory'}
                        size={22}
                        color={
                          isOff
                            ? colors.dangerText
                            : isMaint
                            ? colors.warnText
                            : colors.primary
                        }
                      />
                    </View>
                    <View style={styles.devInfo}>
                      <Text style={[styles.devName, { fontSize: fs(16) }]}>{device.deviceName}</Text>
                      <Text style={[styles.devMeta, { fontSize: fs(12) }]}>
                        MAC: {device.macAddress}
                        {device.firmwareVersion ? ` · FW ${device.firmwareVersion}` : ''}
                      </Text>
                    </View>
                    <StatusDot
                      tone={isOff ? 'danger' : isMaint ? 'warning' : 'safe'}
                      size={10}
                    />
                  </View>

                  <View style={styles.devMetaBox}>
                    <Text style={[styles.devPondText, { fontSize: fs(13) }]}>
                      Ao gán: <Text style={{ fontFamily: fontFamily.bold }}>{getPondName(device)}</Text>
                      {device.lastActiveAt
                        ? ` · Tín hiệu gần nhất ${new Date(device.lastActiveAt).toLocaleString(
                            'vi-VN'
                          )}`
                        : ' · Chưa có tín hiệu'}
                    </Text>
                  </View>

                  {isManager ? (
                    <View style={styles.maintRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.maintLabel, { fontSize: fs(14) }]}>
                          Chế độ bảo trì (rửa đầu dò)
                        </Text>
                        <Text style={styles.maintSub}>
                          Tạm dừng kích hoạt cảnh báo giả khi vệ sinh cảm biến
                        </Text>
                      </View>
                      <AquaToggleSwitch
                        value={isMaint}
                        disabled={updatingStatusId === device.deviceId}
                        onValueChange={(next) => handleToggleMaintenance(device, next)}
                        accessibilityLabel={`Chế độ bảo trì ${device.deviceName}`}
                      />
                    </View>
                  ) : null}

                  <View style={styles.devActionRow}>
                    <PrimaryButton
                      title="Báo hỏng cảm biến"
                      iconName="build"
                      variant={isOff ? 'danger' : 'ghost'}
                      compact
                      style={{ flex: 1 }}
                      onPress={() => setFaultTarget(device)}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setChartDeviceId(device.deviceId);
                        setViewTab('chart');
                      }}
                      style={[
                        styles.chartPickBtn,
                        activeChartDevice?.deviceId === device.deviceId && styles.chartPickBtnActive,
                      ]}
                    >
                      <MaterialIcons
                        name="show-chart"
                        size={18}
                        color={
                          activeChartDevice?.deviceId === device.deviceId
                            ? '#FFFFFF'
                            : colors.primaryDark
                        }
                      />
                      <Text
                        style={[
                          styles.chartPickText,
                          activeChartDevice?.deviceId === device.deviceId && { color: '#FFFFFF' },
                        ]}
                      >
                        Biểu đồ
                      </Text>
                    </TouchableOpacity>
                  </View>
                </DaylightCard>
              );
            })}
          </View>
        )}
          </>
        ) : (
          <>
        <View style={styles.chartSectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { fontSize: fs(16) }]}>
              Biểu đồ {hours}h · {activeChartDevice ? getPondName(activeChartDevice) : '--'}
            </Text>
            <Text style={styles.sectionSub}>
              {activeChartDevice
                ? `${activeChartDevice.deviceName} (${activeChartDevice.macAddress})`
                : 'Chọn trạm đo để xem lịch sử'}
            </Text>
          </View>
          <StatusDot tone="safe" label="Dữ liệu thực" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricTabs}
        >
          {(Object.keys(METRIC_META) as MetricChartKey[]).map((key) => {
            const active = chartMetric === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setChartMetric(key)}
                style={[styles.metricTab, active && styles.metricTabActive]}
              >
                <Text style={[styles.metricTabText, active && styles.metricTabTextActive]}>
                  {METRIC_META[key].shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.timeframeRow}>
          {([6, 12, 24] as const).map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => setHours(h)}
              style={[styles.timeChip, hours === h && styles.timeChipActive]}
            >
              <Text style={[styles.timeChipText, hours === h && styles.timeChipTextActive]}>
                {h} giờ
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <DaylightCard padding={14} style={styles.chartCard}>
          <View style={styles.chartTopRow}>
            <View style={styles.latestValRow}>
              <Text style={[styles.latestVal, { fontSize: fs(26) }]}>
                {metricSummary
                  ? metricSummary.latest.toFixed(meta.decimals).replace('.', ',')
                  : '--'}
              </Text>
              <Text style={styles.latestUnit}>{meta.unit}</Text>
            </View>
            <Text style={styles.safeCaption}>
              Vùng an toàn {meta.safeMin}–{meta.safeMax} {meta.unit}
            </Text>
          </View>

          {historyLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <LineChartSvg
              points={chartPoints}
              unit={meta.unit}
              safeMin={meta.safeMin}
              safeMax={meta.safeMax}
              decimals={meta.decimals}
              height={210}
              emptyText={`Chưa có dữ liệu ${meta.label} trong ${hours} giờ qua`}
            />
          )}

          {metricSummary ? (
            <View style={styles.statsStrip}>
              <View style={styles.statCell}>
                <Text style={styles.statCellLabel}>Thấp nhất</Text>
                <Text style={styles.statCellVal}>
                  {metricSummary.min.toFixed(meta.decimals).replace('.', ',')} {meta.unit}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statCellLabel}>Trung bình</Text>
                <Text style={styles.statCellVal}>
                  {metricSummary.avg.toFixed(meta.decimals).replace('.', ',')} {meta.unit}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statCellLabel}>Cao nhất</Text>
                <Text style={styles.statCellVal}>
                  {metricSummary.max.toFixed(meta.decimals).replace('.', ',')} {meta.unit}
                </Text>
              </View>
            </View>
          ) : null}
        </DaylightCard>
          </>
        )}
      </ScrollView>

      <ReportFaultModal
        visible={faultTarget !== null}
        device={faultTarget}
        pondName={faultTarget ? getPondName(faultTarget) : undefined}
        onClose={() => setFaultTarget(null)}
      />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  headerSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
  refreshIconBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pondPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  pondPillText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  scopeToggle: {
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  scopeToggleActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  scopeToggleText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  scopeToggleTextActive: {
    color: colors.primaryDark,
  },
  viewTabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.control,
    padding: 4,
    gap: 4,
  },
  viewTabBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewTabBtnActive: {
    backgroundColor: colors.primary,
  },
  viewTabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  viewTabTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  sectionSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  sectionCount: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.muted,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  deviceList: {
    gap: 12,
  },
  devCard: {
    gap: 10,
  },
  devTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  devIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devInfo: {
    flex: 1,
    gap: 2,
  },
  devName: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  devMeta: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  devMetaBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.control,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devPondText: {
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  maintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  maintLabel: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  maintSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  devActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chartPickBtn: {
    minHeight: touchTargets.min,
    paddingHorizontal: 14,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartPickBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chartPickText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  chartSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  metricTabs: {
    gap: 8,
  },
  metricTab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  metricTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metricTabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  metricTabTextActive: {
    color: '#FFFFFF',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  timeChipTextActive: {
    color: colors.primaryDark,
  },
  chartCard: {
    gap: 10,
  },
  chartTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  latestValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  latestVal: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  latestUnit: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
  safeCaption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.safeText,
    fontVariant: ['tabular-nums'],
  },
  chartLoading: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statCellLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.muted,
  },
  statCellVal: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
