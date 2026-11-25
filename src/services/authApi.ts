import { apiClient, unwrapApiResponse } from './apiClient';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  FARMER = 'FARMER',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export type OtpPurpose = 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_PASSWORD' | 'LOGIN';

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
  purpose?: OtpPurpose;
}

export interface SendOtpResponse {
  message: string;
  phoneNumber: string;
  otp?: string;
  expiresIn?: string;
}

export interface VerifyOtpDto {
  phoneNumber?: string;
  email?: string;
  otp: string;
  purpose?: OtpPurpose;
}

export interface VerifyOtpResponse {
  message: string;
  phoneNumber?: string;
  email?: string;
  isValid: boolean;
}

export interface ForgotPasswordDto {
  phoneNumber?: string;
  email?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  otp?: string;
  expiresIn?: string;
}

export interface ResetPasswordDto {
  phoneNumber?: string;
  email?: string;
  newPassword: string;
}

export interface RegisterDto {
  fullName: string;
  phoneNumber: string;
  email: string;
  role: Role;
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
  otp: string;
  refreshToken?: string;
}

export interface ChangePasswordResponse {
  message: string;
  userId: string;
  tokenVersion: number;
  mustChangePassword: boolean;
  accessToken: string;
  refreshToken: string;
}

// RecoveryIdentifierDto rejects requests containing both phoneNumber and email
function buildIdentifierBody(dto: { phoneNumber?: string; email?: string }) {
  const email = dto.email?.trim();
  const phoneNumber = dto.phoneNumber?.trim();
  if (email && !phoneNumber) {
    return { email };
  }
  return { phoneNumber: phoneNumber || '' };
}

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<any>('/auth/login', dto);
    const payload = response.data;
    const targetObj = unwrapApiResponse<Record<string, any>>(payload) ?? {};

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
    const body = {
      ...dto,
      purpose: dto.purpose ?? 'LOGIN',
    };
    const response = await apiClient.post<any>('/auth/send-otp', body);
    return unwrapApiResponse<SendOtpResponse>(response.data);
  },

  verifyOtp: async (dto: VerifyOtpDto): Promise<VerifyOtpResponse> => {
    const body = {
      ...buildIdentifierBody(dto),
      otp: dto.otp,
      purpose: dto.purpose ?? 'LOGIN',
    };
    const response = await apiClient.post<any>('/auth/verify-otp', body);
    return unwrapApiResponse<VerifyOtpResponse>(response.data);
  },

  forgotPassword: async (dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> => {
    const body = buildIdentifierBody(dto);
    const response = await apiClient.post<any>('/auth/forgot-password', body);
    return unwrapApiResponse<ForgotPasswordResponse>(response.data);
  },

  resetPassword: async (dto: ResetPasswordDto): Promise<{ message: string }> => {
    const body = {
      ...buildIdentifierBody(dto),
      newPassword: dto.newPassword,
    };
    const response = await apiClient.post<any>('/auth/reset-password', body);
    return unwrapApiResponse<{ message: string }>(response.data);
  },

  register: async (dto: RegisterDto): Promise<any> => {
    const response = await apiClient.post<any>('/auth/register', dto);
    return unwrapApiResponse<any>(response.data);
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
