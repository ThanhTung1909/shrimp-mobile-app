import { apiClient } from './apiClient';
import { Role, Gender } from './authApi';

export interface UserItem {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  role: Role;
  fcmToken: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  tokenVersion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: UserItem;
}

export const userApi = {
  // Nông dân tự cập nhật thông tin cá nhân
  updateProfile: async (dto: UpdateProfileDto): Promise<UpdateProfileResponse> => {
    const response = await apiClient.patch<UpdateProfileResponse>('/users/profile', dto);
    return response.data;
  },

  // Cập nhật FCM token để Nông dân nhận thông báo cảnh báo đẩy (Push Notification)
  updateFcmToken: async (fcmToken: string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/users/fcm-token', { fcmToken });
    return response.data;
  },

  // Lấy chi tiết thông tin cá nhân theo ID
  getUserById: async (id: string): Promise<UserItem> => {
    const response = await apiClient.get<UserItem>(`/users/${id}`);
    return response.data;
  },
};
