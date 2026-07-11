import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tmdbApi } from '../../api/tmdb';
import { MovieCard } from '../../components/MovieCard';
import { posterUrl } from '../../lib/tmdbImage';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function Recommendations() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['tmdb', 'recommendations'],
    queryFn: () => tmdbApi.recommendations(),
  });

  if (isLoading) {
    return <p className="text-text-muted text-center mt-12">Öneriler hazırlanıyor...</p>;
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-text-muted text-center mt-12">
        Sana özel öneriler için birkaç film loglayıp puanla — CineLog beğendiğin türlere göre önerecek.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-text-muted mb-3">Senin İçin Önerilenler</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.map((rec) => (
          <button key={rec.tmdbId} onClick={() => navigate(`/movie/${rec.tmdbId}`)} className="text-left group">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface border border-border">
              {posterUrl(rec.posterPath, 'w200') ? (
                <img
                  src={posterUrl(rec.posterPath, 'w200')!}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-xs p-2 text-center">
                  {rec.title}
                </div>
              )}
            </div>
            <p className="text-xs text-text mt-1 truncate">{rec.title}</p>
            <p className="text-[11px] text-text-muted truncate">{rec.reason}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tmdb', 'search', debouncedQuery],
    queryFn: () => tmdbApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Film ara..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-surface border border-border rounded-md px-4 py-3 outline-none focus:border-accent mb-6"
        autoFocus
      />

      {debouncedQuery.length <= 1 && <Recommendations />}
      {isLoading && <p className="text-text-muted text-center mt-12">Aranıyor...</p>}
      {isError && <p className="text-primary text-center mt-12">Arama sırasında bir hata oluştu.</p>}
      {data && data.results.length === 0 && (
        <p className="text-text-muted text-center mt-12">Sonuç bulunamadı.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data?.results.map((movie) => (
          <MovieCard
            key={movie.id}
            tmdbId={movie.id}
            title={movie.title}
            posterPath={movie.poster_path}
            subtitle={movie.release_date?.slice(0, 4)}
          />
        ))}
      </div>
    </div>
  );
}
