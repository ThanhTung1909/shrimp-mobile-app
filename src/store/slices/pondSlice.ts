import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  status: 'ACTIVE' | 'ALERT' | 'OFFLINE';
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
}

const initialState: PondState = {
  clusterName: 'Vijayawada Farm Cluster #01',
  connectedPonds: 4,
  totalPonds: 4,
  lastSyncTime: '10:45 AM',
  selectedPondId: 'pond-a',
  aeratorsOn: 16,
  totalAerators: 16,
  aeratorMode: 'Auto High',
  biomassTons: 18.4,
  biomassCapPercent: 78,
  aggregateTotalFeedKg: 465,
  aggregateAvgDo: 21.5,
  sensorsOk: 12,
  totalSensors: 12,
  ponds: [
    {
      id: 'pond-a',
      nameVi: 'Ao A',
      nameEn: 'Pond A',
      status: 'ACTIVE',
      healthStatus: 'Normal',
      cluster: 'Vijayawada Cluster',
      zone: 'Zone 1',
      temp: 4.8,
      doValue: 23.2,
      feedKgPerDay: 120,
      docDays: 45,
      gatewayStreamStatus: 'Just now • PondGuard v3.1',
      linkQuality: '99.8% LINK',
    },
    {
      id: 'pond-e',
      nameVi: 'Ao E',
      nameEn: 'Pond E',
      status: 'ACTIVE',
      healthStatus: 'Normal',
      cluster: 'Vijayawada Cluster',
      zone: 'Zone 1',
      temp: 5.1,
      doValue: 21.8,
      feedKgPerDay: 95,
      docDays: 32,
      gatewayStreamStatus: 'Just now • PondGuard v3.1',
      linkQuality: '99.5% LINK',
    },
    {
      id: 'pond-f',
      nameVi: 'Ao F',
      nameEn: 'Pond F',
      status: 'ALERT',
      healthStatus: 'ShrimpTalk no comm',
      isAlert: true,
      cluster: 'Vijayawada Cluster',
      zone: 'Zone 2',
      temp: 4.2,
      doValue: 18.5,
      feedKgPerDay: 110,
      docDays: 50,
      gatewayStreamStatus: '12m ago • PondGuard v3.1',
      linkQuality: '72.4% LINK',
    },
    {
      id: 'pond-x',
      nameVi: 'Ao X',
      nameEn: 'Pond X',
      status: 'ACTIVE',
      healthStatus: 'Normal',
      cluster: 'Vijayawada Cluster',
      zone: 'Zone 2',
      temp: 4.9,
      doValue: 22.4,
      feedKgPerDay: 140,
      docDays: 62,
      gatewayStreamStatus: 'Just now • PondGuard v3.1',
      linkQuality: '99.9% LINK',
    },
  ],
  pondASensors: [
    {
      id: 'temp',
      name: 'Nhiệt độ',
      value: 28.4,
      unit: '°C',
      standard: 'Chuẩn 26–30°C',
      trendText: 'Ổn định',
      trendIcon: 'trending-flat',
      iconName: 'device-thermostat',
      percent: 68,
    },
    {
      id: 'ph',
      name: 'Độ pH',
      value: 7.6,
      unit: 'pH',
      standard: 'Chuẩn 7.5–8.5',
      trendText: '+0.2/h',
      trendIcon: 'north-east',
      iconName: 'water',
      percent: 55,
    },
    {
      id: 'do',
      name: 'Oxy hòa tan (DO)',
      value: 3.8,
      unit: 'mg/L',
      standard: 'Chuẩn >= 4.0 mg/L',
      trendText: '-0.5/h',
      trendIcon: 'south-east',
      iconName: 'air',
      percent: 32,
      isError: true,
      errorTagText: 'Cảnh báo thấp',
    },
    {
      id: 'salinity',
      name: 'Độ mặn',
      value: 18,
      unit: 'ppt',
      standard: 'Chuẩn 15–25 ppt',
      trendText: 'Ổn định',
      trendIcon: 'trending-flat',
      iconName: 'water',
      percent: 60,
    },
    {
      id: 'turbidity',
      name: 'Độ đục',
      value: 42,
      unit: 'NTU',
      standard: 'Chuẩn 30–50 NTU',
      trendText: '+4 NTU/h',
      trendIcon: 'north-east',
      iconName: 'grain',
      percent: 65,
    },
    {
      id: 'waterLevel',
      name: 'Mực nước',
      value: 1.35,
      unit: 'm',
      standard: 'Chuẩn 1.3–1.5m',
      trendText: 'Ổn định',
      trendIcon: 'trending-flat',
      iconName: 'waves',
      isCommunityIcon: true,
      percent: 75,
    },
  ],
  doAlertResolved: false,
  aeratorActivated: false,
  sensorPingSuccess: false,
  hardwarePingSuccess: false,
  hardwareAcknowledged: false,
  diagnosticStatus: 'idle',
};

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
} = pondSlice.actions;

export default pondSlice.reducer;
