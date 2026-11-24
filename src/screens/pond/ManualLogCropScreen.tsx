import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  createManualLogThunk,
  fetchManualLogsThunk,
  fetchPondCropsThunk,
} from '../../store/slices/cropSlice';
import { setPondSelectorOpen, showToast } from '../../store/slices/uiSlice';
import {
  DaylightCard,
  PrimaryButton,
  StatusDot,
  WetHandStepper,
  useFontScale,
} from '../../components/ui';
import { HarvestLogModal } from '../../components/modals/HarvestLogModal';

const NH3_PRESETS = [0.01, 0.03, 0.05, 0.1];
const NO2_PRESETS = [0.1, 0.25, 0.4, 0.8];
const QUICK_NOTES = ['Nước xanh nhẹ', 'Tôm ăn khỏe', 'Có ít bọt mặt', 'Đang thay nước'];

export const ManualLogCropScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const routePondId = route?.params?.pondId as string | undefined;
  const initialTab = (route?.params?.initialTab as 'testkit' | 'crop') || 'testkit';

  const { ponds, selectedPondId } = useAppSelector((state) => state.pond);
  const {
    manualLogsByPond,
    cropsByPond,
    harvestsByBatch,
    harvestSummaryByBatch,
    loadingLogs,
    loadingCrops,
    submitting,
  } = useAppSelector((state) => state.crop);

  const activePond = useMemo(() => {
    const id = routePondId || selectedPondId;
    return ponds.find((p) => p.id === id) || ponds[0] || null;
  }, [ponds, routePondId, selectedPondId]);

  const pondId = activePond?.id;

  const [tab, setTab] = useState<'testkit' | 'crop'>(initialTab);
  const [nh3, setNh3] = useState<number>(0.03);
  const [no2, setNo2] = useState<number>(0.25);
  const [note, setNote] = useState('');
  const [harvestModalOpen, setHarvestModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!pondId) return;
    dispatch(fetchManualLogsThunk(pondId));
    dispatch(fetchPondCropsThunk(pondId));
  }, [pondId, dispatch]);

  const onRefresh = async () => {
    if (!pondId) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchManualLogsThunk(pondId)),
      dispatch(fetchPondCropsThunk(pondId)),
    ]);
    setRefreshing(false);
  };

  const handleSaveManualLog = async () => {
    if (!pondId) return;
    const res = await dispatch(
      createManualLogThunk({
        pondId,
        dto: {
          nh3Value: nh3,
          no2Value: no2,
          note: note.trim() || undefined,
        },
      })
    );
    if (createManualLogThunk.fulfilled.match(res)) {
      setNote('');
      dispatch(showToast({ text: 'Đã lưu kết quả đo NH3/NO2 thành công!', tone: 'safe' }));
    } else {
      dispatch(
        showToast({
          text: (res.payload as string) || 'Không thể lưu kết quả đo tay.',
          tone: 'danger',
        })
      );
    }
  };

  const toggleNoteTag = (tag: string) => {
    setNote((prev) => {
      if (prev.includes(tag)) return prev;
      return prev.trim() ? `${prev.trim()}, ${tag}` : tag;
    });
  };

  const logs = pondId ? manualLogsByPond[pondId] || [] : [];
  const crops = pondId ? cropsByPond[pondId] || [] : [];
  const activeBatch = crops.find((c) => c.status === 'ACTIVE') || crops[0] || null;
  const harvestSummary = activeBatch ? harvestSummaryByBatch[activeBatch.batchId] : undefined;
  const harvestLogs = activeBatch ? harvestsByBatch[activeBatch.batchId] || [] : [];

  const docDays = useMemo(() => {
    if (!activeBatch?.stockingDate) return null;
    const ms = new Date(activeBatch.stockingDate).getTime();
    if (isNaN(ms)) return null;
    return Math.max(0, Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24)));
  }, [activeBatch?.stockingDate]);

  const nh3High = nh3 >= 0.1;
  const no2High = no2 >= 0.5;

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
        <Text style={[styles.topTitle, { fontSize: fs(16) }]} numberOfLines={1}>
          Ghi nhận ngoài ao
        </Text>
        <TouchableOpacity
          onPress={() => dispatch(setPondSelectorOpen(true))}
          style={styles.pondHeaderPill}
        >
          <Text style={styles.pondHeaderPillText} numberOfLines={1}>
            {activePond?.name || 'Chọn ao'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.segWrap}>
        <View style={styles.segmented}>
          <TouchableOpacity
            onPress={() => setTab('testkit')}
            style={[styles.segBtn, tab === 'testkit' && styles.segBtnActive]}
          >
            <MaterialIcons
              name="science"
              size={16}
              color={tab === 'testkit' ? '#FFFFFF' : colors.muted}
            />
            <Text style={[styles.segText, tab === 'testkit' && styles.segTextActive]}>
              Đo tay NH3 / NO2
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('crop')}
            style={[styles.segBtn, tab === 'crop' && styles.segBtnActive]}
          >
            <MaterialIcons
              name="inventory-2"
              size={16}
              color={tab === 'crop' ? '#FFFFFF' : colors.muted}
            />
            <Text style={[styles.segText, tab === 'crop' && styles.segTextActive]}>
              Vụ nuôi & Thu tỉa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {!pondId ? (
          <DaylightCard padding={20}>
            <Text style={styles.emptyText}>Chưa chọn ao nuôi.</Text>
          </DaylightCard>
        ) : tab === 'testkit' ? (
          <>
            <View style={styles.tipBanner}>
              <MaterialIcons name="wb-sunny" size={18} color={colors.primary} />
              <Text style={[styles.tipBannerText, { fontSize: fs(12) }]}>
                Chế độ nhập nhanh ngoài ao: Phím lớn chống chạm nhầm khi tay ướt.
              </Text>
            </View>

            <DaylightCard tone={nh3High ? 'danger' : 'neutral'} padding={14} style={{ gap: 10 }}>
              <View style={styles.kitHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kitTitle, { fontSize: fs(15) }]}>NH3 tự do (mg/L)</Text>
                  <Text style={styles.kitSub}>Mục tiêu an toàn: &lt; 0,10 mg/L</Text>
                </View>
                <StatusDot tone={nh3High ? 'danger' : 'safe'} size={10} />
              </View>

              <WetHandStepper
                value={nh3}
                onChange={setNh3}
                step={0.01}
                min={0}
                max={5}
                decimals={2}
                unit="mg/L"
              />

              <View style={styles.presetRow}>
                {NH3_PRESETS.map((v) => {
                  const active = Math.abs(nh3 - v) < 0.001;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setNh3(v)}
                      style={[styles.presetChip, active && styles.presetChipActive]}
                    >
                      <Text
                        style={[styles.presetText, active && styles.presetTextActive]}
                      >
                        {v.toFixed(2).replace('.', ',')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </DaylightCard>

            <DaylightCard tone={no2High ? 'warning' : 'neutral'} padding={14} style={{ gap: 10 }}>
              <View style={styles.kitHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kitTitle, { fontSize: fs(15) }]}>NO2 (mg/L)</Text>
                  <Text style={styles.kitSub}>Ngưỡng cảnh báo: ≥ 0,50 mg/L</Text>
                </View>
                <StatusDot tone={no2High ? 'warning' : 'safe'} size={10} />
              </View>

              <WetHandStepper
                value={no2}
                onChange={setNo2}
                step={0.05}
                min={0}
                max={10}
                decimals={2}
                unit="mg/L"
              />

              {no2High ? (
                <View style={styles.warnHint}>
                  <MaterialIcons name="science" size={16} color={colors.warnText} />
                  <Text style={styles.warnHintText}>
                    Mức {no2.toFixed(2).replace('.', ',')} mg/L: Nên bổ sung vi sinh xử lý đáy và giảm ăn tạm thời.
                  </Text>
                </View>
              ) : null}

              <View style={styles.presetRow}>
                {NO2_PRESETS.map((v) => {
                  const active = Math.abs(no2 - v) < 0.001;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setNo2(v)}
                      style={[styles.presetChip, active && styles.presetChipActive]}
                    >
                      <Text
                        style={[styles.presetText, active && styles.presetTextActive]}
                      >
                        {v.toFixed(2).replace('.', ',')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </DaylightCard>

            <DaylightCard padding={14} style={{ gap: 10 }}>
              <Text style={styles.noteSectionTitle}>GHI CHÚ QUAN SÁT NHANH</Text>
              <View style={styles.quickTagsRow}>
                {QUICK_NOTES.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleNoteTag(tag)}
                    style={styles.quickTag}
                  >
                    <Text style={styles.quickTagText}>+ {tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                placeholder="Ghi chú màu nước, bọt mặt, tình trạng tôm..."
                placeholderTextColor={colors.subtle}
                style={[styles.textarea, { fontSize: fs(14) }]}
              />
            </DaylightCard>

            <PrimaryButton
              title="Lưu kết quả đo tay"
              iconName="check-circle"
              loading={submitting}
              onPress={handleSaveManualLog}
            />

            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { fontSize: fs(15) }]}>
                Lịch sử đo tay gần đây
              </Text>
              <Text style={styles.historyCount}>{logs.length} lần đo</Text>
            </View>

            {loadingLogs && logs.length === 0 ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : logs.length === 0 ? (
              <DaylightCard padding={16}>
                <Text style={styles.emptyText}>Chưa có bản ghi đo test kit nào tại ao này.</Text>
              </DaylightCard>
            ) : (
              logs.map((item) => {
                const isElevated = item.nh3Value >= 0.1 || item.no2Value >= 0.5;
                return (
                  <DaylightCard
                    key={item.logId}
                    tone={isElevated ? 'warning' : 'neutral'}
                    padding={12}
                    style={{ gap: 4 }}
                  >
                    <View style={styles.logRow}>
                      <StatusDot tone={isElevated ? 'warning' : 'safe'} size={8} />
                      <Text style={styles.logValues}>
                        NH3 {Number(item.nh3Value).toFixed(2).replace('.', ',')} · NO2{' '}
                        {Number(item.no2Value).toFixed(2).replace('.', ',')} mg/L
                      </Text>
                      <Text style={styles.logTime}>
                        {new Date(item.testedAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Text>
                    </View>
                    {item.note ? <Text style={styles.logNote}>{item.note}</Text> : null}
                    {item.testedBy?.fullName ? (
                      <Text style={styles.logUser}>Người đo: {item.testedBy.fullName}</Text>
                    ) : null}
                  </DaylightCard>
                );
              })
            )}
          </>
        ) : (
          <>
            {loadingCrops && crops.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : !activeBatch ? (
              <DaylightCard padding={24} style={{ alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="inventory-2" size={32} color={colors.muted} />
                <Text style={[styles.kitTitle, { fontSize: fs(15) }]}>
                  Ao chưa có vụ nuôi nào đang ghi nhận
                </Text>
                <Text style={styles.emptyText}>
                  Quản lý trại có thể khởi tạo vụ nuôi mới từ cổng quản trị Web.
                </Text>
              </DaylightCard>
            ) : (
              <>
                <DaylightCard padding={16} style={{ gap: 10 }}>
                  <View style={styles.cropTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cropTitle, { fontSize: fs(17) }]}>
                        {activeBatch.shrimpSpecies}
                      </Text>
                      <Text style={styles.cropSub}>
                        Thả giống: {String(activeBatch.stockingDate).slice(0, 10)}
                        {docDays !== null ? ` · Ngày nuôi DOC ${docDays}` : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.batchStatusPill,
                        activeBatch.status === 'ACTIVE'
                          ? { backgroundColor: colors.safeBg, borderColor: colors.safeBorder }
                          : { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.batchStatusText,
                          activeBatch.status === 'ACTIVE' && { color: colors.safeText },
                        ]}
                      >
                        {activeBatch.status === 'ACTIVE' ? 'Đang nuôi' : activeBatch.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cropKpiRow}>
                    <View style={styles.cropKpi}>
                      <Text style={styles.cropKpiLabel}>Mật độ / SL thả ban đầu</Text>
                      <Text style={styles.cropKpiVal}>
                        {Number(activeBatch.initialQuantity || 0).toLocaleString('vi-VN')} con
                      </Text>
                    </View>
                    <View style={styles.cropKpi}>
                      <Text style={styles.cropKpiLabel}>Dự kiến thu hoạch</Text>
                      <Text style={styles.cropKpiVal}>
                        {activeBatch.expectedHarvestDate
                          ? String(activeBatch.expectedHarvestDate).slice(0, 10)
                          : '--'}
                      </Text>
                    </View>
                  </View>
                </DaylightCard>

                <View style={styles.summaryRow}>
                  <DaylightCard padding={14} style={styles.summaryCard}>
                    <Text style={styles.cropKpiLabel}>Tổng sản lượng đã thu</Text>
                    <Text style={[styles.summaryBig, { fontSize: fs(22) }]}>
                      {Number(harvestSummary?.totalWeightKg || 0).toFixed(1).replace('.', ',')} kg
                    </Text>
                  </DaylightCard>
                  <DaylightCard padding={14} style={styles.summaryCard}>
                    <Text style={styles.cropKpiLabel}>Số đợt thu tỉa</Text>
                    <Text style={[styles.summaryBig, { fontSize: fs(22) }]}>
                      {harvestSummary?.harvestCount || 0} đợt
                    </Text>
                  </DaylightCard>
                </View>

                {activeBatch.status === 'ACTIVE' ? (
                  <PrimaryButton
                    title="+ Ghi nhận thu tỉa / sản lượng"
                    iconName="inventory"
                    onPress={() => setHarvestModalOpen(true)}
                  />
                ) : null}

                <View style={styles.historyHeader}>
                  <Text style={[styles.historyTitle, { fontSize: fs(15) }]}>
                    Nhật ký các đợt thu hoạch
                  </Text>
                  <Text style={styles.historyCount}>{harvestLogs.length} phiếu</Text>
                </View>

                {harvestLogs.length === 0 ? (
                  <DaylightCard padding={16}>
                    <Text style={styles.emptyText}>Chưa có phiếu thu hoạch nào cho vụ nuôi này.</Text>
                  </DaylightCard>
                ) : (
                  harvestLogs.map((h) => (
                    <DaylightCard key={h.harvestLogId} padding={14} style={{ gap: 4 }}>
                      <View style={styles.logRow}>
                        <Text style={styles.harvestWeight}>
                          {Number(h.harvestWeightKg).toFixed(1).replace('.', ',')} kg
                        </Text>
                        {h.harvestQuantity ? (
                          <Text style={styles.harvestQty}>
                            · {Number(h.harvestQuantity).toLocaleString('vi-VN')} con
                          </Text>
                        ) : null}
                        <Text style={styles.logTime}>{String(h.harvestDate).slice(0, 10)}</Text>
                      </View>
                      {h.note ? <Text style={styles.logNote}>{h.note}</Text> : null}
                    </DaylightCard>
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <HarvestLogModal
        visible={harvestModalOpen}
        batch={activeBatch}
        pondName={activePond?.name}
        onClose={() => setHarvestModalOpen(false)}
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
    gap: 8,
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
    flex: 1,
  },
  pondHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    minHeight: 38,
    maxWidth: 150,
  },
  pondHeaderPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
    flexShrink: 1,
  },
  segWrap: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segBtnActive: {
    backgroundColor: colors.primary,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  segTextActive: {
    color: '#FFFFFF',
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
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tipBannerText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.primaryDark,
  },
  kitHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kitTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  kitSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.control,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#CFE5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  warnHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    padding: 10,
  },
  warnHintText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.warnText,
  },
  noteSectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  quickTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  quickTagText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  textarea: {
    minHeight: 84,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  historyTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  historyCount: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.muted,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logValues: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  logTime: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  logNote: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.ink,
  },
  logUser: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.muted,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  cropTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cropTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  cropSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  batchStatusPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  batchStatusText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.ink,
  },
  cropKpiRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.control,
    padding: 12,
  },
  cropKpi: {
    flex: 1,
    gap: 2,
  },
  cropKpiLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
  },
  cropKpiVal: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    gap: 4,
  },
  summaryBig: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  harvestWeight: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  harvestQty: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
