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
import { AlertBackend, AlertStatus } from '../../services/alertApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAlertsThunk, markAllAlertsAsRead } from '../../store/slices/alertSlice';
import { PrimaryButton, StatusDot, useFontScale } from '../../components/ui';
import { ResolveAlertModal } from '../../components/modals/ResolveAlertModal';

const METRIC_TITLES: Record<string, string> = {
  dissolvedOxygen: 'Oxy hòa tan (DO)',
  do: 'Oxy hòa tan (DO)',
  pH: 'Độ pH nước ao',
  temperature: 'Nhiệt độ nước',
  salinity: 'Độ mặn',
  turbidity: 'Độ đục',
  waterLevel: 'Mực nước',
};

export const AlertCenterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const { alerts, loading, error } = useAppSelector((state) => state.alert);
  const { ponds, selectedPondId } = useAppSelector((state) => state.pond);

  const [statusTab, setStatusTab] = useState<AlertStatus>('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [onlySelectedPond, setOnlySelectedPond] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<AlertBackend | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAlertsThunk());
    dispatch(markAllAlertsAsRead());
  }, [dispatch]);

  const pondMap = useMemo(() => {
    const map: Record<string, string> = {};
    ponds.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [ponds]);

  const getPondName = (a: AlertBackend) =>
    a.pond?.pondName || pondMap[a.pondId] || 'Ao nuôi';

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === 'ACTIVE').length,
    [alerts]
  );
  const resolvedCount = useMemo(
    () => alerts.filter((a) => a.status === 'RESOLVED').length,
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (a.status !== statusTab) return false;
      if (severityFilter !== 'ALL' && a.alertLevel !== severityFilter) return false;
      if (onlySelectedPond && selectedPondId && a.pondId !== selectedPondId) return false;
      return true;
    });
  }, [alerts, statusTab, severityFilter, onlySelectedPond, selectedPondId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAlertsThunk());
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: fs(21) }]}>Cảnh báo ao nuôi</Text>
        <View style={[styles.countChip, activeCount === 0 && styles.countChipSafe]}>
          <Text
            style={[
              styles.countChipText,
              activeCount === 0 && { color: colors.safeText },
            ]}
          >
            {activeCount} đang xử lý
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.segmented}>
          <TouchableOpacity
            onPress={() => setStatusTab('ACTIVE')}
            style={[styles.segBtn, statusTab === 'ACTIVE' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, statusTab === 'ACTIVE' && styles.segTextActive]}>
              Đang xử lý ({activeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusTab('RESOLVED')}
            style={[styles.segBtn, statusTab === 'RESOLVED' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, statusTab === 'RESOLVED' && styles.segTextActive]}>
              Đã hoàn thành ({resolvedCount})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterChips}>
          {(
            [
              { key: 'ALL', label: 'Tất cả' },
              { key: 'CRITICAL', label: 'Khẩn cấp' },
              { key: 'WARNING', label: 'Cảnh báo' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setSeverityFilter(f.key)}
              style={[styles.fChip, severityFilter === f.key && styles.fChipActive]}
            >
              <Text
                style={[styles.fChipText, severityFilter === f.key && styles.fChipTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedPondId ? (
            <TouchableOpacity
              onPress={() => setOnlySelectedPond((v) => !v)}
              style={[styles.fChip, onlySelectedPond && styles.fChipActive]}
            >
              <Text style={[styles.fChipText, onlySelectedPond && styles.fChipTextActive]}>
                Ao đang chọn
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton title="Thử lại" compact variant="secondary" onPress={onRefresh} />
          </View>
        ) : null}

        {loading && alerts.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="verified" size={34} color={colors.safeText} />
            <Text style={[styles.emptyTitle, { fontSize: fs(15) }]}>
              {statusTab === 'ACTIVE'
                ? 'Không có cảnh báo nào đang chờ xử lý'
                : 'Chưa có lịch sử cảnh báo đã hoàn thành'}
            </Text>
            <Text style={[styles.emptySub, { fontSize: fs(13) }]}>
              Các chỉ số cảm biến tại ao nuôi đang trong tầm kiểm soát.
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.alertLevel === 'CRITICAL';
            const isResolved = alert.status === 'RESOLVED';
            const accentColor = isResolved
              ? colors.safeDot
              : isCritical
              ? colors.dangerDot
              : colors.warnDot;
            const bgColor = isResolved
              ? colors.card
              : isCritical
              ? colors.dangerBg
              : colors.warnBg;
            const borderColor = isResolved
              ? colors.border
              : isCritical
              ? '#FCA5A5'
              : '#FCD34D';

            const metricLabel = METRIC_TITLES[alert.metricName] || alert.metricName;
            const timeStr = new Date(alert.createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <View
                key={alert.alertId}
                style={[styles.alertCard, { backgroundColor: bgColor, borderColor }]}
              >
                <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />
                <View style={styles.alertBody}>
                  <View style={styles.metaRow}>
                    <StatusDot
                      tone={isResolved ? 'safe' : isCritical ? 'danger' : 'warning'}
                      size={9}
                    />
                    <Text style={[styles.metaText, { fontSize: fs(12) }]} numberOfLines={1}>
                      {getPondName(alert)} · {timeStr}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.alertTitle,
                      {
                        fontSize: fs(16),
                        color: isResolved
                          ? colors.ink
                          : isCritical
                          ? colors.dangerText
                          : colors.warnText,
                      },
                    ]}
                  >
                    {metricLabel}: {String(alert.triggeredValue).replace('.', ',')}
                  </Text>

                  {alert.message ? (
                    <Text style={[styles.alertMsg, { fontSize: fs(13) }]}>{alert.message}</Text>
                  ) : null}

                  {alert.recommendation?.actionSuggestion ? (
                    <View style={styles.aiCard}>
                      <View style={styles.aiHead}>
                        <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
                        <Text style={styles.aiHeadText}>Khuyến nghị xử lý từ AI</Text>
                      </View>
                      <Text style={[styles.aiBody, { fontSize: fs(13) }]}>
                        {alert.recommendation.actionSuggestion}
                      </Text>
                      {alert.recommendation.chemicalDosage ? (
                        <Text style={[styles.aiDosage, { fontSize: fs(12) }]}>
                          Liều lượng gợi ý: {alert.recommendation.chemicalDosage}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {!isResolved ? (
                    <PrimaryButton
                      title="Xác nhận đã xử lý"
                      iconName="check"
                      variant={isCritical ? 'primary' : 'ghost'}
                      compact
                      onPress={() => setResolveTarget(alert)}
                    />
                  ) : (
                    <View style={styles.resolvedFooter}>
                      <MaterialIcons name="check-circle" size={16} color={colors.safeText} />
                      <Text style={[styles.resolvedText, { fontSize: fs(12) }]}>
                        {alert.resolutionNote || 'Đã xử lý xong'}
                        {alert.resolvedBy?.fullName ? ` · Bởi ${alert.resolvedBy.fullName}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <ResolveAlertModal
        visible={resolveTarget !== null}
        alert={resolveTarget}
        pondName={resolveTarget ? getPondName(resolveTarget) : undefined}
        onClose={() => setResolveTarget(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  countChip: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countChipSafe: {
    backgroundColor: colors.safeBg,
    borderColor: colors.safeBorder,
  },
  countChipText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.dangerText,
    fontVariant: ['tabular-nums'],
  },
  tabsWrap: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  segBtnActive: {
    backgroundColor: colors.primary,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  segTextActive: {
    color: '#FFFFFF',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fChip: {
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
  },
  fChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  fChipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  fChipTextActive: {
    color: colors.primaryDark,
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
  errorCard: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.card,
    padding: 14,
    gap: 10,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.dangerText,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftAccent: {
    width: 5,
  },
  alertBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  alertTitle: {
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  alertMsg: {
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  aiCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    borderRadius: radii.control,
    padding: 12,
    gap: 4,
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiHeadText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  aiBody: {
    fontFamily: fontFamily.regular,
    color: colors.ink,
    lineHeight: 19,
  },
  aiDosage: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
    marginTop: 2,
  },
  resolvedFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.safeBg,
    borderRadius: radii.control,
    padding: 10,
  },
  resolvedText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.safeText,
  },
});
