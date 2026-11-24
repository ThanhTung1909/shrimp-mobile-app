import React, { useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, shadows, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPonds, selectPond } from '../../store/slices/pondSlice';
import { fetchAlertsThunk } from '../../store/slices/alertSlice';
import { fetchDevicesThunk } from '../../store/slices/deviceSlice';
import { setPondSelectorOpen } from '../../store/slices/uiSlice';
import { PondCard } from '../../components/pond/PondCard';
import { PrimaryButton, StatusDot, useFontScale } from '../../components/ui';

type FilterMode = 'ALL' | 'ATTENTION' | 'SAFE' | 'EMPTY';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const user = useAppSelector((state) => state.user);
  const { farms, ponds, thresholdsMap, lastSyncTime, loading, error } = useAppSelector(
    (state) => state.pond
  );
  const { alerts, unreadAlertCount } = useAppSelector((state) => state.alert);
  const devices = useAppSelector((state) => state.device.devices);
  const { socketConnected, selectedFarmId } = useAppSelector((state) => state.ui);

  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchPonds()),
      dispatch(fetchAlertsThunk()),
      dispatch(fetchDevicesThunk()),
    ]);
    setRefreshing(false);
  };

  const selectedFarmName = useMemo(() => {
    if (!selectedFarmId) {
      return farms.length === 1 ? farms[0].farmName : 'Tất cả ao nuôi';
    }
    return farms.find((f) => f.farmId === selectedFarmId)?.farmName || 'Tất cả ao nuôi';
  }, [farms, selectedFarmId]);

  const farmScopedPonds = useMemo(() => {
    if (!selectedFarmId) return ponds;
    return ponds.filter((p) => {
      if (p.farmId) return p.farmId === selectedFarmId;
      const farm = farms.find((f) => f.farmId === selectedFarmId);
      return farm?.ponds?.some((fp) => fp.pondId === p.id) ?? true;
    });
  }, [ponds, farms, selectedFarmId]);

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.status === 'ACTIVE'),
    [alerts]
  );

  const stats = useMemo(() => {
    const safeCount = farmScopedPonds.filter((p) => p.status === 'SAFE').length;
    const attentionCount = farmScopedPonds.filter(
      (p) => p.status === 'WARNING' || p.status === 'CRITICAL'
    ).length;
    const emptyCount = farmScopedPonds.filter(
      (p) => p.status === 'EMPTY' || p.status === 'OFFLINE'
    ).length;
    const onlineDevices = devices.filter((d) => d.status === 'ONLINE').length;
    return {
      allCount: farmScopedPonds.length,
      safeCount,
      attentionCount,
      emptyCount,
      alertCount: activeAlerts.length > 0 ? activeAlerts.length : unreadAlertCount,
      onlineDevices,
      totalDevices: devices.length,
    };
  }, [farmScopedPonds, devices, activeAlerts, unreadAlertCount]);

  const filteredPonds = useMemo(() => {
    return farmScopedPonds.filter((p) => {
      if (filterMode === 'ATTENTION') return p.status === 'WARNING' || p.status === 'CRITICAL';
      if (filterMode === 'SAFE') return p.status === 'SAFE';
      if (filterMode === 'EMPTY') return p.status === 'EMPTY' || p.status === 'OFFLINE';
      return true;
    });
  }, [farmScopedPonds, filterMode]);

  const firstAttentionPond = useMemo(
    () =>
      farmScopedPonds.find((p) => p.status === 'CRITICAL' || p.status === 'WARNING') ||
      null,
    [farmScopedPonds]
  );

  const greetingName = useMemo(() => {
    if (!user.fullName) return 'bạn';
    const parts = user.fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || user.fullName;
  }, [user.fullName]);

  const handleOpenPond = (pondId: string) => {
    dispatch(selectPond(pondId));
    navigation.navigate('PondDetail', { pondId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.greetingCol}>
            <Text style={[styles.greetingText, { fontSize: fs(23) }]} numberOfLines={1}>
              Chào {greetingName}
            </Text>
            <View style={styles.syncLine}>
              <StatusDot tone={socketConnected ? 'safe' : 'warning'} size={8} />
              <Text style={[styles.syncText, { fontSize: fs(12) }]}>
                {socketConnected ? 'Đồng bộ trực tuyến' : 'Đang đồng bộ'}
                {lastSyncTime ? ` · ${lastSyncTime}` : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Alerts')}
            style={styles.bellBtn}
            accessibilityLabel="Mở trung tâm cảnh báo"
          >
            <MaterialIcons name="notifications-none" size={24} color={colors.ink} />
            {stats.alertCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {stats.alertCount > 9 ? '9+' : stats.alertCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.selectorRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => dispatch(setPondSelectorOpen(true))}
            style={styles.farmPill}
          >
            <MaterialIcons name="location-on" size={16} color={colors.dangerText} />
            <Text style={[styles.farmPillText, { fontSize: fs(13) }]} numberOfLines={1}>
              {selectedFarmName}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRefresh}
            style={styles.refreshChip}
            accessibilityLabel="Làm mới dữ liệu"
          >
            <MaterialIcons name="refresh" size={18} color={colors.primary} />
            <Text style={[styles.refreshChipText, { fontSize: fs(12) }]}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        {(stats.alertCount > 0 || firstAttentionPond) && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              firstAttentionPond
                ? handleOpenPond(firstAttentionPond.id)
                : navigation.navigate('Alerts')
            }
            style={styles.urgentBanner}
          >
            <View style={styles.urgentIcon}>
              <MaterialIcons name="warning-amber" size={20} color={colors.dangerText} />
            </View>
            <View style={styles.urgentBody}>
              <Text style={[styles.urgentTitle, { fontSize: fs(14) }]} numberOfLines={1}>
                {firstAttentionPond
                  ? `${firstAttentionPond.name} cần kiểm tra ngay`
                  : `Có ${stats.alertCount} cảnh báo đang chờ xử lý`}
              </Text>
              <Text style={[styles.urgentSub, { fontSize: fs(12) }]} numberOfLines={1}>
                {firstAttentionPond
                  ? `DO ${
                      firstAttentionPond.doValue !== null
                        ? `${firstAttentionPond.doValue.toFixed(1).replace('.', ',')} mg/L`
                        : '--'
                    } · Nhiệt độ ${
                      firstAttentionPond.temp !== null
                        ? `${firstAttentionPond.temp.toFixed(1).replace('.', ',')}°C`
                        : '--'
                    }`
                  : activeAlerts[0]?.message || 'Nhấn để xem khuyến nghị xử lý AI'}
              </Text>
            </View>
            <Text style={[styles.urgentAction, { fontSize: fs(13) }]}>Xem ngay →</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(
            [
              { key: 'ALL', label: `Tất cả (${stats.allCount})`, dotColor: null },
              {
                key: 'ATTENTION',
                label: `Cần chú ý (${stats.attentionCount})`,
                dotColor: colors.warnDot,
              },
              { key: 'SAFE', label: `Ổn định (${stats.safeCount})`, dotColor: colors.safeDot },
              { key: 'EMPTY', label: `Ao trống (${stats.emptyCount})`, dotColor: colors.offlineDot },
            ] as const
          ).map((chip) => {
            const active = filterMode === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                activeOpacity={0.8}
                onPress={() => setFilterMode(chip.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                {chip.dotColor ? (
                  <View
                    style={[
                      styles.chipDot,
                      {
                        backgroundColor: active ? 'rgba(255,255,255,0.92)' : chip.dotColor,
                      },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    styles.filterChipText,
                    { fontSize: fs(13) },
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>DANH SÁCH AO NUÔI</Text>
          <View style={styles.sectionMetaRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Devices')}
              style={[
                styles.stationPill,
                stats.onlineDevices === 0 && styles.stationPillWarn,
              ]}
            >
              <MaterialIcons
                name="sensors"
                size={13}
                color={stats.onlineDevices > 0 ? colors.primaryDark : colors.warnText}
              />
              <Text
                style={[
                  styles.stationPillText,
                  { fontSize: fs(11) },
                  stats.onlineDevices === 0 && { color: colors.warnText },
                ]}
              >
                {stats.onlineDevices}/{stats.totalDevices} trạm
              </Text>
            </TouchableOpacity>
            <Text style={[styles.sectionCount, { fontSize: fs(12) }]}>
              {filteredPonds.length} ao
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={[styles.errorText, { fontSize: fs(13) }]}>{error}</Text>
            <PrimaryButton title="Thử lại" compact variant="secondary" onPress={onRefresh} />
          </View>
        ) : null}

        {loading && ponds.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { fontSize: fs(14) }]}>
              Đang tải dữ liệu ao nuôi...
            </Text>
          </View>
        ) : filteredPonds.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="water" size={32} color={colors.muted} />
            <Text style={[styles.emptyTitle, { fontSize: fs(15) }]}>
              Chưa có ao nuôi trong mục lọc này
            </Text>
            <Text style={[styles.emptySub, { fontSize: fs(13) }]}>
              Chạm vào bộ lọc "Tất cả" hoặc kéo xuống để làm mới dữ liệu từ máy chủ.
            </Text>
          </View>
        ) : (
          filteredPonds.map((pond) => {
            const doCfg = thresholdsMap[pond.id]?.find((t) =>
              ['dissolvedoxygen', 'do'].includes(t.metricName?.toLowerCase())
            );
            return (
              <PondCard
                key={pond.id}
                item={pond}
                minDo={doCfg ? Number(doCfg.minValue) : 4.0}
                maxDo={doCfg ? Number(doCfg.maxValue) : 8.0}
                onPress={() => handleOpenPond(pond.id)}
              />
            );
          })
        )}

        <View style={styles.bottomCtaWrap}>
          <PrimaryButton
            title="+ Ghi đo tay Test Kit (NH3 / NO2)"
            iconName="science"
            onPress={() =>
              navigation.navigate('ManualLogCrop', {
                pondId: farmScopedPonds[0]?.id,
                initialTab: 'testkit',
              })
            }
          />
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greetingCol: {
    flex: 1,
    gap: 3,
  },
  greetingText: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  syncLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncText: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  bellBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.card,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.dangerText,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  farmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    minHeight: 42,
    flexShrink: 1,
  },
  farmPillText: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
    flexShrink: 1,
  },
  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    minHeight: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
  },
  refreshChipText: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
  },
  urgentBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radii.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  urgentIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBody: {
    flex: 1,
    gap: 2,
  },
  urgentTitle: {
    fontFamily: fontFamily.bold,
    color: '#991B1B',
  },
  urgentSub: {
    fontFamily: fontFamily.regular,
    color: '#991B1B',
    fontVariant: ['tabular-nums'],
  },
  urgentAction: {
    fontFamily: fontFamily.bold,
    color: colors.dangerText,
  },
  filterRow: {
    gap: 8,
    marginTop: 12,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fontFamily.semiBold,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
  },
  stationPillWarn: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
  },
  stationPillText: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  errorCard: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.card,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    color: colors.dangerText,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
  },
  bottomCtaWrap: {
    marginTop: 8,
  },
});
