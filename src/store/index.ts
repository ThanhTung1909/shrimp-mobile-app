import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pondReducer from './slices/pondSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pond: pondReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
