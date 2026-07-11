import { api } from './client';
import type { WatchlistItem } from './types';

export const watchlistApi = {
  list: (tmdbId?: number) =>
    api.get<WatchlistItem[]>(`/watchlist${tmdbId ? `?tmdbId=${tmdbId}` : ''}`),
  add: (tmdbId: number) => api.post<WatchlistItem>('/watchlist', { tmdbId }),
  remove: (id: string) => api.delete<void>(`/watchlist/${id}`),
};
