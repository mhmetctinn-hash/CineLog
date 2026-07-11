import { api } from './client';
import type { LogStatus, TmdbTvDetail, TmdbTvSearchResult, TvLog, TvLogPage, TvWatchlistItem } from './types';

export interface CreateTvLogInput {
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export type UpdateTvLogInput = Omit<CreateTvLogInput, 'tmdbId'>;

export interface ListTvLogsPageInput {
  status?: LogStatus;
  cursor?: string;
  limit?: number;
}

export const tvApi = {
  search: (query: string, page = 1) =>
    api.get<TmdbTvSearchResult>(`/tv/search?query=${encodeURIComponent(query)}&page=${page}`),
  details: (id: number | string) => api.get<TmdbTvDetail>(`/tv/${id}`),

  logs: {
    list: (tmdbId?: number) => api.get<TvLog[]>(`/tv/logs${tmdbId ? `?tmdbId=${tmdbId}` : ''}`),
    page: (input: ListTvLogsPageInput = {}) => {
      const params = new URLSearchParams();
      if (input.status) params.set('status', input.status);
      if (input.cursor) params.set('cursor', input.cursor);
      if (input.limit) params.set('limit', String(input.limit));
      const query = params.toString();
      return api.get<TvLogPage>(`/tv/logs/page${query ? `?${query}` : ''}`);
    },
    create: (input: CreateTvLogInput) => api.post<TvLog>('/tv/logs', input),
    update: (id: string, input: UpdateTvLogInput) => api.put<TvLog>(`/tv/logs/${id}`, input),
    remove: (id: string) => api.delete<void>(`/tv/logs/${id}`),
  },

  watchlist: {
    list: (tmdbId?: number) => api.get<TvWatchlistItem[]>(`/tv/watchlist${tmdbId ? `?tmdbId=${tmdbId}` : ''}`),
    add: (tmdbId: number) => api.post<TvWatchlistItem>('/tv/watchlist', { tmdbId }),
    remove: (id: string) => api.delete<void>(`/tv/watchlist/${id}`),
  },
};
