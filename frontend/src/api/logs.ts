import { api } from './client';
import type { MovieLog } from './types';

export interface CreateLogInput {
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
}

export type UpdateLogInput = Omit<CreateLogInput, 'tmdbId'>;

export const logsApi = {
  list: (tmdbId?: number) =>
    api.get<MovieLog[]>(`/logs${tmdbId ? `?tmdbId=${tmdbId}` : ''}`),
  create: (input: CreateLogInput) => api.post<MovieLog>('/logs', input),
  update: (id: string, input: UpdateLogInput) => api.put<MovieLog>(`/logs/${id}`, input),
  remove: (id: string) => api.delete<void>(`/logs/${id}`),
};
