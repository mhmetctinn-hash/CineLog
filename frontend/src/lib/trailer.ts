import type { TmdbVideo } from '../api/types';

export function pickBestTrailer(videos: TmdbVideo[] | undefined): TmdbVideo | null {
  if (!videos || videos.length === 0) return null;
  const youtube = videos.filter((v) => v.site === 'YouTube');
  if (youtube.length === 0) return null;

  const score = (v: TmdbVideo) => {
    let s = 0;
    if (v.iso_639_1 === 'tr') s += 10;
    if (v.type === 'Trailer') s += 4;
    if (v.type === 'Teaser') s += 2;
    if (v.official) s += 1;
    return s;
  };

  return [...youtube].sort((a, b) => score(b) - score(a))[0];
}

// cc_lang_pref asks YouTube to prefer Turkish captions (auto-translated when the
// video itself has no native Turkish track) — best effort within the free API.
export function youtubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${key}?cc_load_policy=1&cc_lang_pref=tr`;
}
