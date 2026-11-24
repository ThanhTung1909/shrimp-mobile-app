import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { pondApi, PondBackendResponse, PondStatus } from '../../services/pondApi';
import { farmApi, FarmBackend } from '../../services/farmApi';
import { telemetryApi, TelemetryDataBackend } from '../../services/telemetryApi';
import { thresholdApi, ThresholdConfigBackend } from '../../services/thresholdApi';
import { cropApi, ShrimpBatchBackend } from '../../services/cropApi';
import { DeviceStatus } from '../../services/deviceApi';
import { unwrapApiResponse } from '../../services/apiClient';
import { RangeSeverity } from '../../components/ui';
import { logoutThunk, logoutAllThunk } from './authSlice';

export interface SensorMetric {
  id: 'do' | 'ph' | 'temp' | 'salinity' | 'turbidity' | 'waterLevel';
  name: string;
  value: number | null;
  unit: string;
  minSafe: number;
  maxSafe: number;
  scaleMin: number;
  scaleMax: number;
  rangeLabel: string;
  severity: RangeSeverity;
  iconName: string;
  isCommunityIcon?: boolean;
}

export type PondHealthLevel = 'SAFE' | 'WARNING' | 'CRITICAL' | 'EMPTY' | 'OFFLINE';

export interface PondItem {
  id: string;
  name: string;
  farmId?: string | null;
  farmName: string;
  location?: string | null;
  areaM2: number;
  depthM: number;
  shrimpDensity: number;
  rawStatus: PondStatus;
  status: PondHealthLevel;
  temp: number | null;
  ph: number | null;
  doValue: number | null;
  salinity: number | null;
  turbidity: number | null;
  waterLevel: number | null;
  recordedAt: string | null;
  deviceId?: string;
  deviceName?: string;
  deviceStatus?: DeviceStatus;
  docDays: number | null;
  shrimpSpecies: string | null;
}

interface PondState {
  farms: FarmBackend[];
  ponds: PondItem[];
  selectedPondId: string;
  pondSensors: SensorMetric[];
  thresholdsMap: Record<string, ThresholdConfigBackend[]>;
  activeCropsMap: Record<string, ShrimpBatchBackend | null>;
  latestTelemetryMap: Record<string, TelemetryDataBackend>;
  lastSyncTime: string;
  loading: boolean;
  error: string | null;
}

const DEFAULT_THRESHOLDS = {
  do: { min: 4.0, max: 8.0 },
  ph: { min: 7.0, max: 8.5 },
  temp: { min: 26.0, max: 32.0 },
  salinity: { min: 10.0, max: 25.0 },
  turbidity: { min: 0.0, max: 40.0 },
  waterLevel: { min: 1.0, max: 1.6 },
};

function findThresholdRange(
  thresholds: ThresholdConfigBackend[] | undefined,
  keys: string[],
  fallback: { min: number; max: number }
): { min: number; max: number } {
  if (!thresholds || thresholds.length === 0) return fallback;
  const found = thresholds.find((t) =>
    keys.some((k) => t.metricName?.toLowerCase() === k.toLowerCase())
  );
  if (!found || found.isActive === false) return fallback;
  return {
    min: Number(found.minValue),
    max: Number(found.maxValue),
  };
}

function parseOptionalNumber(...vals: any[]): number | null {
  for (const raw of vals) {
    if (raw === null || raw === undefined || raw === '') continue;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (!isNaN(num)) return Math.round(num * 100) / 100;
  }
  return null;
}

function evaluateSeverity(
  value: number | null,
  minSafe: number,
  maxSafe: number,
  criticalMarginRatio = 0.15
): RangeSeverity {
  if (value === null) return 'offline';
  if (value >= minSafe && value <= maxSafe) {
    // Near edge within 8% of span -> calm warning hint only if tight; keep safe inside bounds
    return 'safe';
  }
  const span = Math.max(maxSafe - minSafe, 1);
  const distance = value < minSafe ? minSafe - value : value - maxSafe;
  if (distance >= span * criticalMarginRatio) {
    return 'danger';
  }
  return 'warning';
}

export function mapTelemetryToSensors(
  rawInput?: TelemetryDataBackend | any | null,
  thresholds?: ThresholdConfigBackend[]
): SensorMetric[] {
  const telemetry = rawInput ? unwrapApiResponse<TelemetryDataBackend | null>(rawInput) : null;

  const doVal = telemetry
    ? parseOptionalNumber(telemetry.dissolvedOxygen, telemetry.dissolved_oxygen, telemetry.do)
    : null;
  const phVal = telemetry
    ? parseOptionalNumber(telemetry.ph, telemetry.phValue, telemetry.ph_value)
    : null;
  const tempVal = telemetry
    ? parseOptionalNumber(telemetry.temperature, telemetry.temp, telemetry.temperature_celsius)
    : null;
  const salVal = telemetry
    ? parseOptionalNumber(telemetry.salinity, telemetry.sal, telemetry.salinity_ppt)
    : null;
  const turbVal = telemetry
    ? parseOptionalNumber(telemetry.turbidity, telemetry.turb, telemetry.turbidity_ntu)
    : null;
  const wlVal = telemetry
    ? parseOptionalNumber(telemetry.waterLevel, telemetry.water_level, telemetry.level)
    : null;

  const rDo = findThresholdRange(thresholds, ['dissolvedOxygen', 'do'], DEFAULT_THRESHOLDS.do);
  const rPh = findThresholdRange(thresholds, ['pH', 'ph'], DEFAULT_THRESHOLDS.ph);
  const rTemp = findThresholdRange(thresholds, ['temperature', 'temp'], DEFAULT_THRESHOLDS.temp);
  const rSal = findThresholdRange(thresholds, ['salinity', 'sal'], DEFAULT_THRESHOLDS.salinity);
  const rTurb = findThresholdRange(thresholds, ['turbidity', 'turb'], DEFAULT_THRESHOLDS.turbidity);
  const rWl = findThresholdRange(thresholds, ['waterLevel', 'water_level'], DEFAULT_THRESHOLDS.waterLevel);

  const doSeverity: RangeSeverity =
    doVal === null
      ? 'offline'
      : doVal < Math.min(3.5, rDo.min * 0.85)
      ? 'danger'
      : doVal < rDo.min || doVal > rDo.max
      ? 'warning'
      : 'safe';

  return [
    {
      id: 'do',
      name: 'Oxy hòa tan (DO)',
      value: doVal,
      unit: 'mg/L',
      minSafe: rDo.min,
      maxSafe: rDo.max,
      scaleMin: 0,
      scaleMax: 12,
      rangeLabel: `Chuẩn ${rDo.min}–${rDo.max} mg/L`,
      severity: doSeverity,
      iconName: 'air',
    },
    {
      id: 'ph',
      name: 'Độ pH',
      value: phVal,
      unit: 'pH',
      minSafe: rPh.min,
      maxSafe: rPh.max,
      scaleMin: 5,
      scaleMax: 10,
      rangeLabel: `Chuẩn ${rPh.min}–${rPh.max}`,
      severity: evaluateSeverity(phVal, rPh.min, rPh.max, 0.35),
      iconName: 'science',
    },
    {
      id: 'temp',
      name: 'Nhiệt độ',
      value: tempVal,
      unit: '°C',
      minSafe: rTemp.min,
      maxSafe: rTemp.max,
      scaleMin: 20,
      scaleMax: 38,
      rangeLabel: `Chuẩn ${rTemp.min}–${rTemp.max}°C`,
      severity: evaluateSeverity(tempVal, rTemp.min, rTemp.max, 0.25),
      iconName: 'device-thermostat',
    },
    {
      id: 'salinity',
      name: 'Độ mặn',
      value: salVal,
      unit: 'ppt',
      minSafe: rSal.min,
      maxSafe: rSal.max,
      scaleMin: 0,
      scaleMax: 35,
      rangeLabel: `Chuẩn ${rSal.min}–${rSal.max} ppt`,
      severity: evaluateSeverity(salVal, rSal.min, rSal.max, 0.25),
      iconName: 'water-drop',
    },
    {
      id: 'turbidity',
      name: 'Độ đục',
      value: turbVal,
      unit: 'NTU',
      minSafe: rTurb.min,
      maxSafe: rTurb.max,
      scaleMin: 0,
      scaleMax: 80,
      rangeLabel: `Chuẩn ${rTurb.min}–${rTurb.max} NTU`,
      severity: evaluateSeverity(turbVal, rTurb.min, rTurb.max, 0.25),
      iconName: 'grain',
    },
    {
      id: 'waterLevel',
      name: 'Mực nước',
      value: wlVal,
      unit: 'm',
      minSafe: rWl.min,
      maxSafe: rWl.max,
      scaleMin: 0.5,
      scaleMax: 2.2,
      rangeLabel: `Chuẩn ${rWl.min}–${rWl.max} m`,
      severity: evaluateSeverity(wlVal, rWl.min, rWl.max, 0.35),
      iconName: 'waves',
      isCommunityIcon: true,
    },
  ];
}

function computeDocDays(crop: ShrimpBatchBackend | null | undefined): number | null {
  if (!crop?.stockingDate) return null;
  const start = new Date(crop.stockingDate).getTime();
  if (isNaN(start)) return null;
  const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function computePondHealth(
  rawStatus: PondStatus,
  sensors: SensorMetric[],
  hasTelemetry: boolean
): PondHealthLevel {
  if (rawStatus === PondStatus.EMPTY || rawStatus === PondStatus.HARVESTED) {
    return 'EMPTY';
  }
  if (!hasTelemetry) {
    return 'OFFLINE';
  }
  if (sensors.some((s) => s.severity === 'danger')) {
    return 'CRITICAL';
  }
  if (sensors.some((s) => s.severity === 'warning')) {
    return 'WARNING';
  }
  return 'SAFE';
}

function pickPrimaryDevice(devices?: PondBackendResponse['devices']) {
  if (!devices || devices.length === 0) return undefined;
  return (
    devices.find((d) => d.status === 'ONLINE') ||
    devices.find((d) => d.status === 'MAINTENANCE') ||
    devices[0]
  );
}

function buildPondItem(
  backendPond: PondBackendResponse,
  telemetry: TelemetryDataBackend | null | undefined,
  thresholds: ThresholdConfigBackend[] | undefined,
  activeCrop: ShrimpBatchBackend | null | undefined,
  farmNameFallback: string
): PondItem {
  const primaryDevice = pickPrimaryDevice(backendPond.devices);
  const sensors = mapTelemetryToSensors(telemetry, thresholds);
  const byId = Object.fromEntries(sensors.map((s) => [s.id, s.value])) as Record<
    SensorMetric['id'],
    number | null
  >;
  const hasTelemetry = Object.values(byId).some((v) => v !== null);
  const recordedAt = telemetry?.recordedAt || telemetry?.recorded_at || null;

  return {
    id: backendPond.pondId,
    name: backendPond.pondName,
    farmId: backendPond.farmId ?? backendPond.farm?.farmId ?? null,
    farmName: backendPond.farm?.farmName || farmNameFallback,
    location: backendPond.location ?? null,
    areaM2: Number(backendPond.areaM2 || 0),
    depthM: Number(backendPond.depthM || 0),
    shrimpDensity: Number(backendPond.shrimpDensity || 0),
    rawStatus: backendPond.status,
    status: computePondHealth(backendPond.status, sensors, hasTelemetry),
    temp: byId.temp,
    ph: byId.ph,
    doValue: byId.do,
    salinity: byId.salinity,
    turbidity: byId.turbidity,
    waterLevel: byId.waterLevel,
    recordedAt,
    deviceId: primaryDevice?.deviceId,
    deviceName: primaryDevice?.deviceName,
    deviceStatus: primaryDevice?.status,
    docDays: computeDocDays(activeCrop),
    shrimpSpecies: activeCrop?.shrimpSpecies ?? null,
  };
}

const initialState: PondState = {
  farms: [],
  ponds: [],
  selectedPondId: '',
  pondSensors: mapTelemetryToSensors(null),
  thresholdsMap: {},
  activeCropsMap: {},
  latestTelemetryMap: {},
  lastSyncTime: '',
  loading: false,
  error: null,
};

export const fetchPonds = createAsyncThunk(
  'pond/fetchPonds',
  async (_, { rejectWithValue }) => {
    try {
      const [pondsRes, farms] = await Promise.all([pondApi.getPonds(), farmApi.getFarms()]);
      const rawPonds = pondsRes.data || [];

      const telemetryMap: Record<string, TelemetryDataBackend> = {};
      const thresholdsMap: Record<string, ThresholdConfigBackend[]> = {};
      const activeCropsMap: Record<string, ShrimpBatchBackend | null> = {};

      await Promise.all(
        rawPonds.map(async (pond) => {
          const primaryDevice = pickPrimaryDevice(pond.devices);
          const deviceId = primaryDevice?.deviceId;

          const [telemetry, thresholds, crops] = await Promise.all([
            deviceId
              ? telemetryApi.getLatestTelemetry(deviceId).catch(() => null)
              : Promise.resolve(null),
            thresholdApi.getPondThresholds(pond.pondId).catch(() => []),
            cropApi.getPondCrops(pond.pondId).catch(() => []),
          ]);

          if (telemetry) {
            telemetryMap[pond.pondId] = telemetry;
            if (deviceId) telemetryMap[deviceId] = telemetry;
          }
          thresholdsMap[pond.pondId] = thresholds;
          const activeCrop = crops.find((c) => c.status === 'ACTIVE') || crops[0] || null;
          activeCropsMap[pond.pondId] = activeCrop;
        })
      );

      return { rawPonds, farms, telemetryMap, thresholdsMap, activeCropsMap };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách ao nuôi');
    }
  }
);

export const fetchPondDetail = createAsyncThunk(
  'pond/fetchPondDetail',
  async (pondId: string, { rejectWithValue }) => {
    try {
      const pond = await pondApi.getPondById(pondId);
      if (!pond) {
        return { pond: null, telemetry: null, thresholds: [], activeCrop: null };
      }
      const primaryDevice = pickPrimaryDevice(pond.devices);
      const deviceId = primaryDevice?.deviceId;
      const [telemetry, thresholds, crops] = await Promise.all([
        deviceId ? telemetryApi.getLatestTelemetry(deviceId).catch(() => null) : Promise.resolve(null),
        thresholdApi.getPondThresholds(pondId).catch(() => []),
        cropApi.getPondCrops(pondId).catch(() => []),
      ]);
      const activeCrop = crops.find((c) => c.status === 'ACTIVE') || crops[0] || null;
      return { pond, telemetry, thresholds, activeCrop };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải chi tiết ao nuôi');
    }
  }
);

export const fetchLatestTelemetry = createAsyncThunk(
  'pond/fetchLatestTelemetry',
  async (deviceId: string, { rejectWithValue }) => {
    try {
      const telemetry = await telemetryApi.getLatestTelemetry(deviceId);
      return { deviceId, telemetry };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải thông số cảm biến');
    }
  }
);

export const fetchPondThresholdsThunk = createAsyncThunk(
  'pond/fetchThresholds',
  async (pondId: string, { rejectWithValue }) => {
    try {
      const thresholds = await thresholdApi.getPondThresholds(pondId);
      return { pondId, thresholds };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải ngưỡng an toàn');
    }
  }
);

export const pondSlice = createSlice({
  name: 'pond',
  initialState,
  reducers: {
    selectPond: (state, action: PayloadAction<string>) => {
      state.selectedPondId = action.payload;
      const selected = state.ponds.find((p) => p.id === action.payload);
      if (selected) {
        const telemetry =
          state.latestTelemetryMap[selected.id] ||
          (selected.deviceId ? state.latestTelemetryMap[selected.deviceId] : null);
        state.pondSensors = mapTelemetryToSensors(telemetry, state.thresholdsMap[selected.id]);
      }
    },
    clearPondError: (state) => {
      state.error = null;
    },
    updateRealtimeTelemetry: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      const rawTelemetry = payload?.data || payload?.telemetry || payload;
      const telemetry = unwrapApiResponse<TelemetryDataBackend>(rawTelemetry);
      if (!telemetry || typeof telemetry !== 'object') return;

      const pondId =
        telemetry.pondId ||
        telemetry.pond_id ||
        (telemetry as any).pond?.id ||
        (telemetry as any).pond?.pondId;
      const deviceId =
        telemetry.deviceId ||
        telemetry.device_id ||
        (telemetry as any).device?.id ||
        (telemetry as any).device?.deviceId;

      if (pondId) state.latestTelemetryMap[pondId] = telemetry;
      if (deviceId) state.latestTelemetryMap[deviceId] = telemetry;

      state.lastSyncTime = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const targetPond =
        state.ponds.find((p) => p.id === pondId || (deviceId && p.deviceId === deviceId)) ||
        (state.ponds.length === 1 ? state.ponds[0] : undefined);

      if (targetPond) {
        state.latestTelemetryMap[targetPond.id] = telemetry;
        if (deviceId && !targetPond.deviceId) {
          targetPond.deviceId = deviceId;
        }
        const sensors = mapTelemetryToSensors(telemetry, state.thresholdsMap[targetPond.id]);
        const byId = Object.fromEntries(sensors.map((s) => [s.id, s.value])) as Record<
          SensorMetric['id'],
          number | null
        >;
        targetPond.doValue = byId.do;
        targetPond.ph = byId.ph;
        targetPond.temp = byId.temp;
        targetPond.salinity = byId.salinity;
        targetPond.turbidity = byId.turbidity;
        targetPond.waterLevel = byId.waterLevel;
        targetPond.recordedAt =
          telemetry.recordedAt || telemetry.recorded_at || new Date().toISOString();
        targetPond.status = computePondHealth(targetPond.rawStatus, sensors, true);

        if (targetPond.id === state.selectedPondId || !state.selectedPondId) {
          state.pondSensors = sensors;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPonds.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPonds.fulfilled, (state, action) => {
      state.loading = false;
      const { rawPonds, farms, telemetryMap, thresholdsMap, activeCropsMap } = action.payload;
      state.farms = farms;
      state.latestTelemetryMap = { ...state.latestTelemetryMap, ...telemetryMap };
      state.thresholdsMap = { ...state.thresholdsMap, ...thresholdsMap };
      state.activeCropsMap = { ...state.activeCropsMap, ...activeCropsMap };

      const farmNameMap: Record<string, string> = {};
      farms.forEach((f) => {
        farmNameMap[f.farmId] = f.farmName;
        f.ponds?.forEach((fp) => {
          farmNameMap[`pond:${fp.pondId}`] = f.farmName;
        });
      });

      state.ponds = rawPonds.map((pond) => {
        const primaryDeviceId = pickPrimaryDevice(pond.devices)?.deviceId;
        const telemetry =
          telemetryMap[pond.pondId] || (primaryDeviceId ? telemetryMap[primaryDeviceId] : null);
        const farmLabel =
          pond.farm?.farmName ||
          (pond.farmId ? farmNameMap[pond.farmId] : undefined) ||
          farmNameMap[`pond:${pond.pondId}`] ||
          'Trại nuôi AquaSense';
        return buildPondItem(
          pond,
          telemetry,
          thresholdsMap[pond.pondId],
          activeCropsMap[pond.pondId],
          farmLabel
        );
      });

      if (!state.selectedPondId || !state.ponds.some((p) => p.id === state.selectedPondId)) {
        state.selectedPondId = state.ponds[0]?.id || '';
      }

      const active = state.ponds.find((p) => p.id === state.selectedPondId);
      if (active) {
        const activeTelemetry =
          telemetryMap[active.id] || (active.deviceId ? telemetryMap[active.deviceId] : null);
        state.pondSensors = mapTelemetryToSensors(activeTelemetry, thresholdsMap[active.id]);
      } else {
        state.pondSensors = mapTelemetryToSensors(null);
      }

      state.lastSyncTime = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    });
    builder.addCase(fetchPonds.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Lỗi tải danh sách ao nuôi';
    });

    builder.addCase(fetchPondDetail.fulfilled, (state, action) => {
      const { pond, telemetry, thresholds, activeCrop } = action.payload;
      if (!pond) return;
      state.thresholdsMap[pond.pondId] = thresholds;
      state.activeCropsMap[pond.pondId] = activeCrop;
      if (telemetry) {
        state.latestTelemetryMap[pond.pondId] = telemetry;
        const primaryDeviceId = pickPrimaryDevice(pond.devices)?.deviceId;
        if (primaryDeviceId) {
          state.latestTelemetryMap[primaryDeviceId] = telemetry;
        }
      }
      const existing = state.ponds.find((p) => p.id === pond.pondId);
      const rebuilt = buildPondItem(
        pond,
        telemetry,
        thresholds,
        activeCrop,
        existing?.farmName || 'Trại nuôi AquaSense'
      );
      const idx = state.ponds.findIndex((p) => p.id === pond.pondId);
      if (idx >= 0) {
        state.ponds[idx] = rebuilt;
      } else {
        state.ponds.push(rebuilt);
      }
      if (state.selectedPondId === pond.pondId || !state.selectedPondId) {
        state.pondSensors = mapTelemetryToSensors(telemetry, thresholds);
      }
    });

    builder.addCase(fetchLatestTelemetry.fulfilled, (state, action) => {
      const { deviceId, telemetry } = action.payload;
      if (telemetry) {
        state.latestTelemetryMap[deviceId] = telemetry;
        const active = state.ponds.find((p) => p.id === state.selectedPondId);
        if (active?.deviceId === deviceId) {
          state.pondSensors = mapTelemetryToSensors(telemetry, state.thresholdsMap[active.id]);
        }
      }
    });

    builder.addCase(fetchPondThresholdsThunk.fulfilled, (state, action) => {
      const { pondId, thresholds } = action.payload;
      state.thresholdsMap[pondId] = thresholds;
      if (state.selectedPondId === pondId) {
        const active = state.ponds.find((p) => p.id === pondId);
        const telemetry =
          state.latestTelemetryMap[pondId] ||
          (active?.deviceId ? state.latestTelemetryMap[active.deviceId] : null);
        state.pondSensors = mapTelemetryToSensors(telemetry, thresholds);
      }
    });

    builder.addCase(logoutThunk.fulfilled, () => initialState);
    builder.addCase(logoutAllThunk.fulfilled, () => initialState);
  },
});

export const { selectPond, clearPondError, updateRealtimeTelemetry } = pondSlice.actions;
export default pondSlice.reducer;
