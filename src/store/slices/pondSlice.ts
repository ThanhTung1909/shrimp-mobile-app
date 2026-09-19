import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PondItem {
  id: string;
  nameVi: string;
  nameEn: string;
  status: 'ACTIVE' | 'ALERT' | 'OFFLINE';
  healthStatus: string;
  isAlert?: boolean;
  temp: number;
  doValue: number;
  feedKgPerDay: number;
  docDays: number;
}

interface PondState {
  clusterName: string;
  connectedPonds: number;
  totalPonds: number;
  lastSyncTime: string;
  ponds: PondItem[];
  aeratorsOn: number;
  totalAerators: number;
  aeratorMode: 'Auto High' | 'Manual' | 'Off';
  biomassTons: number;
  biomassCapPercent: number;
  aggregateTotalFeedKg: number;
  aggregateAvgDo: number;
  sensorsOk: number;
  totalSensors: number;
  selectedPondId: string | null;
}

const initialState: PondState = {
  clusterName: 'Vijayawada Farm Cluster #01',
  connectedPonds: 4,
  totalPonds: 4,
  lastSyncTime: '10:45 AM',
  ponds: [
    {
      id: 'pond-a',
      nameVi: 'Ao A',
      nameEn: 'Pond A',
      status: 'ACTIVE',
      healthStatus: 'Normal',
      temp: 4.8,
      doValue: 23.2,
      feedKgPerDay: 120,
      docDays: 45,
    },
    {
      id: 'pond-e',
      nameVi: 'Ao E',
      nameEn: 'Pond E',
      status: 'ACTIVE',
      healthStatus: 'Normal',
      temp: 5.1,
      doValue: 21.8,
      feedKgPerDay: 95,
      docDays: 32,
    },
    {
      id: 'pond-f',
      nameVi: 'Ao F',
      nameEn: 'Pond F',
      status: 'ALERT',
      healthStatus: 'ShrimpTalk no comm',
      isAlert: true,
      temp: 4.2,
      doValue: 18.5,
      feedKgPerDay: 110,
      docDays: 50,
    },
    {
      id: 'pond-x',
      nameVi: 'Ao X',
      nameEn: 'Pond X',
      status: 'ACTIVE',
      healthStatus: 'Normal',
      temp: 4.9,
      doValue: 22.4,
      feedKgPerDay: 140,
      docDays: 62,
    },
  ],
  aeratorsOn: 16,
  totalAerators: 16,
  aeratorMode: 'Auto High',
  biomassTons: 18.4,
  biomassCapPercent: 78,
  aggregateTotalFeedKg: 465,
  aggregateAvgDo: 21.5,
  sensorsOk: 12,
  totalSensors: 12,
  selectedPondId: null,
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
  },
});

export const { selectPond, toggleAeratorMode } = pondSlice.actions;
export default pondSlice.reducer;
