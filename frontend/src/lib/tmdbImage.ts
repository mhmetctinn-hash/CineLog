export function posterUrl(path: string | null, size: 'w200' | 'w342' | 'w500' | 'w780' = 'w342'): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
