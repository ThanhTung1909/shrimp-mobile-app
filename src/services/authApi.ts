import { apiClient, unwrapApiResponse } from './apiClient';

export enum Role {
  MANAGER = 'MANAGER',
  FARMER = 'FARMER',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface LoginDto {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  fullName: string;
  phoneNumber: string;
  role: Role;
  tokenVersion: number;
  mustChangePassword: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface SendOtpDto {
  phoneNumber: string;
}

export interface SendOtpResponse {
  message: string;
  phoneNumber: string;
  otp?: string;
  expiresIn: string;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  phoneNumber: string;
  isValid: boolean;
}

export interface UserMeResponse {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  tokenVersion: number;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  userId: string;
  tokenVersion: number;
  mustChangePassword: boolean;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<any>('/auth/login', dto);
    const payload = response.data;
    const targetObj = payload?.data && typeof payload.data === 'object' ? payload.data : payload;

    const accessToken =
      targetObj?.accessToken ||
      targetObj?.access_token ||
      targetObj?.token ||
      payload?.accessToken ||
      payload?.token ||
      '';

    const refreshToken =
      targetObj?.refreshToken ||
      targetObj?.refresh_token ||
      payload?.refreshToken ||
      '';

    return {
      userId: targetObj?.userId || targetObj?.id || '',
      fullName: targetObj?.fullName || targetObj?.name || '',
      phoneNumber: targetObj?.phoneNumber || dto.phoneNumber,
      role: targetObj?.role || Role.FARMER,
      tokenVersion: targetObj?.tokenVersion || 1,
      mustChangePassword: !!targetObj?.mustChangePassword,
      accessToken,
      refreshToken,
    };
  },

  sendOtp: async (dto: SendOtpDto): Promise<SendOtpResponse> => {
    const response = await apiClient.post<any>('/auth/send-otp', dto);
    return unwrapApiResponse<SendOtpResponse>(response.data);
  },

  verifyOtp: async (dto: VerifyOtpDto): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<any>('/auth/verify-otp', dto);
    return unwrapApiResponse<VerifyOtpResponse>(response.data);
  },

  getMe: async (): Promise<UserMeResponse> => {
    const response = await apiClient.get<any>('/auth/me');
    return unwrapApiResponse<UserMeResponse>(response.data);
  },

  changePassword: async (dto: ChangePasswordDto): Promise<ChangePasswordResponse> => {
    const response = await apiClient.post<any>('/auth/change-password', dto);
    return unwrapApiResponse<ChangePasswordResponse>(response.data);
  },

  logout: async (refreshToken: string): Promise<{ message: string }> => {
    const response = await apiClient.post<any>('/auth/logout', { refreshToken });
    return unwrapApiResponse<{ message: string }>(response.data);
  },

  logoutAll: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<any>('/auth/logout-all');
    return unwrapApiResponse<{ message: string }>(response.data);
  },
};
