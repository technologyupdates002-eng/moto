import { api } from './client';
import type {
  LoginCredentials,
  LoginResponse,
  AuthUser,
} from '@/types';

export const authApi = {
  login: (creds: LoginCredentials) =>
    api.post<LoginResponse>('/auth/login', creds),

  logout: () => api.post<void>('/auth/logout'),

  me: () => api.get<AuthUser>('/auth/me'),

  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
    api.post<{ message: string }>('/auth/password', data),

  forcePasswordChange: (data: { new_password: string; new_password_confirmation: string }) =>
    api.post<{ message: string }>('/auth/force-password-change', data),
};
