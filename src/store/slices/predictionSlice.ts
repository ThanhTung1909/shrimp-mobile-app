import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  DiseaseRiskResponse,
  predictionApi,
  WaterQualityForecastResponse,
} from '../../services/predictionApi';
import { logoutThunk, logoutAllThunk } from './authSlice';

interface PredictionState {
  waterQualityByPond: Record<string, WaterQualityForecastResponse>;
  diseaseRiskByPond: Record<string, DiseaseRiskResponse>;
  loadingWaterQuality: boolean;
  loadingDiseaseRisk: boolean;
  errorWaterQuality: string | null;
  errorDiseaseRisk: string | null;
}

const initialState: PredictionState = {
  waterQualityByPond: {},
  diseaseRiskByPond: {},
  loadingWaterQuality: false,
  loadingDiseaseRisk: false,
  errorWaterQuality: null,
  errorDiseaseRisk: null,
};

export const fetchWaterQualityThunk = createAsyncThunk(
  'prediction/fetchWaterQuality',
  async (
    {
      pondId,
      horizonHours = 24,
      stepHours = 2,
      refresh = false,
    }: { pondId: string; horizonHours?: number; stepHours?: number; refresh?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const data = await predictionApi.getWaterQualityForecast(pondId, {
        horizonHours,
        stepHours,
        refresh,
      });
      return { pondId, data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Không thể tải dự báo chất lượng nước AI'
      );
    }
  }
);

export const fetchDiseaseRiskThunk = createAsyncThunk(
  'prediction/fetchDiseaseRisk',
  async (
    { pondId, refresh = false }: { pondId: string; refresh?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const data = await predictionApi.getDiseaseRisk(pondId, { refresh });
      return { pondId, data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Không thể tải đánh giá nguy cơ dịch bệnh AI'
      );
    }
  }
);

export const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    clearPredictionErrors: (state) => {
      state.errorWaterQuality = null;
      state.errorDiseaseRisk = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWaterQualityThunk.pending, (state) => {
      state.loadingWaterQuality = true;
      state.errorWaterQuality = null;
    });
    builder.addCase(fetchWaterQualityThunk.fulfilled, (state, action) => {
      state.loadingWaterQuality = false;
      state.waterQualityByPond[action.payload.pondId] = action.payload.data;
    });
    builder.addCase(fetchWaterQualityThunk.rejected, (state, action) => {
      state.loadingWaterQuality = false;
      state.errorWaterQuality = action.payload as string;
    });

    builder.addCase(fetchDiseaseRiskThunk.pending, (state) => {
      state.loadingDiseaseRisk = true;
      state.errorDiseaseRisk = null;
    });
    builder.addCase(fetchDiseaseRiskThunk.fulfilled, (state, action) => {
      state.loadingDiseaseRisk = false;
      state.diseaseRiskByPond[action.payload.pondId] = action.payload.data;
    });
    builder.addCase(fetchDiseaseRiskThunk.rejected, (state, action) => {
      state.loadingDiseaseRisk = false;
      state.errorDiseaseRisk = action.payload as string;
    });

    builder.addCase(logoutThunk.fulfilled, () => initialState);
    builder.addCase(logoutAllThunk.fulfilled, () => initialState);
  },
});

export const { clearPredictionErrors } = predictionSlice.actions;
export default predictionSlice.reducer;
