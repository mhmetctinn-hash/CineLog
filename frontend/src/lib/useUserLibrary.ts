import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../api/logs';
import { watchlistApi } from '../api/watchlist';
import { tvApi } from '../api/tv';

export interface PersonalItem {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  rating: number | null;
  subtitle: string;
}

// Everything the user has personally added — logged or watchlisted — deduped by
// tmdbId. This backs the category menu/pages so browsing never pulls TMDB's
// full catalog, only the user's own collection.
export function useUserMovieLibrary() {
  const { data: logs, isLoading: logsLoading } = useQuery({ queryKey: ['logs'], queryFn: () => logsApi.list() });
  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list(),
  });

  const items = useMemo<PersonalItem[]>(() => {
    const byId = new Map<number, PersonalItem>();
    for (const log of logs ?? []) {
      byId.set(log.tmdb_id, {
        tmdbId: log.tmdb_id,
        title: log.title,
        posterPath: log.poster_path,
        genreIds: log.genre_ids ?? [],
        rating: log.rating,
        subtitle: log.status === 'dropped' ? 'Yarım Bıraktım' : 'İzledim',
      });
    }
    for (const item of watchlist ?? []) {
      if (byId.has(item.tmdb_id)) continue;
      byId.set(item.tmdb_id, {
        tmdbId: item.tmdb_id,
        title: item.title,
        posterPath: item.poster_path,
        genreIds: [],
        rating: null,
        subtitle: 'İzleyeceğim',
      });
    }
    return [...byId.values()];
  }, [logs, watchlist]);

  return { items, isLoading: logsLoading || watchlistLoading };
}

export function useUserTvLibrary() {
  const { data: logs, isLoading: logsLoading } = useQuery({ queryKey: ['tv-logs'], queryFn: () => tvApi.logs.list() });
  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['tv-watchlist'],
    queryFn: () => tvApi.watchlist.list(),
  });

  const items = useMemo<PersonalItem[]>(() => {
    const byId = new Map<number, PersonalItem>();
    for (const log of logs ?? []) {
      byId.set(log.tmdb_id, {
        tmdbId: log.tmdb_id,
        title: log.name,
        posterPath: log.poster_path,
        genreIds: log.genre_ids ?? [],
        rating: log.rating,
        subtitle: log.status === 'dropped' ? 'Yarım Bıraktım' : 'İzledim',
      });
    }
    for (const item of watchlist ?? []) {
      if (byId.has(item.tmdb_id)) continue;
      byId.set(item.tmdb_id, {
        tmdbId: item.tmdb_id,
        title: item.name,
        posterPath: item.poster_path,
        genreIds: [],
        rating: null,
        subtitle: 'İzleyeceğim',
      });
    }
    return [...byId.values()];
  }, [logs, watchlist]);

  return { items, isLoading: logsLoading || watchlistLoading };
}
