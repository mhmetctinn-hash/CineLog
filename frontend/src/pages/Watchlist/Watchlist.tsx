import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '../../api/watchlist';
import { MovieCard } from '../../components/MovieCard';

export function Watchlist() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => watchlistApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  if (isLoading) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  if (!items || items.length === 0) {
    return <p className="text-text-muted text-center mt-12">İzleme listeniz boş.</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-4">İzleme Listesi</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MovieCard
            key={item.id}
            tmdbId={item.tmdb_id}
            title={item.title}
            posterPath={item.poster_path}
            actions={
              <button
                onClick={() => remove.mutate(item.id)}
                className="text-xs text-text-muted hover:text-primary"
              >
                Listeden Çıkar
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
