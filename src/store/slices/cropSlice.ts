import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  CreateManualLogDto,
  manualLogApi,
  ManualTestLogBackend,
} from '../../services/manualLogApi';
import {
  CreateHarvestDto,
  cropApi,
  HarvestLogBackend,
  HarvestSummaryBackend,
  ShrimpBatchBackend,
} from '../../services/cropApi';
import { logoutThunk, logoutAllThunk } from './authSlice';

interface CropState {
  manualLogsByPond: Record<string, ManualTestLogBackend[]>;
  cropsByPond: Record<string, ShrimpBatchBackend[]>;
  harvestsByBatch: Record<string, HarvestLogBackend[]>;
  harvestSummaryByBatch: Record<string, HarvestSummaryBackend>;
  loadingLogs: boolean;
  loadingCrops: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: CropState = {
  manualLogsByPond: {},
  cropsByPond: {},
  harvestsByBatch: {},
  harvestSummaryByBatch: {},
  loadingLogs: false,
  loadingCrops: false,
  submitting: false,
  error: null,
};

export const fetchManualLogsThunk = createAsyncThunk(
  'crop/fetchManualLogs',
  async (pondId: string, { rejectWithValue }) => {
    try {
      const data = await manualLogApi.getManualLogs(pondId);
      return { pondId, data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải lịch sử đo tay NH3/NO2');
    }
  }
);

export const createManualLogThunk = createAsyncThunk(
  'crop/createManualLog',
  async (
    { pondId, dto }: { pondId: string; dto: CreateManualLogDto },
    { rejectWithValue }
  ) => {
    try {
      const log = await manualLogApi.createManualLog(pondId, dto);
      return { pondId, log };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể lưu kết quả đo test kit');
    }
  }
);

export const fetchPondCropsThunk = createAsyncThunk(
  'crop/fetchPondCrops',
  async (pondId: string, { rejectWithValue }) => {
    try {
      const crops = await cropApi.getPondCrops(pondId);
      const harvestsByBatch: Record<string, HarvestLogBackend[]> = {};
      const harvestSummaryByBatch: Record<string, HarvestSummaryBackend> = {};

      for (const batch of crops) {
        try {
          const [harvests, summary] = await Promise.all([
            cropApi.getHarvests(batch.batchId),
            cropApi.getHarvestSummary(batch.batchId),
          ]);
          harvestsByBatch[batch.batchId] = harvests;
          harvestSummaryByBatch[batch.batchId] = summary;
        } catch {
          // Optional harvest read failure should not fail crop card
        }
      }

      return { pondId, crops, harvestsByBatch, harvestSummaryByBatch };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải nhật ký vụ nuôi');
    }
  }
);

export const createHarvestThunk = createAsyncThunk(
  'crop/createHarvest',
  async (
    { batchId, dto }: { batchId: string; dto: CreateHarvestDto },
    { rejectWithValue }
  ) => {
    try {
      const log = await cropApi.createHarvest(batchId, dto);
      const [harvests, summary] = await Promise.all([
        cropApi.getHarvests(batchId),
        cropApi.getHarvestSummary(batchId),
      ]);
      return { batchId, log, harvests, summary };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể lưu nhật ký thu hoạch');
    }
  }
);

export const cropSlice = createSlice({
  name: 'crop',
  initialState,
  reducers: {
    clearCropError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchManualLogsThunk.pending, (state) => {
      state.loadingLogs = true;
      state.error = null;
    });
    builder.addCase(fetchManualLogsThunk.fulfilled, (state, action) => {
      state.loadingLogs = false;
      state.manualLogsByPond[action.payload.pondId] = action.payload.data;
    });
    builder.addCase(fetchManualLogsThunk.rejected, (state, action) => {
      state.loadingLogs = false;
      state.error = action.payload as string;
    });

    builder.addCase(createManualLogThunk.pending, (state) => {
      state.submitting = true;
      state.error = null;
    });
    builder.addCase(createManualLogThunk.fulfilled, (state, action) => {
      state.submitting = false;
      const { pondId, log } = action.payload;
      const existing = state.manualLogsByPond[pondId] || [];
      state.manualLogsByPond[pondId] = [log, ...existing];
    });
    builder.addCase(createManualLogThunk.rejected, (state, action) => {
      state.submitting = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchPondCropsThunk.pending, (state) => {
      state.loadingCrops = true;
      state.error = null;
    });
    builder.addCase(fetchPondCropsThunk.fulfilled, (state, action) => {
      state.loadingCrops = false;
      state.cropsByPond[action.payload.pondId] = action.payload.crops;
      state.harvestsByBatch = {
        ...state.harvestsByBatch,
        ...action.payload.harvestsByBatch,
      };
      state.harvestSummaryByBatch = {
        ...state.harvestSummaryByBatch,
        ...action.payload.harvestSummaryByBatch,
      };
    });
    builder.addCase(fetchPondCropsThunk.rejected, (state, action) => {
      state.loadingCrops = false;
      state.error = action.payload as string;
    });

    builder.addCase(createHarvestThunk.pending, (state) => {
      state.submitting = true;
      state.error = null;
    });
    builder.addCase(createHarvestThunk.fulfilled, (state, action) => {
      state.submitting = false;
      state.harvestsByBatch[action.payload.batchId] = action.payload.harvests;
      state.harvestSummaryByBatch[action.payload.batchId] = action.payload.summary;
    });
    builder.addCase(createHarvestThunk.rejected, (state, action) => {
      state.submitting = false;
      state.error = action.payload as string;
    });

    builder.addCase(logoutThunk.fulfilled, () => initialState);
    builder.addCase(logoutAllThunk.fulfilled, () => initialState);
  },
});

export const { clearCropError } = cropSlice.actions;
export default cropSlice.reducer;
