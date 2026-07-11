import { api } from './client';
import type { LogStats, LogStatus, MovieLog, MovieLogPage } from './types';

export interface CreateLogInput {
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export type UpdateLogInput = Omit<CreateLogInput, 'tmdbId'>;

export interface ListLogsPageInput {
  status?: LogStatus;
  cursor?: string;
  limit?: number;
}

export const logsApi = {
  list: (tmdbId?: number) =>
    api.get<MovieLog[]>(`/logs${tmdbId ? `?tmdbId=${tmdbId}` : ''}`),
  page: (input: ListLogsPageInput = {}) => {
    const params = new URLSearchParams();
    if (input.status) params.set('status', input.status);
    if (input.cursor) params.set('cursor', input.cursor);
    if (input.limit) params.set('limit', String(input.limit));
    const query = params.toString();
    return api.get<MovieLogPage>(`/logs/page${query ? `?${query}` : ''}`);
  },
  create: (input: CreateLogInput) => api.post<MovieLog>('/logs', input),
  update: (id: string, input: UpdateLogInput) => api.put<MovieLog>(`/logs/${id}`, input),
  remove: (id: string) => api.delete<void>(`/logs/${id}`),
  stats: () => api.get<LogStats>('/logs/stats'),
};
