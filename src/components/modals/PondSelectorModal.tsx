import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPondDetail, selectPond } from '../../store/slices/pondSlice';
import { setPondSelectorOpen, setSelectedFarmId } from '../../store/slices/uiSlice';
import { BottomSheetModal, StatusDot, useFontScale } from '../ui';

function fmt(val: number | null, suffix = ''): string {
  if (val === null || val === undefined || isNaN(val)) return '--';
  return `${val.toFixed(1).replace('.', ',')}${suffix}`;
}

export const PondSelectorModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();

  const visible = useAppSelector((state) => state.ui.pondSelectorOpen);
  const selectedFarmId = useAppSelector((state) => state.ui.selectedFarmId);
  const { farms, ponds, selectedPondId } = useAppSelector((state) => state.pond);
  const [search, setSearch] = useState('');

  const handleClose = () => {
    dispatch(setPondSelectorOpen(false));
  };

  const filteredPonds = useMemo(() => {
    return ponds.filter((p) => {
      if (selectedFarmId && p.farmId && p.farmId !== selectedFarmId) {
        return false;
      }
      if (selectedFarmId && !p.farmId) {
        const matchedFarm = farms.find((f) => f.farmId === selectedFarmId);
        if (matchedFarm?.ponds && !matchedFarm.ponds.some((fp) => fp.pondId === p.id)) {
          return false;
        }
      }
      if (search.trim()) {
        return p.name.toLowerCase().includes(search.trim().toLowerCase());
      }
      return true;
    });
  }, [ponds, farms, selectedFarmId, search]);

  const activeDevicesCount = useMemo(
    () =>
      filteredPonds.filter((p) => p.status !== 'OFFLINE' && p.status !== 'EMPTY').length,
    [filteredPonds]
  );

  const handleSelectPond = (pondId: string, farmId?: string | null) => {
    dispatch(selectPond(pondId));
    if (farmId !== undefined) {
      dispatch(setSelectedFarmId(farmId));
    }
    dispatch(setPondSelectorOpen(false));
    dispatch(fetchPondDetail(pondId));
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title={farms.length > 0 ? 'Chọn trại & Ao nuôi' : 'Chuyển nhanh ao nuôi'}
      subtitle="Chạm vào ao để chuyển ngay dữ liệu cảm biến và dự báo AI"
    >
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm tên ao nuôi..."
          placeholderTextColor={colors.subtle}
          style={[styles.searchInput, { fontSize: fs(14) }]}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {farms.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.farmRow}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => dispatch(setSelectedFarmId(null))}
            style={[
              styles.farmChip,
              !selectedFarmId && styles.farmChipActive,
            ]}
          >
            <MaterialIcons
              name="home-work"
              size={16}
              color={!selectedFarmId ? '#FFFFFF' : colors.ink}
            />
            <Text
              style={[
                styles.farmChipText,
                { fontSize: fs(13) },
                !selectedFarmId && styles.farmChipTextActive,
              ]}
            >
              Tất cả trại
            </Text>
          </TouchableOpacity>
          {farms.map((farm) => {
            const active = selectedFarmId === farm.farmId;
            return (
              <TouchableOpacity
                key={farm.farmId}
                activeOpacity={0.8}
                onPress={() => dispatch(setSelectedFarmId(farm.farmId))}
                style={[styles.farmChip, active && styles.farmChipActive]}
              >
                <MaterialIcons
                  name="domain"
                  size={16}
                  color={active ? '#FFFFFF' : colors.muted}
                />
                <Text
                  style={[
                    styles.farmChipText,
                    { fontSize: fs(13) },
                    active && styles.farmChipTextActive,
                  ]}
                >
                  {farm.farmName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderTitle, { fontSize: fs(12) }]}>
          DANH SÁCH AO ({filteredPonds.length} AO)
        </Text>
        <StatusDot
          tone={activeDevicesCount > 0 ? 'safe' : 'offline'}
          label={`Đang hoạt động ${activeDevicesCount}/${filteredPonds.length}`}
        />
      </View>

      <View style={styles.pondList}>
        {filteredPonds.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { fontSize: fs(14) }]}>
              Không tìm thấy ao nuôi phù hợp.
            </Text>
          </View>
        ) : (
          filteredPonds.map((pond) => {
            const isSelected = pond.id === selectedPondId;
            const dotTone =
              pond.status === 'CRITICAL'
                ? 'danger'
                : pond.status === 'WARNING'
                ? 'warning'
                : pond.status === 'OFFLINE' || pond.status === 'EMPTY'
                ? 'offline'
                : 'safe';

            return (
              <TouchableOpacity
                key={pond.id}
                activeOpacity={0.82}
                onPress={() => handleSelectPond(pond.id, selectedFarmId)}
                style={[
                  styles.pondItem,
                  pond.status === 'WARNING' && styles.pondItemWarn,
                  pond.status === 'CRITICAL' && styles.pondItemDanger,
                  isSelected && styles.pondItemSelected,
                ]}
              >
                <View style={styles.pondItemMain}>
                  <View style={styles.pondTitleRow}>
                    <Text style={[styles.pondTitle, { fontSize: fs(15) }]}>{pond.name}</Text>
                    <StatusDot tone={dotTone} size={8} />
                  </View>
                  <Text style={[styles.pondSub, { fontSize: fs(12) }]}>
                    {pond.docDays !== null ? `DOC ${pond.docDays} · ` : `${pond.areaM2} m² · `}
                    <Text
                      style={{
                        color:
                          pond.status === 'CRITICAL'
                            ? colors.dangerText
                            : pond.status === 'WARNING'
                            ? colors.warnText
                            : colors.ink,
                        fontFamily: fontFamily.semiBold,
                      }}
                    >
                      DO {fmt(pond.doValue, ' mg/L')}
                    </Text>
                    {` · pH ${fmt(pond.ph)} · ${fmt(pond.temp, '°C')}`}
                  </Text>
                </View>

                {isSelected ? (
                  <View style={styles.checkBadge}>
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                  </View>
                ) : (
                  <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.tipRow}>
        <MaterialIcons name="touch-app" size={16} color={colors.primary} />
        <Text style={[styles.tipText, { fontSize: fs(12) }]}>
          Chạm vào ao để chuyển ngay dữ liệu cảm biến và dự báo AI.
        </Text>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    minHeight: touchTargets.min,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 6,
  },
  farmRow: {
    gap: 8,
    paddingVertical: 2,
  },
  farmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  farmChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  farmChipText: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  farmChipTextActive: {
    color: '#FFFFFF',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  listHeaderTitle: {
    fontFamily: fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  pondList: {
    gap: 10,
  },
  pondItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 68,
    gap: 10,
  },
  pondItemWarn: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
  },
  pondItemDanger: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  pondItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pondItemMain: {
    flex: 1,
    gap: 4,
  },
  pondTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pondTitle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  pondSub: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  checkBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    color: colors.muted,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  tipText: {
    fontFamily: fontFamily.regular,
    color: colors.muted,
    flexShrink: 1,
  },
});
