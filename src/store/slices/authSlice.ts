import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  userPhone: string;
  rememberDevice: boolean;
  selectedLanguage: 'vi';
}

const initialState: AuthState = {
  isAuthenticated: false,
  userPhone: '0987654321',
  rememberDevice: true,
  selectedLanguage: 'vi',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRememberDevice: (state, action: PayloadAction<boolean>) => {
      state.rememberDevice = action.payload;
    },
    setUserPhone: (state, action: PayloadAction<string>) => {
      state.userPhone = action.payload;
    },
    loginSuccess: (state) => {
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
    },
  },
});

export const { setRememberDevice, setUserPhone, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
