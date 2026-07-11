import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MovieCard } from '../../components/MovieCard';
import { StarRating } from '../../components/StarRating';
import { GENRE_NAMES } from '../../lib/genres';
import { TV_GENRE_NAMES } from '../../lib/tvGenres';
import { useUserMovieLibrary, useUserTvLibrary } from '../../lib/useUserLibrary';

type MediaType = 'movie' | 'tv';

export function Category() {
  const { mediaType, genreId } = useParams<{ mediaType: MediaType; genreId: string }>();
  const id = Number(genreId);
  const isTv = mediaType === 'tv';

  const { items: movies, isLoading: movieLoading } = useUserMovieLibrary();
  const { items: shows, isLoading: tvLoading } = useUserTvLibrary();

  const items = useMemo(() => {
    const source = isTv ? shows : movies;
    return source.filter((item) => item.genreIds.includes(id));
  }, [isTv, movies, shows, id]);

  const isLoading = isTv ? tvLoading : movieLoading;
  const genreName = (isTv ? TV_GENRE_NAMES[id] : GENRE_NAMES[id]) ?? 'Kategori';

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-1">{genreName}</h1>
      <p className="text-xs text-text-muted mb-4">
        {isTv ? 'Logladığın veya izleme listendeki diziler' : 'Logladığın veya izleme listendeki filmler'}
      </p>

      {isLoading && <p className="text-text-muted text-center mt-12">Yükleniyor...</p>}
      {!isLoading && items.length === 0 && (
        <p className="text-text-muted text-center mt-12">
          Bu kategoride henüz {isTv ? 'logladığın veya izleme listene eklediğin bir dizi' : 'logladığın veya izleme listene eklediğin bir film'} yok.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MovieCard
            key={item.tmdbId}
            tmdbId={item.tmdbId}
            title={item.title}
            posterPath={item.posterPath}
            linkTo={isTv ? `/tv/${item.tmdbId}` : undefined}
            subtitle={item.subtitle}
            actions={item.rating != null ? <StarRating value={item.rating} readOnly /> : undefined}
          />
        ))}
      </div>
    </div>
  );
}
