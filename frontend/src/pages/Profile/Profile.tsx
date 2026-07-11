import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsApi } from '../../api/logs';
import { MovieCard } from '../../components/MovieCard';
import { StarRating } from '../../components/StarRating';

type SortOption = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';

export function Profile() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>('date_desc');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => logsApi.list(),
  });

  const deleteLog = useMutation({
    mutationFn: (id: string) => logsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logs'] }),
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const term = search.trim().toLowerCase();
    const filtered = logs.filter((log) => {
      const matchesSearch = !term || log.title.toLowerCase().includes(term);
      const matchesRating = (log.rating ?? 0) >= minRating;
      return matchesSearch && matchesRating;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'date_asc':
          return a.watched_date.localeCompare(b.watched_date);
        case 'rating_desc':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'rating_asc':
          return (a.rating ?? 0) - (b.rating ?? 0);
        case 'date_desc':
        default:
          return b.watched_date.localeCompare(a.watched_date);
      }
    });
  }, [logs, search, minRating, sort]);

  if (isLoading) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  if (!logs || logs.length === 0) {
    return <p className="text-text-muted text-center mt-12">Henüz hiç film loglamadınız.</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-4">Loglarım</h1>

      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Film ara</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlıkta ara..."
            className="px-2 py-1 rounded border border-border bg-surface text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Minimum puanım: {minRating || 'Hepsi'}</label>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-32"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Sırala</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-2 py-1 rounded border border-border bg-surface text-sm"
          >
            <option value="date_desc">Tarih (yeni → eski)</option>
            <option value="date_asc">Tarih (eski → yeni)</option>
            <option value="rating_desc">Puanım (yüksek → düşük)</option>
            <option value="rating_asc">Puanım (düşük → yüksek)</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="text-text-muted text-center mt-12">Bu filtrelere uyan log yok.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredLogs.map((log) => (
            <MovieCard
              key={log.id}
              tmdbId={log.tmdb_id}
              title={log.title}
              posterPath={log.poster_path}
              subtitle={log.watched_date.slice(0, 10)}
              actions={
                <div className="flex flex-col gap-2">
                  <StarRating value={log.rating} readOnly />
                  <button
                    onClick={() => deleteLog.mutate(log.id)}
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
    </div>
  );
}
