import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pondReducer from './slices/pondSlice';
import userReducer from './slices/userSlice';

import alertReducer from './slices/alertSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pond: pondReducer,
    user: userReducer,
    alert: alertReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
