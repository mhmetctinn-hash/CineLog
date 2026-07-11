import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '../../api/watchlist';
import { tvApi } from '../../api/tv';
import { MovieCard } from '../../components/MovieCard';

type Mode = 'movie' | 'tv';

export function Watchlist() {
  const [mode, setMode] = useState<Mode>('movie');
  const queryClient = useQueryClient();

  const { data: movieItems, isLoading: movieLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list(),
    enabled: mode === 'movie',
  });

  const { data: tvItems, isLoading: tvLoading } = useQuery({
    queryKey: ['tv-watchlist'],
    queryFn: () => tvApi.watchlist.list(),
    enabled: mode === 'tv',
  });

  const removeMovie = useMutation({
    mutationFn: (id: string) => watchlistApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const removeTv = useMutation({
    mutationFn: (id: string) => tvApi.watchlist.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tv-watchlist'] }),
  });

  const isLoading = mode === 'movie' ? movieLoading : tvLoading;
  const items = mode === 'movie' ? movieItems : tvItems;

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-4">İzleme Listesi</h1>

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

      {isLoading && <p className="text-text-muted text-center mt-12">Yükleniyor...</p>}
      {!isLoading && (!items || items.length === 0) && (
        <p className="text-text-muted text-center mt-12">İzleme listeniz boş.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mode === 'movie'
          ? movieItems?.map((item) => (
              <MovieCard
                key={item.id}
                tmdbId={item.tmdb_id}
                title={item.title}
                posterPath={item.poster_path}
                actions={
                  <button
                    onClick={() => removeMovie.mutate(item.id)}
                    className="text-xs text-text-muted hover:text-primary"
                  >
                    Listeden Çıkar
                  </button>
                }
              />
            ))
          : tvItems?.map((item) => (
              <MovieCard
                key={item.id}
                tmdbId={item.tmdb_id}
                title={item.name}
                posterPath={item.poster_path}
                linkTo={`/tv/${item.tmdb_id}`}
                actions={
                  <button
                    onClick={() => removeTv.mutate(item.id)}
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
