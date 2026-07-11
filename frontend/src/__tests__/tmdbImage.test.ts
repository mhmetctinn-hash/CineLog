import { describe, expect, it } from 'vitest';
import { posterUrl } from '../lib/tmdbImage';

describe('posterUrl', () => {
  it('returns null when there is no poster path', () => {
    expect(posterUrl(null)).toBeNull();
  });

  it('builds a full TMDB image URL at the default size', () => {
    expect(posterUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w342/abc123.jpg');
  });

  it('respects an explicit size', () => {
    expect(posterUrl('/abc123.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
  });
});
