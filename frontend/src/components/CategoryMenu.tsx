import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRE_NAMES } from '../lib/genres';

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const genres = Object.entries(GENRE_NAMES).sort((a, b) => a[1].localeCompare(b[1], 'tr'));

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
        <div className="absolute left-0 mt-1 w-56 max-h-96 overflow-y-auto bg-surface border border-border rounded-md shadow-lg z-20 py-1 grid grid-cols-2 gap-x-1">
          {genres.map(([id, name]) => (
            <button
              key={id}
              onClick={() => {
                setOpen(false);
                navigate(`/category/${id}`);
              }}
              className="text-left px-3 py-1.5 text-sm text-text hover:bg-base hover:text-highlight transition-colors rounded"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
