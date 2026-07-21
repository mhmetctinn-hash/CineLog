import { api } from './client';
import type { AppNotification } from './types';

export const notificationsApi = {
  list: () => api.get<AppNotification[]>('/notifications'),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.post<void>(`/notifications/${id}/read`),
  markAllRead: () => api.post<void>('/notifications/read-all'),
};

export const pushApi = {
  vapidPublicKey: () => api.get<{ publicKey: string | null }>('/push/vapid-public-key'),
  subscribe: (subscription: PushSubscriptionJSON) => api.post<void>('/push/subscribe', subscription),
  unsubscribe: (endpoint: string) => api.post<void>('/push/unsubscribe', { endpoint }),
};
