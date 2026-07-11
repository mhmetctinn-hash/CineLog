import { api } from './client';
import type { LogStatus, TmdbTvDetail, TmdbTvSearchResult, TvLog, TvWatchlistItem } from './types';

export interface CreateTvLogInput {
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export type UpdateTvLogInput = Omit<CreateTvLogInput, 'tmdbId'>;

export const tvApi = {
  search: (query: string, page = 1) =>
    api.get<TmdbTvSearchResult>(`/tv/search?query=${encodeURIComponent(query)}&page=${page}`),
  discover: (genreId: number, page = 1) =>
    api.get<TmdbTvSearchResult>(`/tv/discover?genre=${genreId}&page=${page}`),
  details: (id: number | string) => api.get<TmdbTvDetail>(`/tv/${id}`),

  logs: {
    list: (tmdbId?: number) => api.get<TvLog[]>(`/tv/logs${tmdbId ? `?tmdbId=${tmdbId}` : ''}`),
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
