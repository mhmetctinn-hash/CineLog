import { GENRE_NAMES } from './genres';
import { TV_GENRE_NAMES } from './tvGenres';

export function resolveGenreName(genreId: number): string {
  return GENRE_NAMES[genreId] ?? TV_GENRE_NAMES[genreId] ?? `Tür #${genreId}`;
}
