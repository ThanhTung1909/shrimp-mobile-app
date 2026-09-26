import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, LoginDto, ChangePasswordDto, Role } from '../../services/authApi';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  saveRememberPhone,
  getRememberPhone,
  clearRememberPhone,
} from '../../utils/secureStore';
import { setUserProfile, clearUserProfile } from './userSlice';

interface AuthState {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isLoading: boolean;
  error: string | null;
  userPhone: string;
  rememberDevice: boolean;
  mustChangePassword: boolean;
  selectedLanguage: 'vi';
  role: Role | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isBootstrapping: true,
  isLoading: false,
  error: null,
  userPhone: '',
  rememberDevice: true,
  mustChangePassword: false,
  selectedLanguage: 'vi',
  role: null,
};

// Khôi phục phiên làm việc khi ứng dụng vừa mở
export const bootstrapAuthThunk = createAsyncThunk(
  'auth/bootstrap',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Đọc SĐT đã ghi nhớ nếu có
      const rememberedPhone = await getRememberPhone();
      if (rememberedPhone) {
        dispatch(setUserPhone(rememberedPhone));
      }

      const token = await getAccessToken();
      if (!token) {
        return null;
      }

      // Kiểm tra phiên đăng nhập bằng API me
      const meData = await authApi.getMe();
      dispatch(setUserProfile(meData));
      return meData;
    } catch (err: any) {
      await clearTokens();
      dispatch(clearUserProfile());
      return rejectWithValue(err.response?.data?.message || 'Phiên làm việc hết hạn');
    }
  }
);

// Thunk thực hiện Đăng nhập
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (dto: LoginDto, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await authApi.login(dto);

      // Lưu Token vào SecureStore
      await saveTokens(response.accessToken, response.refreshToken);

      // Lưu/Xóa SĐT ghi nhớ tùy thuộc tùy chọn rememberDevice
      const state = (getState() as any).auth as AuthState;
      if (state.rememberDevice) {
        await saveRememberPhone(dto.phoneNumber);
      } else {
        await clearRememberPhone();
      }

      // Cập nhật Profile vào UserSlice
      dispatch(
        setUserProfile({
          userId: response.userId,
          fullName: response.fullName,
          phoneNumber: response.phoneNumber,
          role: response.role,
        })
      );

      return response;
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      return rejectWithValue(message);
    }
  }
);

// Thunk thực hiện Đăng xuất
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Lỗi khi thu hồi refresh token trên server:', err);
    } finally {
      await clearTokens();
      dispatch(clearUserProfile());
    }
  }
);

// Thunk thực hiện Đổi mật khẩu
export const changePasswordThunk = createAsyncThunk(
  'auth/changePassword',
  async (dto: ChangePasswordDto, { rejectWithValue }) => {
    try {
      const response = await authApi.changePassword(dto);
      // Lưu Token mới sau khi đổi mật khẩu
      await saveTokens(response.accessToken, response.refreshToken);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  }
);

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
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // bootstrapAuthThunk
    builder.addCase(bootstrapAuthThunk.pending, (state) => {
      state.isBootstrapping = true;
    });
    builder.addCase(bootstrapAuthThunk.fulfilled, (state, action) => {
      state.isBootstrapping = false;
      if (action.payload) {
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.mustChangePassword = action.payload.mustChangePassword;
      } else {
        state.isAuthenticated = false;
      }
    });
    builder.addCase(bootstrapAuthThunk.rejected, (state) => {
      state.isBootstrapping = false;
      state.isAuthenticated = false;
    });

    // loginThunk
    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.userPhone = action.payload.phoneNumber;
      state.role = action.payload.role;
      state.mustChangePassword = action.payload.mustChangePassword;
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // logoutThunk
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.mustChangePassword = false;
    });

    // changePasswordThunk
    builder.addCase(changePasswordThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(changePasswordThunk.fulfilled, (state) => {
      state.isLoading = false;
      state.mustChangePassword = false;
    });
    builder.addCase(changePasswordThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setRememberDevice, setUserPhone, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
