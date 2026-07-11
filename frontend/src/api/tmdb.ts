import { api } from './client';
import type { TmdbMovieDetail, TmdbSearchResult } from './types';

export const tmdbApi = {
  search: (query: string, page = 1) =>
    api.get<TmdbSearchResult>(`/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`),
  movie: (id: number | string) => api.get<TmdbMovieDetail>(`/tmdb/movie/${id}`),
};
