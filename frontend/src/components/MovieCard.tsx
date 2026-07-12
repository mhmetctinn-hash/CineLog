import { Link } from 'react-router-dom';
import { posterUrl } from '../lib/tmdbImage';

interface MovieCardProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  subtitle?: string;
  actions?: React.ReactNode;
  linkTo?: string;
}

export function MovieCard({ tmdbId, title, posterPath, subtitle, actions, linkTo }: MovieCardProps) {
  const src = posterUrl(posterPath, 'w342');
  const to = linkTo ?? `/movie/${tmdbId}`;

  return (
    <div className="bg-surface rounded-lg overflow-hidden border border-border flex flex-col">
      <Link to={to} className="block aspect-[2/3] bg-base">
        {src ? (
          <img src={src} alt={title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-sm p-2 text-center">
            {title}
          </div>
        )}
      </Link>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <Link to={to} className="font-medium text-sm sm:text-base line-clamp-2 hover:text-highlight transition-colors">
          {title}
        </Link>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        {actions && <div className="mt-auto pt-1">{actions}</div>}
      </div>
    </div>
  );
}
