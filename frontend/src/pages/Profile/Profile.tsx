import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsApi } from '../../api/logs';
import { MovieCard } from '../../components/MovieCard';
import { StarRating } from '../../components/StarRating';

export function Profile() {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => logsApi.list(),
  });

  const deleteLog = useMutation({
    mutationFn: (id: string) => logsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logs'] }),
  });

  if (isLoading) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  if (!logs || logs.length === 0) {
    return <p className="text-text-muted text-center mt-12">Henüz hiç film loglamadınız.</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-4">Loglarım</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {logs.map((log) => (
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
    </div>
  );
}
