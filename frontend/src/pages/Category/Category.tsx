import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdbApi } from '../../api/tmdb';
import { MovieCard } from '../../components/MovieCard';
import { GENRE_NAMES } from '../../lib/genres';

export function Category() {
  const { genreId } = useParams<{ genreId: string }>();
  const id = Number(genreId);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tmdb', 'discover', id, page],
    queryFn: () => tmdbApi.discover(id, page),
    enabled: Number.isFinite(id),
  });

  const genreName = GENRE_NAMES[id] ?? 'Kategori';

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-4">{genreName}</h1>

      {isLoading && <p className="text-text-muted text-center mt-12">Yükleniyor...</p>}
      {isError && <p className="text-primary text-center mt-12">Bir hata oluştu.</p>}
      {data && data.results.length === 0 && (
        <p className="text-text-muted text-center mt-12">Bu kategoride film bulunamadı.</p>
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

      {data && data.total_pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-surface border border-border hover:border-accent disabled:opacity-40"
          >
            Önceki
          </button>
          <span className="text-sm text-text-muted">
            Sayfa {page} / {Math.min(data.total_pages, 500)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.min(data.total_pages, 500)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-surface border border-border hover:border-accent disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
