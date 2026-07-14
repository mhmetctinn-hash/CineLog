import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tvApi } from '../../api/tv';
import { posterUrl } from '../../lib/tmdbImage';
import { StarRating } from '../../components/StarRating';
import { ShareCard } from '../../components/ShareCard';
import { ReviewText } from '../../components/ReviewText';
import { SpoilerGuard } from '../../components/SpoilerGuard';
import { ApiError } from '../../api/client';
import type { LogStatus } from '../../api/types';
import { pickBestTrailer, youtubeEmbedUrl } from '../../lib/trailer';

const STATUS_LABEL: Record<LogStatus, string> = {
  watched: 'İzledim',
  dropped: 'Yarım Bıraktım',
};

export function TvDetail() {
  const { id } = useParams<{ id: string }>();
  const tmdbId = Number(id);
  const queryClient = useQueryClient();

  const { data: show, isLoading } = useQuery({
    queryKey: ['tv', 'details', tmdbId],
    queryFn: () => tvApi.details(tmdbId),
    enabled: Number.isFinite(tmdbId),
  });

  const { data: logs } = useQuery({
    queryKey: ['tv-logs', tmdbId],
    queryFn: () => tvApi.logs.list(tmdbId),
    enabled: Number.isFinite(tmdbId),
  });

  const { data: watchlist } = useQuery({
    queryKey: ['tv-watchlist', tmdbId],
    queryFn: () => tvApi.watchlist.list(tmdbId),
    enabled: Number.isFinite(tmdbId),
  });

  const existingLog = logs?.[0] ?? null;
  const watchlistEntry = watchlist?.[0] ?? null;

  const [rating, setRating] = useState<number | null>(existingLog?.rating ?? null);
  const [review, setReview] = useState(existingLog?.review ?? '');
  const [watchedDate, setWatchedDate] = useState(
    existingLog?.watched_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<LogStatus>(existingLog?.status ?? 'watched');
  const [hasSpoilers, setHasSpoilers] = useState(existingLog?.has_spoilers ?? false);
  const [lastSeason, setLastSeason] = useState<number | null>(existingLog?.last_watched_season ?? null);
  const [lastEpisode, setLastEpisode] = useState<number | null>(existingLog?.last_watched_episode ?? null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  function openLogForm(initialStatus: LogStatus) {
    setStatus(initialStatus);
    setShowLogForm(true);
  }

  const invalidateLogRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['tv-logs'] });
  };

  const saveLog = useMutation({
    mutationFn: () =>
      existingLog
        ? tvApi.logs.update(existingLog.id, {
            rating: rating ?? undefined,
            review: review || undefined,
            watchedDate,
            status,
            hasSpoilers,
            lastWatchedSeason: status === 'dropped' ? lastSeason ?? undefined : undefined,
            lastWatchedEpisode: status === 'dropped' ? lastEpisode ?? undefined : undefined,
          })
        : tvApi.logs.create({
            tmdbId,
            rating: rating ?? undefined,
            review: review || undefined,
            watchedDate,
            status,
            hasSpoilers,
            lastWatchedSeason: status === 'dropped' ? lastSeason ?? undefined : undefined,
            lastWatchedEpisode: status === 'dropped' ? lastEpisode ?? undefined : undefined,
          }),
    onSuccess: () => {
      invalidateLogRelated();
      setShowLogForm(false);
      setFormError(null);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Kaydedilemedi'),
  });

  const deleteLog = useMutation({
    mutationFn: () => tvApi.logs.remove(existingLog!.id),
    onSuccess: invalidateLogRelated,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (watchlistEntry) {
        await tvApi.watchlist.remove(watchlistEntry.id);
      } else {
        await tvApi.watchlist.add(tmdbId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tv-watchlist'] }),
  });

  if (isLoading || !show) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  const src = posterUrl(show.poster_path, 'w780');
  const trailer = pickBestTrailer(show.videos?.results);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-96 lg:w-[420px] shrink-0">
        {src ? (
          <img src={src} alt={show.name} className="w-full rounded-lg" />
        ) : (
          <div className="w-full aspect-[2/3] bg-surface rounded-lg flex items-center justify-center text-text-muted p-4 text-center">
            {show.name}
          </div>
        )}
      </div>

      <div className="flex-1">
        <h1 className="text-3xl lg:text-4xl font-semibold text-accent">{show.name}</h1>
        <p className="text-text-muted text-sm mt-1">
          {show.first_air_date?.slice(0, 4)}
          {show.number_of_seasons ? ` · ${show.number_of_seasons} sezon` : ''}
          {show.genres?.length ? ` · ${show.genres.map((g) => g.name).join(', ')}` : ''}
        </p>
        <p className="mt-4 text-base text-text/90 leading-relaxed border-l-2 border-accent/40 pl-4">{show.overview}</p>

        {trailer && (
          <div className="mt-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={youtubeEmbedUrl(trailer.key)}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            {trailer.iso_639_1 !== 'tr' && (
              <p className="text-xs text-text-muted mt-1">
                Türkçe altyazı için oynatıcının CC (altyazı) düğmesinden dili değiştirebilirsiniz.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => toggleWatchlist.mutate()}
            disabled={toggleWatchlist.isPending}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              watchlistEntry
                ? 'bg-accent text-white'
                : 'bg-surface border border-border hover:border-accent'
            }`}
          >
            {watchlistEntry ? 'İzleyeceklerimden Çıkar' : 'İzleyeceğim'}
          </button>
          {existingLog ? (
            <button
              onClick={() => setShowLogForm((v) => !v)}
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white transition-colors"
            >
              İzleme Kaydını Düzenle
            </button>
          ) : (
            <>
              <button
                onClick={() => openLogForm('watched')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                İzledim
              </button>
              <button
                onClick={() => openLogForm('dropped')}
                className="px-3 py-2 rounded-md text-xs font-medium text-text-muted border border-border hover:text-text hover:border-text-muted transition-colors"
              >
                Yarım mı bıraktın?
              </button>
            </>
          )}
          {existingLog && (
            <button
              onClick={() => deleteLog.mutate()}
              disabled={deleteLog.isPending}
              className="px-4 py-2 rounded-md text-sm font-medium text-text-muted hover:text-primary"
            >
              Kaydı Sil
            </button>
          )}
          {existingLog && (
            <button
              onClick={() => setShowShareCard(true)}
              className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-border hover:border-highlight"
            >
              Paylaş
            </button>
          )}
        </div>

        {existingLog && !showLogForm && (
          <div className="mt-4 bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  existingLog.status === 'dropped' ? 'bg-border text-text-muted' : 'bg-accent/20 text-accent'
                }`}
              >
                {STATUS_LABEL[existingLog.status]}
              </span>
              {existingLog.status === 'dropped' && existingLog.last_watched_season != null && (
                <span className="text-xs text-text-muted">
                  {existingLog.last_watched_season}. sezon, {existingLog.last_watched_episode}. bölümde kaldı
                </span>
              )}
            </div>
            <StarRating value={existingLog.rating} readOnly />
            {existingLog.review &&
              (existingLog.has_spoilers ? (
                <div className="mt-2">
                  <SpoilerGuard>
                    <ReviewText text={existingLog.review} className="text-sm" />
                  </SpoilerGuard>
                </div>
              ) : (
                <ReviewText text={existingLog.review} className="mt-2 text-sm" />
              ))}
            <p className="mt-2 text-xs text-text-muted">
              İzleme tarihi: {existingLog.watched_date.slice(0, 10)}
            </p>
          </div>
        )}

        {showLogForm && (
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              saveLog.mutate();
            }}
            className="mt-4 bg-surface border border-border rounded-lg p-4 flex flex-col gap-4"
          >
            <div>
              <label className="text-sm text-text-muted block mb-1">Durum</label>
              <div className="flex gap-2">
                {(['watched', 'dropped'] as LogStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      status === s ? 'bg-primary text-white' : 'bg-canvas border border-border text-text-muted'
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            {status === 'dropped' && (
              <div>
                <label className="text-sm text-text-muted block mb-1">Hangi bölümde kaldın?</label>
                <div className="flex gap-2">
                  <select
                    value={lastSeason ?? ''}
                    onChange={(e) => {
                      setLastSeason(e.target.value ? Number(e.target.value) : null);
                      setLastEpisode(null);
                    }}
                    className="bg-canvas border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
                  >
                    <option value="">Sezon</option>
                    {(show.seasons ?? [])
                      .filter((s) => s.season_number > 0)
                      .map((s) => (
                        <option key={s.season_number} value={s.season_number}>
                          {s.season_number}. Sezon
                        </option>
                      ))}
                  </select>
                  <select
                    value={lastEpisode ?? ''}
                    onChange={(e) => setLastEpisode(e.target.value ? Number(e.target.value) : null)}
                    disabled={!lastSeason}
                    className="bg-canvas border border-border rounded-md px-3 py-2 outline-none focus:border-accent disabled:opacity-50"
                  >
                    <option value="">Bölüm</option>
                    {Array.from(
                      { length: show.seasons?.find((s) => s.season_number === lastSeason)?.episode_count ?? 0 },
                      (_, i) => i + 1,
                    ).map((ep) => (
                      <option key={ep} value={ep}>
                        {ep}. Bölüm
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-text-muted block mb-1">Puan</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">İzleme Tarihi</label>
              <input
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                className="bg-canvas border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">
                İnceleme <span className="text-text-muted font-normal">(**kalın**, *italik* desteklenir)</span>
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Dizi hakkında düşünceleriniz..."
                className="w-full bg-canvas border border-border rounded-md px-3 py-2 outline-none focus:border-accent resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={hasSpoilers}
                onChange={(e) => setHasSpoilers(e.target.checked)}
                className="accent-primary"
              />
              Bu inceleme spoiler içeriyor
            </label>
            {formError && <p className="text-sm text-primary">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saveLog.isPending}
                className="bg-primary hover:bg-primary-hover transition-colors rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
              >
                Vazgeç
              </button>
            </div>
          </form>
        )}
      </div>

      {showShareCard && existingLog && (
        <ShareCard
          title={show.name}
          year={show.first_air_date?.slice(0, 4)}
          posterPath={show.poster_path}
          rating={existingLog.rating}
          review={existingLog.review}
          watchedDate={existingLog.watched_date.slice(0, 10)}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
