import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Role } from '../../services/authApi';
import { thresholdApi, ThresholdConfigBackend } from '../../services/thresholdApi';
import {
  notificationApi,
  NotificationChannel,
  NotificationPreferenceItem,
  NotificationSeverity,
} from '../../services/notificationApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPondThresholdsThunk } from '../../store/slices/pondSlice';
import { setPondSelectorOpen, showToast } from '../../store/slices/uiSlice';
import {
  AquaToggleSwitch,
  DaylightCard,
  PrimaryButton,
  SafeRangeBar,
  StatusDot,
  WetHandStepper,
  useFontScale,
} from '../../components/ui';
import {
  DOC_28_DEFAULTS,
  ResetThresholdsModal,
} from '../../components/modals/ResetThresholdsModal';

interface EditableThreshold {
  key: 'do' | 'ph' | 'temp' | 'salinity';
  backendMetricName: string;
  aliases: string[];
  title: string;
  subtitle: string;
  unit: string;
  step: number;
  decimals: number;
  scaleMin: number;
  scaleMax: number;
  hint: string;
  hintTone: 'danger' | 'safe' | 'info';
  configId?: string;
  minValue: number;
  maxValue: number;
}

const BASE_EDITABLES: EditableThreshold[] = [
  {
    key: 'do',
    backendMetricName: 'dissolvedOxygen',
    aliases: ['dissolvedoxygen', 'do'],
    title: 'Oxy hòa tan (DO)',
    subtitle: 'Chỉ số sinh tồn của đàn tôm',
    unit: 'mg/L',
    step: 0.1,
    decimals: 1,
    scaleMin: 0,
    scaleMax: 12,
    hint: 'Cảnh báo khẩn cấp ngay khi DO thấp hơn ngưỡng tối thiểu.',
    hintTone: 'danger',
    minValue: 4.0,
    maxValue: 8.0,
  },
  {
    key: 'ph',
    backendMetricName: 'pH',
    aliases: ['ph'],
    title: 'Độ pH nước ao',
    subtitle: 'Ảnh hưởng độ độc khí và chu kỳ lột',
    unit: 'pH',
    step: 0.1,
    decimals: 1,
    scaleMin: 5,
    scaleMax: 10,
    hint: 'Khung pH ổn định giúp tôm lột xác đều, giảm độc lực NH3/H2S.',
    hintTone: 'safe',
    minValue: 7.0,
    maxValue: 8.5,
  },
  {
    key: 'temp',
    backendMetricName: 'temperature',
    aliases: ['temperature', 'temp'],
    title: 'Nhiệt độ nước ao',
    subtitle: 'Tác động đến chuyển hóa và lượng ăn',
    unit: '°C',
    step: 0.5,
    decimals: 1,
    scaleMin: 18,
    scaleMax: 40,
    hint: 'Nhiệt độ trên 32°C làm tăng vi khuẩn Vibrio và nhu cầu oxy.',
    hintTone: 'info',
    minValue: 26.0,
    maxValue: 32.0,
  },
  {
    key: 'salinity',
    backendMetricName: 'salinity',
    aliases: ['salinity', 'sal'],
    title: 'Độ mặn nguồn nước',
    subtitle: 'Cân bằng áp suất thẩm thấu cơ thể tôm',
    unit: 'ppt',
    step: 1,
    decimals: 0,
    scaleMin: 0,
    scaleMax: 35,
    hint: 'Biến động độ mặn vượt 3 ppt/ngày dễ gây sốc khoáng tôm mới lột.',
    hintTone: 'info',
    minValue: 10,
    maxValue: 25,
  },
];

const CHANNEL_ROWS: Array<{
  severity: NotificationSeverity;
  channel: NotificationChannel;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  {
    severity: 'CRITICAL',
    channel: 'FCM',
    title: 'Thông báo đẩy khẩn cấp (Push)',
    subtitle: 'Cảnh báo tức thời kèm âm thanh kể cả khi khóa màn hình',
    icon: 'notifications-active',
  },
  {
    severity: 'CRITICAL',
    channel: 'SMS',
    title: 'Tin nhắn SMS khẩn cấp',
    subtitle: 'Gửi SMS trực tiếp khi DO tụt dốc hoặc trạm mất kết nối',
    icon: 'sms',
  },
  {
    severity: 'CRITICAL',
    channel: 'EMAIL',
    title: 'Email cảnh báo khẩn cấp',
    subtitle: 'Gửi báo cáo chi tiết sự cố qua Email',
    icon: 'mail-outline',
  },
  {
    severity: 'WARNING',
    channel: 'FCM',
    title: 'Thông báo đẩy cảnh báo sớm',
    subtitle: 'Nhắc kiểm tra khi chỉ số tiệm cận ngưỡng nguy hiểm',
    icon: 'notifications-none',
  },
];

export const ThresholdsNotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const routePondId = route?.params?.pondId as string | undefined;
  const { ponds, selectedPondId } = useAppSelector((state) => state.pond);
  const role = useAppSelector((state) => state.user.role || state.auth.role);
  const isManager = role === Role.MANAGER || role === Role.ADMIN;

  const activePond = useMemo(() => {
    const id = routePondId || selectedPondId;
    return ponds.find((p) => p.id === id) || ponds[0] || null;
  }, [ponds, routePondId, selectedPondId]);

  const pondId = activePond?.id;

  const [editables, setEditables] = useState<EditableThreshold[]>(BASE_EDITABLES);
  const [prefs, setPrefs] = useState<NotificationPreferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configs, loadedPrefs] = await Promise.all([
        pondId ? thresholdApi.getPondThresholds(pondId).catch(() => []) : Promise.resolve([]),
        notificationApi.getNotificationPreferences().catch(() => []),
      ]);

      setEditables(
        BASE_EDITABLES.map((base) => {
          const matched: ThresholdConfigBackend | undefined = configs.find((c) =>
            base.aliases.includes(c.metricName?.toLowerCase())
          );
          if (matched) {
            return {
              ...base,
              backendMetricName: matched.metricName,
              configId: matched.configId || matched.id,
              minValue: Number(matched.minValue),
              maxValue: Number(matched.maxValue),
            };
          }
          return base;
        })
      );

      setPrefs(loadedPrefs);
    } finally {
      setLoading(false);
    }
  }, [pondId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateRange = (
    key: EditableThreshold['key'],
    bound: 'minValue' | 'maxValue',
    val: number
  ) => {
    setEditables((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const nextMin = bound === 'minValue' ? Math.min(val, item.maxValue) : item.minValue;
        const nextMax = bound === 'maxValue' ? Math.max(val, item.minValue) : item.maxValue;
        return { ...item, minValue: nextMin, maxValue: nextMax };
      })
    );
  };

  const getPrefEnabled = (severity: NotificationSeverity, channel: NotificationChannel): boolean => {
    const found = prefs.find((p) => p.severity === severity && p.channel === channel);
    if (found) return found.enabled;
    return severity === 'CRITICAL' || channel === 'FCM';
  };

  const togglePref = (severity: NotificationSeverity, channel: NotificationChannel, next: boolean) => {
    setPrefs((prev) => {
      const exists = prev.some((p) => p.severity === severity && p.channel === channel);
      if (exists) {
        return prev.map((p) =>
          p.severity === severity && p.channel === channel ? { ...p, enabled: next } : p
        );
      }
      return [...prev, { severity, channel, enabled: next }];
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      if (isManager && pondId) {
        for (const item of editables) {
          if (item.configId) {
            await thresholdApi.updateThreshold(item.configId, {
              minValue: item.minValue,
              maxValue: item.maxValue,
            });
          } else {
            await thresholdApi.createThreshold(pondId, {
              metricName: item.backendMetricName,
              minValue: item.minValue,
              maxValue: item.maxValue,
              isActive: true,
            });
          }
        }
        await dispatch(fetchPondThresholdsThunk(pondId));
      }

      const payloadPrefs: NotificationPreferenceItem[] = CHANNEL_ROWS.map((r) => ({
        severity: r.severity,
        channel: r.channel,
        enabled: getPrefEnabled(r.severity, r.channel),
      }));
      await notificationApi.updateNotificationPreferences(payloadPrefs);

      dispatch(
        showToast({
          text: isManager
            ? 'Đã lưu ngưỡng an toàn & kênh thông báo!'
            : 'Đã lưu cấu hình kênh nhận cảnh báo!',
          tone: 'safe',
        })
      );
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể lưu thay đổi.';
      dispatch(
        showToast({
          text: Array.isArray(msg) ? msg.join(', ') : String(msg),
          tone: 'danger',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmResetDoc28 = async () => {
    if (!pondId || !isManager) return;
    setResetLoading(true);
    try {
      for (const item of editables) {
        const def = DOC_28_DEFAULTS[item.key];
        if (item.configId) {
          await thresholdApi.updateThreshold(item.configId, {
            minValue: def.min,
            maxValue: def.max,
          });
        } else {
          await thresholdApi.createThreshold(pondId, {
            metricName: item.backendMetricName,
            minValue: def.min,
            maxValue: def.max,
            isActive: true,
          });
        }
      }
      await dispatch(fetchPondThresholdsThunk(pondId));
      await loadData();
      setResetModalOpen(false);
      dispatch(
        showToast({
          text: 'Đã khôi phục ngưỡng khuyến nghị DOC 28 thành công!',
          tone: 'safe',
        })
      );
    } catch (err: any) {
      dispatch(
        showToast({
          text: err?.response?.data?.message || 'Không thể khôi phục ngưỡng DOC 28.',
          tone: 'danger',
        })
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Quay lại"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { fontSize: fs(17) }]}>Ngưỡng an toàn & Thông báo</Text>
        <View style={{ width: touchTargets.min }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pondHeaderRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => dispatch(setPondSelectorOpen(true))}
            style={styles.pondPill}
          >
            <MaterialIcons name="waves" size={16} color={colors.primary} />
            <Text style={[styles.pondPillText, { fontSize: fs(13) }]} numberOfLines={1}>
              {activePond?.name || 'Chọn ao nuôi'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primaryDark} />
          </TouchableOpacity>

          <View style={styles.roleBadge}>
            <StatusDot
              tone={isManager ? 'teal' : 'offline'}
              label={isManager ? 'Quản lý trại' : 'Chế độ chỉ xem'}
            />
          </View>
        </View>

        {!isManager ? (
          <View style={styles.readOnlyBanner}>
            <MaterialIcons name="lock-outline" size={18} color={colors.primaryDark} />
            <Text style={[styles.readOnlyBannerText, { fontSize: fs(13) }]}>
              Chỉ Quản lý trại mới có quyền chỉnh sửa ngưỡng an toàn ao. Bạn vẫn có thể bật/tắt kênh
              nhận cảnh báo cá nhân bên dưới.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: fs(15) }]}>
            Ngưỡng cảnh báo · {activePond?.name || '--'}
          </Text>
          <Text style={styles.sectionSub}>{editables.length} chỉ số</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.cardsStack}>
            {editables.map((item) => {
              const midpoint = (item.minValue + item.maxValue) / 2;
              return (
                <DaylightCard key={item.key} padding={14} style={styles.paramCard}>
                  <View style={styles.paramHead}>
                    <View style={styles.paramIcon}>
                      <MaterialIcons
                        name={DOC_28_DEFAULTS[item.key].icon}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.paramTitleWrap}>
                      <Text style={[styles.paramTitle, { fontSize: fs(15) }]}>{item.title}</Text>
                      <Text style={[styles.paramSub, { fontSize: fs(12) }]}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>{item.unit}</Text>
                    </View>
                  </View>

                  <View style={styles.stepperGrid}>
                    <View style={styles.stepperHalf}>
                      <WetHandStepper
                        label="Tối thiểu"
                        value={item.minValue}
                        step={item.step}
                        min={item.scaleMin}
                        max={item.scaleMax}
                        decimals={item.decimals}
                        disabled={!isManager}
                        onChange={(v) => updateRange(item.key, 'minValue', v)}
                      />
                    </View>
                    <View style={styles.stepperHalf}>
                      <WetHandStepper
                        label="Tối đa"
                        value={item.maxValue}
                        step={item.step}
                        min={item.scaleMin}
                        max={item.scaleMax}
                        decimals={item.decimals}
                        disabled={!isManager}
                        onChange={(v) => updateRange(item.key, 'maxValue', v)}
                      />
                    </View>
                  </View>

                  <SafeRangeBar
                    value={midpoint}
                    minSafe={item.minValue}
                    maxSafe={item.maxValue}
                    scaleMin={item.scaleMin}
                    scaleMax={item.scaleMax}
                    severity="safe"
                    height={6}
                  />

                  <View style={styles.rangeLabels}>
                    <Text style={styles.rangeBoundText}>&lt; {item.minValue}</Text>
                    <Text style={styles.rangeCenterText}>
                      An toàn: {item.minValue} – {item.maxValue} {item.unit}
                    </Text>
                    <Text style={styles.rangeBoundText}>&gt; {item.maxValue}</Text>
                  </View>

                  <View
                    style={[
                      styles.hintBox,
                      item.hintTone === 'danger' && styles.hintDanger,
                      item.hintTone === 'safe' && styles.hintSafe,
                    ]}
                  >
                    <MaterialIcons
                      name={item.hintTone === 'danger' ? 'warning-amber' : 'info-outline'}
                      size={16}
                      color={
                        item.hintTone === 'danger'
                          ? colors.dangerText
                          : item.hintTone === 'safe'
                          ? colors.safeText
                          : colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.hintText,
                        item.hintTone === 'danger' && { color: colors.dangerText },
                      ]}
                    >
                      {item.hint}
                    </Text>
                  </View>
                </DaylightCard>
              );
            })}
          </View>
        )}

        {isManager && activePond ? (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setResetModalOpen(true)}
            style={styles.resetDocBtn}
          >
            <MaterialIcons name="restart-alt" size={20} color={colors.primaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resetDocTitle, { fontSize: fs(14) }]}>
                Khôi phục ngưỡng khuyến nghị (Tôm thẻ · DOC 28)
              </Text>
              <Text style={styles.resetDocSub}>
                DO 4,5–8,0 · pH 7,5–8,3 · 27–31°C · 12–20 ppt
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: fs(15) }]}>Kênh nhận cảnh báo</Text>
          <Text style={styles.sectionSub}>Hoạt động 24/7</Text>
        </View>

        <DaylightCard padding={0}>
          {CHANNEL_ROWS.map((row, idx) => (
            <React.Fragment key={`${row.severity}-${row.channel}`}>
              {idx > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.channelItem}>
                <View style={styles.channelIcon}>
                  <MaterialIcons name={row.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.channelBody}>
                  <Text style={[styles.channelTitle, { fontSize: fs(14) }]}>{row.title}</Text>
                  <Text style={[styles.channelSub, { fontSize: fs(12) }]}>{row.subtitle}</Text>
                </View>
                <AquaToggleSwitch
                  value={getPrefEnabled(row.severity, row.channel)}
                  onValueChange={(next) => togglePref(row.severity, row.channel, next)}
                  accessibilityLabel={row.title}
                />
              </View>
            </React.Fragment>
          ))}
        </DaylightCard>

        <PrimaryButton
          title="Lưu thay đổi"
          iconName="check-circle"
          loading={saving}
          onPress={saveAll}
        />
      </ScrollView>

      <ResetThresholdsModal
        visible={resetModalOpen}
        pondName={activePond?.name || ''}
        loading={resetLoading}
        onConfirm={handleConfirmResetDoc28}
        onClose={() => setResetModalOpen(false)}
      />
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
  },
  backBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
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
  pondHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pondPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    minHeight: 42,
    flexShrink: 1,
  },
  pondPillText: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    flexShrink: 1,
  },
  roleBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    borderRadius: radii.control,
    padding: 12,
  },
  readOnlyBannerText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.primaryDark,
    lineHeight: 19,
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
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  cardsStack: {
    gap: 12,
  },
  paramCard: {
    gap: 10,
  },
  paramHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paramIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramTitleWrap: {
    flex: 1,
    gap: 2,
  },
  paramTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  paramSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
  unitBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unitBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  stepperGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  stepperHalf: {
    width: '100%',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeBoundText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  rangeCenterText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.safeText,
    fontVariant: ['tabular-nums'],
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    padding: 10,
  },
  hintDanger: {
    backgroundColor: colors.dangerBg,
  },
  hintSafe: {
    backgroundColor: colors.safeBg,
  },
  hintText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink,
    lineHeight: 17,
  },
  resetDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#98D2D6',
    borderRadius: radii.card,
    padding: 14,
  },
  resetDocTitle: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  resetDocSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 62,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelBody: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  channelSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
  },
});
