import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pondApi, PondBackendResponse, PondStatus } from '../../services/pondApi';
import { telemetryApi, TelemetryDataBackend } from '../../services/telemetryApi';
import { unwrapApiResponse } from '../../services/apiClient';

export interface SensorMetric {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  standard: string;
  trendText: string;
  trendIcon: 'trending-flat' | 'north-east' | 'south-east';
  iconName: string;
  isCommunityIcon?: boolean;
  percent: number;
  isError?: boolean;
  errorTagText?: string;
}

export interface PondItem {
  id: string;
  nameVi: string;
  nameEn: string;
  status: 'ACTIVE' | 'HARVESTED' | 'EMPTY' | 'ALERT' | 'OFFLINE';
  rawStatus?: PondStatus;
  healthStatus: string;
  isAlert?: boolean;
  cluster: string;
  zone: string;
  temp: number;
  doValue: number;
  feedKgPerDay: number;
  docDays: number;
  gatewayStreamStatus: string;
  linkQuality: string;
  deviceId?: string;
}

interface PondState {
  clusterName: string;
  connectedPonds: number;
  totalPonds: number;
  lastSyncTime: string;
  ponds: PondItem[];
  selectedPondId: string;
  pondASensors: SensorMetric[];
  aeratorsOn: number;
  totalAerators: number;
  aeratorMode: 'Auto High' | 'Manual' | 'Off';
  biomassTons: number;
  biomassCapPercent: number;
  aggregateTotalFeedKg: number;
  aggregateAvgDo: number;
  sensorsOk: number;
  totalSensors: number;
  doAlertResolved: boolean;
  aeratorActivated: boolean;
  sensorPingSuccess: boolean;
  hardwarePingSuccess: boolean;
  hardwareAcknowledged: boolean;
  diagnosticStatus: 'idle' | 'running' | 'passed';
  // Backend Integration State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  latestTelemetryMap: Record<string, TelemetryDataBackend>;
}

function recalculateAggregates(state: PondState) {
  state.totalPonds = state.ponds.length;
  state.connectedPonds = state.ponds.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'ALERT'
  ).length;

  const activePondsWithDo = state.ponds.filter(
    (p) => typeof p.doValue === 'number' && p.doValue > 0
  );

  state.aggregateAvgDo =
    activePondsWithDo.length > 0
      ? Math.round(
          (activePondsWithDo.reduce((sum, p) => sum + p.doValue, 0) /
            activePondsWithDo.length) *
            10
        ) / 10
      : 0;

  state.aggregateTotalFeedKg = state.ponds.reduce(
    (sum, p) => sum + (p.feedKgPerDay || 0),
    0
  );

  state.totalSensors = state.ponds.length * 3;
  state.sensorsOk = state.ponds.filter((p) => !p.isAlert).length * 3;

  state.totalAerators = state.ponds.length * 4;
  state.aeratorsOn =
    state.ponds.filter((p) => p.status === 'ACTIVE' || p.status === 'ALERT').length * 4;

  const estimatedBiomass = Math.round(state.aggregateTotalFeedKg * 0.04 * 10) / 10;
  state.biomassTons = estimatedBiomass;
  state.biomassCapPercent = Math.min(
    100,
    Math.round((estimatedBiomass / 25) * 100)
  );
}

export function mapTelemetryToSensors(rawInput?: TelemetryDataBackend | any | null): SensorMetric[] {
  const telemetry = unwrapApiResponse<TelemetryDataBackend | null>(rawInput);

  const parseVal = (val1: any, val2: any, val3: any, defaultVal: number): number => {
    const raw = val1 ?? val2 ?? val3;
    if (raw === null || raw === undefined || raw === '') return defaultVal;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return isNaN(num) ? defaultVal : Math.round(num * 100) / 100;
  };

  const temp = telemetry ? parseVal(telemetry.temperature, telemetry.temp, telemetry.temperature_celsius, 28.4) : 28.4;
  const ph = telemetry ? parseVal(telemetry.ph, telemetry.phValue, telemetry.ph_value, 7.6) : 7.6;
  const doVal = telemetry
    ? parseVal(
        telemetry.dissolvedOxygen,
        telemetry.dissolved_oxygen,
        telemetry.doVal ?? telemetry.do,
        3.8
      )
    : 3.8;
  const salinity = telemetry ? parseVal(telemetry.salinity, telemetry.sal, telemetry.salinity_ppt, 18) : 18;
  const turbidity = telemetry ? parseVal(telemetry.turbidity, telemetry.turb, telemetry.turbidity_ntu, 42) : 42;
  const waterLevel = telemetry ? parseVal(telemetry.waterLevel, telemetry.water_level, telemetry.level, 1.35) : 1.35;

  const isDoError = typeof doVal === 'number' && doVal < 4.0;
  const isPhError = typeof ph === 'number' && (ph < 7.5 || ph > 8.5);
  const isTempError = typeof temp === 'number' && (temp < 26 || temp > 30);

  return [
    {
      id: 'temp',
      name: 'Nhiệt độ',
      value: temp,
      unit: '°C',
      standard: 'Chuẩn 26–30°C',
      trendText: isTempError ? 'Ngoài dải' : 'Ổn định',
      trendIcon: isTempError ? 'north-east' : 'trending-flat',
      iconName: 'device-thermostat',
      percent: Math.min(100, Math.max(0, Math.round((temp / 35) * 100))),
      isError: isTempError,
      errorTagText: isTempError ? 'Ngoài dải chuẩn' : undefined,
    },
    {
      id: 'ph',
      name: 'Độ pH',
      value: ph,
      unit: 'pH',
      standard: 'Chuẩn 7.5–8.5',
      trendText: isPhError ? 'Lệch dải' : 'Ổn định',
      trendIcon: isPhError ? 'north-east' : 'trending-flat',
      iconName: 'water',
      percent: Math.min(100, Math.max(0, Math.round((ph / 14) * 100))),
      isError: isPhError,
      errorTagText: isPhError ? 'Lệch dải pH' : undefined,
    },
    {
      id: 'do',
      name: 'Oxy hòa tan (DO)',
      value: doVal,
      unit: 'mg/L',
      standard: 'Chuẩn >= 4.0 mg/L',
      trendText: isDoError ? '-0.5/h' : '+0.1/h',
      trendIcon: isDoError ? 'south-east' : 'trending-flat',
      iconName: 'air',
      percent: Math.min(100, Math.max(0, Math.round((doVal / 10) * 100))),
      isError: isDoError,
      errorTagText: isDoError ? 'Cảnh báo thấp' : undefined,
    },
    {
      id: 'salinity',
      name: 'Độ mặn',
      value: salinity,
      unit: 'ppt',
      standard: 'Chuẩn 15–25 ppt',
      trendText: 'Ổn định',
      trendIcon: 'trending-flat',
      iconName: 'water',
      percent: Math.min(100, Math.max(0, Math.round((salinity / 35) * 100))),
    },
    {
      id: 'turbidity',
      name: 'Độ đục',
      value: turbidity,
      unit: 'NTU',
      standard: 'Chuẩn 30–50 NTU',
      trendText: '+4 NTU/h',
      trendIcon: 'north-east',
      iconName: 'grain',
      percent: Math.min(100, Math.max(0, Math.round((turbidity / 100) * 100))),
    },
    {
      id: 'waterLevel',
      name: 'Mực nước',
      value: waterLevel,
      unit: 'm',
      standard: 'Chuẩn 1.3–1.5m',
      trendText: 'Ổn định',
      trendIcon: 'trending-flat',
      iconName: 'waves',
      isCommunityIcon: true,
      percent: Math.min(100, Math.max(0, Math.round((waterLevel / 2) * 100))),
    },
  ];
}

const initialState: PondState = {
  clusterName: 'Nông trại nuôi tôm',
  connectedPonds: 0,
  totalPonds: 0,
  lastSyncTime: 'Chưa đồng bộ',
  selectedPondId: '',
  aeratorsOn: 0,
  totalAerators: 0,
  aeratorMode: 'Auto High',
  biomassTons: 0,
  biomassCapPercent: 0,
  aggregateTotalFeedKg: 0,
  aggregateAvgDo: 0,
  sensorsOk: 0,
  totalSensors: 0,
  ponds: [],
  pondASensors: mapTelemetryToSensors(null),
  doAlertResolved: false,
  aeratorActivated: false,
  sensorPingSuccess: false,
  hardwarePingSuccess: false,
  hardwareAcknowledged: false,
  diagnosticStatus: 'idle',
  loading: false,
  refreshing: false,
  error: null,
  latestTelemetryMap: {},
};

// Async Thunks
export const fetchPonds = createAsyncThunk(
  'pond/fetchPonds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pondApi.getPonds();
      const rawPonds = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const telemetryMap: Record<string, TelemetryDataBackend> = {};

      // Fetch latest telemetry for each pond's device if available
      for (const pond of rawPonds) {
        const primaryDevice = pond.devices?.[0];
        const deviceId = primaryDevice?.deviceId || (primaryDevice as any)?.device_id;
        if (deviceId) {
          try {
            const telemetry = await telemetryApi.getLatestTelemetry(deviceId);
            if (telemetry) {
              telemetryMap[pond.pondId] = telemetry;
              telemetryMap[deviceId] = telemetry;
            }
          } catch {
            // Unhandled device telemetry 404 or offline: ignorable
          }
        }
      }

      return { rawPonds, telemetryMap };
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
        return { pond: null, telemetry: null };
      }
      let telemetry: TelemetryDataBackend | null = null;

      const primaryDevice = pond.devices?.[0];
      const deviceId = primaryDevice?.deviceId || (primaryDevice as any)?.device_id;
      if (deviceId) {
        try {
          telemetry = await telemetryApi.getLatestTelemetry(deviceId);
        } catch {
          // Device has no telemetry yet
        }
      }

      return { pond, telemetry };
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
      return rejectWithValue(err.response?.data?.message || 'Không thể tải thông số đo đạc');
    }
  }
);

export const pondSlice = createSlice({
  name: 'pond',
  initialState,
  reducers: {
    selectPond: (state, action: PayloadAction<string>) => {
      state.selectedPondId = action.payload;
    },
    toggleAeratorMode: (state) => {
      state.aeratorMode = state.aeratorMode === 'Auto High' ? 'Manual' : 'Auto High';
    },
    resolveDoAlert: (state) => {
      state.doAlertResolved = true;
    },
    toggleAeratorActivation: (state) => {
      state.aeratorActivated = !state.aeratorActivated;
    },
    pingSensor: (state) => {
      state.sensorPingSuccess = true;
    },
    pingHardware: (state) => {
      state.hardwarePingSuccess = true;
    },
    acknowledgeHardware: (state) => {
      state.hardwareAcknowledged = true;
    },
    setDiagnosticStatus: (state, action: PayloadAction<PondState['diagnosticStatus']>) => {
      state.diagnosticStatus = action.payload;
    },
    clearPondError: (state) => {
      state.error = null;
    },
    refreshRealtimeTelemetry: (state) => {
      state.lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const activePond = state.ponds.find((p) => p.id === state.selectedPondId) || state.ponds[0];
      if (activePond) {
        const telemetry = state.latestTelemetryMap[activePond.id] || state.latestTelemetryMap[activePond.deviceId || ''];
        state.pondASensors = mapTelemetryToSensors(telemetry);
      }
    },
    updateRealtimeTelemetry: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      const rawTelemetry = payload?.data || payload?.telemetry || payload;
      const telemetry = unwrapApiResponse<TelemetryDataBackend>(rawTelemetry);
      if (!telemetry || typeof telemetry !== 'object') return;

      const pondId = telemetry.pondId || telemetry.pond_id || (telemetry as any).pond?.id || (telemetry as any).pond?.pondId;
      const deviceId = telemetry.deviceId || telemetry.device_id || (telemetry as any).device?.id || (telemetry as any).device?.deviceId;

      if (pondId) {
        state.latestTelemetryMap[pondId] = telemetry;
      }
      if (deviceId) {
        state.latestTelemetryMap[deviceId] = telemetry;
      }

      state.lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const parseVal = (val1: any, val2: any, val3: any, defaultVal: number): number => {
        const raw = val1 ?? val2 ?? val3;
        if (raw === null || raw === undefined || raw === '') return defaultVal;
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
        return isNaN(num) ? defaultVal : Math.round(num * 100) / 100;
      };

      // Cập nhật giá trị vào item tương ứng trong state.ponds (hoặc pond duy nhất nếu chỉ có 1 ao)
      let targetPond = state.ponds.find(
        (p) => p.id === pondId || (deviceId && p.deviceId === deviceId)
      );

      if (!targetPond && state.ponds.length > 0) {
        targetPond = state.ponds.find((p) => p.id === state.selectedPondId) || state.ponds[0];
      }

      if (targetPond) {
        if (!pondId && targetPond.id) {
          state.latestTelemetryMap[targetPond.id] = telemetry;
        }
        if (deviceId && !targetPond.deviceId) {
          targetPond.deviceId = deviceId;
        }
        const temp = parseVal(telemetry.temperature, telemetry.temp, telemetry.temperature_celsius, targetPond.temp);
        const doValue = parseVal(
          telemetry.dissolvedOxygen,
          telemetry.dissolved_oxygen,
          telemetry.do,
          targetPond.doValue
        );

        targetPond.temp = temp;
        targetPond.doValue = doValue;
        if (doValue < 4.0 || temp < 26 || temp > 30) {
          targetPond.status = 'ALERT';
          targetPond.isAlert = true;
          targetPond.healthStatus = 'Cảnh báo';
        } else if (targetPond.rawStatus === PondStatus.EMPTY || targetPond.rawStatus === PondStatus.HARVESTED) {
          targetPond.status = 'EMPTY';
          targetPond.isAlert = false;
          targetPond.healthStatus = 'Ao trống';
        } else {
          targetPond.status = 'ACTIVE';
          targetPond.isAlert = false;
          targetPond.healthStatus = 'Đang nuôi';
        }
      }

      // Cập nhật gauges cho ao đang chọn
      const activePond = state.ponds.find((p) => p.id === state.selectedPondId) || state.ponds[0];
      if (!pondId || !activePond || activePond.id === pondId || (deviceId && activePond.deviceId === deviceId) || state.ponds.length === 1) {
        state.pondASensors = mapTelemetryToSensors(telemetry);
      }

      recalculateAggregates(state);
    },
  },
  extraReducers: (builder) => {
    // fetchPonds
    builder.addCase(fetchPonds.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPonds.fulfilled, (state, action) => {
      state.loading = false;
      state.refreshing = false;
      const { rawPonds, telemetryMap } = action.payload;
      state.latestTelemetryMap = { ...state.latestTelemetryMap, ...telemetryMap };

      if (rawPonds.length > 0) {
        state.ponds = rawPonds.map((backendPond) => {
          const primaryDeviceId = backendPond.devices?.[0]?.deviceId || (backendPond.devices?.[0] as any)?.device_id;
          const rawTelemetry = telemetryMap[backendPond.pondId] || (primaryDeviceId ? telemetryMap[primaryDeviceId] : null);
          const telemetry = unwrapApiResponse<TelemetryDataBackend | null>(rawTelemetry);

          const parseVal = (val1: any, val2: any, val3: any, defaultVal: number): number => {
            const raw = val1 ?? val2 ?? val3;
            if (raw === null || raw === undefined || raw === '') return defaultVal;
            const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
            return isNaN(num) ? defaultVal : Math.round(num * 100) / 100;
          };

          const temp = parseVal(telemetry?.temperature, telemetry?.temp, null, 28.4);
          const ph = parseVal(telemetry?.ph, telemetry?.phValue, null, 7.6);
          const doValue = parseVal(
            telemetry?.dissolvedOxygen,
            telemetry?.dissolved_oxygen,
            telemetry?.do,
            4.2
          );

          const isDoAlert = doValue < 4.0;
          const isPhAlert = ph < 7.5 || ph > 8.5;
          const isAlert = isDoAlert || isPhAlert;

          let status: 'ACTIVE' | 'EMPTY' | 'ALERT' = 'ACTIVE';

          if (isAlert) {
            status = 'ALERT';
          } else if (
            backendPond.status === PondStatus.EMPTY ||
            backendPond.status === PondStatus.HARVESTED
          ) {
            status = 'EMPTY';
          } else {
            status = 'ACTIVE';
          }

          return {
            id: backendPond.pondId,
            nameVi: backendPond.pondName,
            nameEn: backendPond.pondName,
            status,
            rawStatus: backendPond.status,
            healthStatus: status === 'ALERT' ? 'Cảnh báo' : status === 'EMPTY' ? 'Ao trống' : 'Đang nuôi',
            isAlert,
            cluster: 'Nông trại chính',
            zone: `Diện tích ${backendPond.areaM2}m²`,
            temp,
            doValue,
            feedKgPerDay: Math.round(backendPond.areaM2 * 0.1),
            docDays: 45,
            gatewayStreamStatus: 'Just now • PondGuard v3.1',
            linkQuality: '99.8% LINK',
            deviceId: primaryDeviceId,
          };
        });

        // Set selectedPondId to first pond if current selection is invalid or empty
        if (!state.selectedPondId || !state.ponds.some((p) => p.id === state.selectedPondId)) {
          state.selectedPondId = state.ponds[0].id;
        }

        // Update pondASensors if active pond has telemetry
        const activePond = state.ponds.find((p) => p.id === state.selectedPondId);
        if (activePond) {
          const activeTelemetry = telemetryMap[activePond.id] || (activePond.deviceId ? telemetryMap[activePond.deviceId] : null);
          state.pondASensors = mapTelemetryToSensors(activeTelemetry);
        }

        recalculateAggregates(state);
      } else {
        state.ponds = [];
        recalculateAggregates(state);
      }

      state.lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    builder.addCase(fetchPonds.rejected, (state, action) => {
      state.loading = false;
      state.refreshing = false;
      state.error = (action.payload as string) || 'Lỗi tải danh sách ao nuôi';
    });

    // fetchPondDetail
    builder.addCase(fetchPondDetail.fulfilled, (state, action) => {
      const { pond, telemetry } = action.payload;
      if (pond && telemetry) {
        state.latestTelemetryMap[pond.pondId] = telemetry;
        if (pond.devices?.[0]?.deviceId) {
          state.latestTelemetryMap[pond.devices[0].deviceId] = telemetry;
        }
      }
      if (telemetry) {
        state.pondASensors = mapTelemetryToSensors(telemetry);
      }
    });

    // fetchLatestTelemetry
    builder.addCase(fetchLatestTelemetry.fulfilled, (state, action) => {
      const { deviceId, telemetry } = action.payload;
      if (telemetry) {
        state.latestTelemetryMap[deviceId] = telemetry;
        state.pondASensors = mapTelemetryToSensors(telemetry);
      }
    });
  },
});

export const {
  selectPond,
  toggleAeratorMode,
  resolveDoAlert,
  toggleAeratorActivation,
  pingSensor,
  pingHardware,
  acknowledgeHardware,
  setDiagnosticStatus,
  clearPondError,
  refreshRealtimeTelemetry,
  updateRealtimeTelemetry,
} = pondSlice.actions;

export default pondSlice.reducer;
