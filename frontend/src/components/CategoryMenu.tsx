import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRE_NAMES } from '../lib/genres';
import { TV_GENRE_NAMES } from '../lib/tvGenres';
import { useUserMovieLibrary, useUserTvLibrary } from '../lib/useUserLibrary';

function genresPresentIn(items: { genreIds: number[] }[], names: Record<number, string>) {
  const ids = new Set<number>();
  for (const item of items) for (const g of item.genreIds) if (g in names) ids.add(g);
  return [...ids].sort((a, b) => names[a].localeCompare(names[b], 'tr'));
}

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const { items: movies } = useUserMovieLibrary();
  const { items: shows } = useUserTvLibrary();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const movieGenres = genresPresentIn(movies, GENRE_NAMES);
  const tvGenres = genresPresentIn(shows, TV_GENRE_NAMES);

  function go(mediaType: 'movie' | 'tv', genreId: number) {
    setOpen(false);
    navigate(`/category/${mediaType}/${genreId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          open ? 'bg-surface text-text' : 'text-text-muted hover:text-text hover:bg-surface'
        }`}
      >
        Kategoriler ▾
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-72 max-h-96 overflow-y-auto bg-surface border border-border rounded-md shadow-lg z-20 py-2">
          {movieGenres.length === 0 && tvGenres.length === 0 && (
            <p className="px-3 py-2 text-xs text-text-muted">
              Kategoriler, logladığın veya izleme listene eklediğin film/dizilerden oluşur. Henüz yeterli veri yok.
            </p>
          )}

          {movieGenres.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-text-muted">Filmlerim</p>
              <div className="grid grid-cols-2 gap-x-1">
                {movieGenres.map((id) => (
                  <button
                    key={`movie-${id}`}
                    onClick={() => go('movie', id)}
                    className="text-left px-3 py-1.5 text-sm text-text hover:bg-base hover:text-highlight transition-colors rounded"
                  >
                    {GENRE_NAMES[id]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tvGenres.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-text-muted">Dizilerim</p>
              <div className="grid grid-cols-2 gap-x-1">
                {tvGenres.map((id) => (
                  <button
                    key={`tv-${id}`}
                    onClick={() => go('tv', id)}
                    className="text-left px-3 py-1.5 text-sm text-text hover:bg-base hover:text-highlight transition-colors rounded"
                  >
                    {TV_GENRE_NAMES[id]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
