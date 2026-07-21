import { api } from './client';
import type { User } from './types';

export const authApi = {
  register: (email: string, password: string) =>
    api.post<User>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<User>('/auth/login', { email, password }),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  updateAvatar: (avatarUrl: string) => api.put<{ avatarUrl: string }>('/auth/avatar', { avatarUrl }),
  removeAvatar: () => api.delete<void>('/auth/avatar'),
  forgotPassword: (email: string) => api.post<void>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<void>('/auth/reset-password', { token, password }),
};
