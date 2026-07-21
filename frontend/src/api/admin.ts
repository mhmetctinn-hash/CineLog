import { api } from './client';
import type { AdminStats, AdminUser } from './types';

export const adminApi = {
  users: () => api.get<AdminUser[]>('/admin/users'),
  removeUser: (id: string) => api.delete<void>(`/admin/users/${id}`),
  stats: () => api.get<AdminStats>('/admin/stats'),
};
