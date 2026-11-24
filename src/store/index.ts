import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pondReducer from './slices/pondSlice';
import userReducer from './slices/userSlice';
import alertReducer from './slices/alertSlice';
import deviceReducer from './slices/deviceSlice';
import predictionReducer from './slices/predictionSlice';
import cropReducer from './slices/cropSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    pond: pondReducer,
    alert: alertReducer,
    device: deviceReducer,
    prediction: predictionReducer,
    crop: cropReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
