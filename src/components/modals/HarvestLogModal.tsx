import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';
import { ShrimpBatchBackend } from '../../services/cropApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createHarvestThunk } from '../../store/slices/cropSlice';
import { showToast } from '../../store/slices/uiSlice';
import {
  BottomSheetModal,
  CalendarDatePicker,
  PrimaryButton,
  StatusDot,
  WetHandStepper,
  useFontScale,
} from '../ui';

const QUICK_WEIGHT_ADD = [10, 25, 50, 100];

export interface HarvestLogModalProps {
  visible: boolean;
  batch: ShrimpBatchBackend | null;
  pondName?: string;
  onClose: () => void;
}

function getTodayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const HarvestLogModal: React.FC<HarvestLogModalProps> = ({
  visible,
  batch,
  pondName,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { fs } = useFontScale();
  const submitting = useAppSelector((state) => state.crop.submitting);

  const [harvestDate, setHarvestDate] = useState(getTodayYmd());
  const [weightKg, setWeightKg] = useState<number>(50);
  const [quantityText, setQuantityText] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setHarvestDate(getTodayYmd());
      setWeightKg(50);
      setQuantityText('');
      setNote('');
      setErrorMsg(null);
    }
  }, [visible, batch?.batchId]);

  const stockingYmd = batch?.stockingDate ? String(batch.stockingDate).slice(0, 10) : '';

  const approxSizePerKg = useMemo(() => {
    const qty = Number(quantityText.replace(/[^\d]/g, ''));
    if (!qty || !weightKg || weightKg <= 0) return null;
    return Math.round(qty / weightKg);
  }, [quantityText, weightKg]);

  const handleSubmit = async () => {
    if (!batch) return;
    setErrorMsg(null);

    const cleanDate = harvestDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      setErrorMsg('Ngày thu hoạch phải đúng định dạng YYYY-MM-DD.');
      return;
    }
    if (stockingYmd && cleanDate < stockingYmd) {
      setErrorMsg(`Ngày thu hoạch không được trước ngày thả giống (${stockingYmd}).`);
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setErrorMsg('Khối lượng thu hoạch phải lớn hơn 0 kg.');
      return;
    }

    const parsedQty = quantityText.trim() ? parseInt(quantityText.replace(/[^\d]/g, ''), 10) : undefined;
    if (parsedQty !== undefined && (isNaN(parsedQty) || parsedQty <= 0)) {
      setErrorMsg('Số lượng tôm ước tính phải là số nguyên dương.');
      return;
    }

    const res = await dispatch(
      createHarvestThunk({
        batchId: batch.batchId,
        dto: {
          harvestDate: cleanDate,
          harvestWeightKg: weightKg,
          ...(parsedQty ? { harvestQuantity: parsedQty } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      })
    );

    if (createHarvestThunk.fulfilled.match(res)) {
      dispatch(
        showToast({
          text: `Đã lưu phiếu thu ${weightKg.toFixed(1).replace('.', ',')} kg thành công!`,
          tone: 'safe',
        })
      );
      onClose();
    } else {
      setErrorMsg((res.payload as string) || 'Không thể lưu phiếu thu hoạch.');
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Ghi nhận thu tỉa / sản lượng"
      footer={
        <PrimaryButton
          title="Lưu phiếu thu tỉa"
          iconName="check-circle"
          loading={submitting}
          onPress={handleSubmit}
        />
      }
    >
      {batch ? (
        <View style={styles.batchBanner}>
          <StatusDot tone="safe" size={8} />
          <Text style={[styles.batchText, { fontSize: fs(12) }]}>
            {pondName || 'Ao nuôi'} · {batch.shrimpSpecies} · Thả giống {stockingYmd}
          </Text>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.dangerText} />
          <Text style={[styles.errorText, { fontSize: fs(13) }]}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { fontSize: fs(12) }]}>NGÀY THU TỈA</Text>
        <CalendarDatePicker
          value={harvestDate}
          onChange={setHarvestDate}
          minDate={stockingYmd || undefined}
          maxDate={getTodayYmd()}
          showQuickShortcuts={true}
          placeholder="Chọn ngày thu tỉa"
        />
      </View>

      <View style={styles.field}>
        <WetHandStepper
          label="SẢN LƯỢNG THU (KG)"
          value={weightKg}
          onChange={setWeightKg}
          step={5}
          min={0.5}
          max={50000}
          unit="kg"
          decimals={1}
        />
        <View style={styles.quickAddRow}>
          {QUICK_WEIGHT_ADD.map((inc) => (
            <TouchableOpacity
              key={inc}
              onPress={() => setWeightKg((w) => Math.round((w + inc) * 10) / 10)}
              style={styles.quickAddChip}
            >
              <Text style={styles.quickAddText}>+{inc} kg</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.qtyHeader}>
          <Text style={[styles.fieldLabel, { fontSize: fs(12) }]}>
            ƯỚC LƯỢNG SỐ CON (TÙY CHỌN)
          </Text>
          {approxSizePerKg ? (
            <Text style={styles.sizeHint}>~{approxSizePerKg} con/kg</Text>
          ) : null}
        </View>
        <TextInput
          value={quantityText}
          onChangeText={(txt) => setQuantityText(txt.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
          placeholder="Ví dụ: 3500"
          placeholderTextColor={colors.subtle}
          style={[styles.input, { fontSize: fs(15) }]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { fontSize: fs(12) }]}>GHI CHÚ THU TỈA (TÙY CHỌN)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          placeholder="Ví dụ: Thu tỉa đợt 1, tôm chắc vỏ, size 60 con/kg..."
          placeholderTextColor={colors.subtle}
          style={[styles.textarea, { fontSize: fs(14) }]}
        />
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  batchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  batchText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.control,
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    color: colors.dangerText,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: fontFamily.bold,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.control,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#B2DCE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  qtyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeHint: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  input: {
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    fontFamily: fontFamily.bold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  textarea: {
    minHeight: 80,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});
