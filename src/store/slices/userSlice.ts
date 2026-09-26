import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi, UserItem, UpdateProfileDto } from '../../services/userApi';
import { authApi, UserMeResponse, Role, Gender } from '../../services/authApi';

export interface UserState {
  userId: string | null;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  role: Role | null;
  isActive: boolean;
  fcmToken: string | null;
  isLoading: boolean;
  userError: string | null;
}

const initialState: UserState = {
  userId: null,
  fullName: '',
  phoneNumber: '',
  email: null,
  gender: null,
  dateOfBirth: null,
  role: null,
  isActive: true,
  fcmToken: null,
  isLoading: false,
  userError: null,
};

// Thunk lấy thông tin profile Nông dân từ API me
export const fetchProfileThunk = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.getMe();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể lấy thông tin cá nhân');
    }
  }
);

// Thunk cập nhật hồ sơ cá nhân Nông dân
export const updateProfileThunk = createAsyncThunk(
  'user/updateProfile',
  async (dto: UpdateProfileDto, { rejectWithValue }) => {
    try {
      const response = await userApi.updateProfile(dto);
      return response.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Cập nhật thông tin thất bại');
    }
  }
);

// Thunk đăng ký FCM Token nhận cảnh báo môi trường ao tôm
export const updateFcmTokenThunk = createAsyncThunk(
  'user/updateFcmToken',
  async (fcmToken: string, { rejectWithValue }) => {
    try {
      await userApi.updateFcmToken(fcmToken);
      return fcmToken;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Đăng ký nhận thông báo thất bại');
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile: (
      state,
      action: PayloadAction<Partial<UserMeResponse> | Partial<UserItem>>
    ) => {
      if (action.payload.userId) state.userId = action.payload.userId;
      if (action.payload.fullName !== undefined) state.fullName = action.payload.fullName;
      if (action.payload.phoneNumber !== undefined) state.phoneNumber = action.payload.phoneNumber;
      if (action.payload.email !== undefined) state.email = action.payload.email;
      if (action.payload.gender !== undefined) state.gender = action.payload.gender;
      if (action.payload.dateOfBirth !== undefined)
        state.dateOfBirth = action.payload.dateOfBirth ? String(action.payload.dateOfBirth) : null;
      if (action.payload.role) state.role = action.payload.role;
      if (action.payload.isActive !== undefined) state.isActive = action.payload.isActive;
    },
    clearUserProfile: (state) => {
      state.userId = null;
      state.fullName = '';
      state.phoneNumber = '';
      state.email = null;
      state.gender = null;
      state.dateOfBirth = null;
      state.role = null;
      state.isActive = true;
      state.fcmToken = null;
      state.userError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProfileThunk
    builder.addCase(fetchProfileThunk.pending, (state) => {
      state.isLoading = true;
      state.userError = null;
    });
    builder.addCase(fetchProfileThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userId = action.payload.userId;
      state.fullName = action.payload.fullName;
      state.phoneNumber = action.payload.phoneNumber;
      state.email = action.payload.email;
      state.gender = action.payload.gender;
      state.dateOfBirth = action.payload.dateOfBirth ? String(action.payload.dateOfBirth) : null;
      state.role = action.payload.role;
      state.isActive = action.payload.isActive;
    });
    builder.addCase(fetchProfileThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.userError = action.payload as string;
    });

    // updateProfileThunk
    builder.addCase(updateProfileThunk.pending, (state) => {
      state.isLoading = true;
      state.userError = null;
    });
    builder.addCase(updateProfileThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
      state.gender = action.payload.gender;
      state.dateOfBirth = action.payload.dateOfBirth ? String(action.payload.dateOfBirth) : null;
    });
    builder.addCase(updateProfileThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.userError = action.payload as string;
    });

    // updateFcmTokenThunk
    builder.addCase(updateFcmTokenThunk.fulfilled, (state, action) => {
      state.fcmToken = action.payload;
    });
  },
});

export const { setUserProfile, clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
