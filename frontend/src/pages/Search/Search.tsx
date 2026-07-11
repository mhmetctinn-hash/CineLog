import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbApi } from '../../api/tmdb';
import { MovieCard } from '../../components/MovieCard';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
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

      {debouncedQuery.length <= 1 && (
        <p className="text-text-muted text-center mt-12">Aramak için en az 2 karakter yazın.</p>
      )}
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
