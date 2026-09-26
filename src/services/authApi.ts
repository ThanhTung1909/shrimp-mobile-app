import { apiClient } from './apiClient';

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
    const response = await apiClient.post<LoginResponse>('/auth/login', dto);
    return response.data;
  },

  sendOtp: async (dto: SendOtpDto): Promise<SendOtpResponse> => {
    const response = await apiClient.post<SendOtpResponse>('/auth/send-otp', dto);
    return response.data;
  },

  verifyOtp: async (dto: VerifyOtpDto): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', dto);
    return response.data;
  },

  getMe: async (): Promise<UserMeResponse> => {
    const response = await apiClient.get<UserMeResponse>('/auth/me');
    return response.data;
  },

  changePassword: async (dto: ChangePasswordDto): Promise<ChangePasswordResponse> => {
    const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', dto);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
    return response.data;
  },

  logoutAll: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout-all');
    return response.data;
  },
};
