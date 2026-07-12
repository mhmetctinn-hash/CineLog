import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsApi } from '../../api/logs';
import { tvApi } from '../../api/tv';
import { MovieCard } from '../../components/MovieCard';
import { StarRating } from '../../components/StarRating';
import type { LogStatus } from '../../api/types';

type SortOption = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';
type StatusFilter = LogStatus | 'all';
type Mode = 'movie' | 'tv';

const STATUS_LABEL: Record<LogStatus, string> = {
  watched: 'İzledim',
  dropped: 'Yarım Bıraktım',
};

interface CommonLog {
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  watchedDate: string;
  status: LogStatus;
  rating: number | null;
}

export function Profile() {
  const [mode, setMode] = useState<Mode>('movie');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>('date_desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data: moviePages,
    isLoading: movieLoading,
    fetchNextPage: fetchNextMoviePage,
    hasNextPage: hasNextMoviePage,
    isFetchingNextPage: isFetchingNextMoviePage,
  } = useInfiniteQuery({
    queryKey: ['logs-page', statusFilter],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      logsApi.page({ status: statusFilter === 'all' ? undefined : statusFilter, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: mode === 'movie',
  });

  const {
    data: tvPages,
    isLoading: tvLoading,
    fetchNextPage: fetchNextTvPage,
    hasNextPage: hasNextTvPage,
    isFetchingNextPage: isFetchingNextTvPage,
  } = useInfiniteQuery({
    queryKey: ['tv-logs-page', statusFilter],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      tvApi.logs.page({ status: statusFilter === 'all' ? undefined : statusFilter, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: mode === 'tv',
  });

  const deleteMovieLog = useMutation({
    mutationFn: (id: string) => logsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs-page'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['logs-stats'] });
    },
  });

  const deleteTvLog = useMutation({
    mutationFn: (id: string) => tvApi.logs.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-logs-page'] });
      queryClient.invalidateQueries({ queryKey: ['tv-logs'] });
    },
  });

  const logs = useMemo<CommonLog[]>(() => {
    if (mode === 'movie') {
      return (moviePages?.pages.flatMap((page) => page.items) ?? []).map((l) => ({
        id: l.id,
        tmdbId: l.tmdb_id,
        title: l.title,
        posterPath: l.poster_path,
        watchedDate: l.watched_date,
        status: l.status,
        rating: l.rating,
      }));
    }
    return (tvPages?.pages.flatMap((page) => page.items) ?? []).map((l) => ({
      id: l.id,
      tmdbId: l.tmdb_id,
      title: l.name,
      posterPath: l.poster_path,
      watchedDate: l.watched_date,
      status: l.status,
      rating: l.rating,
    }));
  }, [mode, moviePages, tvPages]);

  const isLoading = mode === 'movie' ? movieLoading : tvLoading;
  const hasNextPage = mode === 'movie' ? hasNextMoviePage : hasNextTvPage;
  const isFetchingNextPage = mode === 'movie' ? isFetchingNextMoviePage : isFetchingNextTvPage;
  const fetchNextPage = mode === 'movie' ? fetchNextMoviePage : fetchNextTvPage;

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = logs.filter((log) => {
      const matchesSearch = !term || log.title.toLowerCase().includes(term);
      const matchesRating = (log.rating ?? 0) >= minRating;
      return matchesSearch && matchesRating;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'date_asc':
          return a.watchedDate.localeCompare(b.watchedDate);
        case 'rating_desc':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'rating_asc':
          return (a.rating ?? 0) - (b.rating ?? 0);
        case 'date_desc':
        default:
          return b.watchedDate.localeCompare(a.watchedDate);
      }
    });
  }, [logs, search, minRating, sort]);

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold text-highlight mb-4">Loglarım</h1>

      <div className="flex gap-2 mb-4">
        {(['movie', 'tv'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'
            }`}
          >
            {m === 'movie' ? 'Filmler' : 'Diziler'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
          <label className="text-xs text-text-muted">Başlıkta ara</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlıkta ara..."
            className="px-3 py-2 rounded-md border border-border bg-base text-sm outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Durum</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 rounded-md border border-border bg-base text-sm outline-none focus:border-accent transition-colors"
          >
            <option value="all">Hepsi</option>
            <option value="watched">{STATUS_LABEL.watched}</option>
            <option value="dropped">{STATUS_LABEL.dropped}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 justify-center">
          <label className="text-xs text-text-muted">Minimum puanım: {minRating || 'Hepsi'}</label>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Sırala</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 rounded-md border border-border bg-base text-sm outline-none focus:border-accent transition-colors"
          >
            <option value="date_desc">Tarih (yeni → eski)</option>
            <option value="date_asc">Tarih (eski → yeni)</option>
            <option value="rating_desc">Puanım (yüksek → düşük)</option>
            <option value="rating_asc">Puanım (düşük → yüksek)</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-text-muted text-center mt-12">Yükleniyor...</p>}

      {!isLoading && logs.length === 0 && (
        <p className="text-text-muted text-center mt-12">
          {mode === 'movie' ? 'Henüz hiç film loglamadınız.' : 'Henüz hiç dizi loglamadınız.'}
        </p>
      )}

      {!isLoading && logs.length > 0 && filteredLogs.length === 0 && (
        <p className="text-text-muted text-center mt-12">Bu filtrelere uyan log yok.</p>
      )}

      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredLogs.map((log) => (
            <MovieCard
              key={log.id}
              tmdbId={log.tmdbId}
              title={log.title}
              posterPath={log.posterPath}
              subtitle={log.watchedDate.slice(0, 10)}
              linkTo={mode === 'tv' ? `/tv/${log.tmdbId}` : undefined}
              actions={
                <div className="flex flex-col gap-2">
                  <span
                    className={`text-[10px] w-fit px-1.5 py-0.5 rounded-full font-medium ${
                      log.status === 'dropped' ? 'bg-border text-text-muted' : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {STATUS_LABEL[log.status]}
                  </span>
                  <StarRating value={log.rating} readOnly />
                  <button
                    onClick={() => (mode === 'movie' ? deleteMovieLog.mutate(log.id) : deleteTvLog.mutate(log.id))}
                    className="text-xs text-text-muted hover:text-primary text-left"
                  >
                    Sil
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-border hover:border-accent disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
          </button>
        </div>
      )}
    </div>
  );
}
