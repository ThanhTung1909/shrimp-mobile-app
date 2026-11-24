import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logoutThunk, logoutAllThunk } from './authSlice';

export interface ToastMessage {
  text: string;
  tone: 'safe' | 'warning' | 'danger';
}

interface UiState {
  largeTextMode: boolean;
  socketConnected: boolean;
  pondSelectorOpen: boolean;
  selectedFarmId: string | null;
  toastMessage: ToastMessage | null;
}

const initialState: UiState = {
  largeTextMode: false,
  socketConnected: false,
  pondSelectorOpen: false,
  selectedFarmId: null,
  toastMessage: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleLargeTextMode: (state) => {
      state.largeTextMode = !state.largeTextMode;
    },
    setLargeTextMode: (state, action: PayloadAction<boolean>) => {
      state.largeTextMode = action.payload;
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    setPondSelectorOpen: (state, action: PayloadAction<boolean>) => {
      state.pondSelectorOpen = action.payload;
    },
    setSelectedFarmId: (state, action: PayloadAction<string | null>) => {
      state.selectedFarmId = action.payload;
    },
    showToast: (state, action: PayloadAction<ToastMessage>) => {
      state.toastMessage = action.payload;
    },
    clearToast: (state) => {
      state.toastMessage = null;
    },
  },
  extraReducers: (builder) => {
    const resetSessionUi = (state: UiState) => {
      state.socketConnected = false;
      state.pondSelectorOpen = false;
      state.selectedFarmId = null;
      state.toastMessage = null;
    };
    builder.addCase(logoutThunk.fulfilled, resetSessionUi);
    builder.addCase(logoutAllThunk.fulfilled, resetSessionUi);
  },
});

export const {
  toggleLargeTextMode,
  setLargeTextMode,
  setSocketConnected,
  setPondSelectorOpen,
  setSelectedFarmId,
  showToast,
  clearToast,
} = uiSlice.actions;

export default uiSlice.reducer;
