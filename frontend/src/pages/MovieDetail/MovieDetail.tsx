import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tmdbApi } from '../../api/tmdb';
import { logsApi } from '../../api/logs';
import { watchlistApi } from '../../api/watchlist';
import { posterUrl } from '../../lib/tmdbImage';
import { StarRating } from '../../components/StarRating';
import { ApiError } from '../../api/client';

export function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const tmdbId = Number(id);
  const queryClient = useQueryClient();

  const { data: movie, isLoading } = useQuery({
    queryKey: ['tmdb', 'movie', tmdbId],
    queryFn: () => tmdbApi.movie(tmdbId),
    enabled: Number.isFinite(tmdbId),
  });

  const { data: logs } = useQuery({
    queryKey: ['logs', tmdbId],
    queryFn: () => logsApi.list(tmdbId),
    enabled: Number.isFinite(tmdbId),
  });

  const { data: watchlist } = useQuery({
    queryKey: ['watchlist', tmdbId],
    queryFn: () => watchlistApi.list(tmdbId),
    enabled: Number.isFinite(tmdbId),
  });

  const existingLog = logs?.[0] ?? null;
  const watchlistEntry = watchlist?.[0] ?? null;

  const [rating, setRating] = useState<number | null>(existingLog?.rating ?? null);
  const [review, setReview] = useState(existingLog?.review ?? '');
  const [watchedDate, setWatchedDate] = useState(
    existingLog?.watched_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);

  const invalidateLogRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['logs'] });
  };

  const saveLog = useMutation({
    mutationFn: () =>
      existingLog
        ? logsApi.update(existingLog.id, {
            rating: rating ?? undefined,
            review: review || undefined,
            watchedDate,
          })
        : logsApi.create({
            tmdbId,
            rating: rating ?? undefined,
            review: review || undefined,
            watchedDate,
          }),
    onSuccess: () => {
      invalidateLogRelated();
      setShowLogForm(false);
      setFormError(null);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Kaydedilemedi'),
  });

  const deleteLog = useMutation({
    mutationFn: () => logsApi.remove(existingLog!.id),
    onSuccess: invalidateLogRelated,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (watchlistEntry) {
        await watchlistApi.remove(watchlistEntry.id);
      } else {
        await watchlistApi.add(tmdbId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  if (isLoading || !movie) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  const src = posterUrl(movie.poster_path, 'w500');

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 shrink-0">
        {src ? (
          <img src={src} alt={movie.title} className="w-full rounded-lg" />
        ) : (
          <div className="w-full aspect-[2/3] bg-surface rounded-lg flex items-center justify-center text-text-muted p-4 text-center">
            {movie.title}
          </div>
        )}
      </div>

      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-highlight">{movie.title}</h1>
        <p className="text-text-muted text-sm mt-1">
          {movie.release_date?.slice(0, 4)}
          {movie.runtime ? ` · ${movie.runtime} dk` : ''}
          {movie.genres?.length ? ` · ${movie.genres.map((g) => g.name).join(', ')}` : ''}
        </p>
        <p className="mt-4 text-sm leading-relaxed">{movie.overview}</p>

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
          <button
            onClick={() => setShowLogForm((v) => !v)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              existingLog ? 'bg-primary text-white' : 'bg-surface border border-border hover:border-primary'
            }`}
          >
            {existingLog ? 'İzleme Kaydını Düzenle' : 'İzledim'}
          </button>
          {existingLog && (
            <button
              onClick={() => deleteLog.mutate()}
              disabled={deleteLog.isPending}
              className="px-4 py-2 rounded-md text-sm font-medium text-text-muted hover:text-primary"
            >
              Kaydı Sil
            </button>
          )}
        </div>

        {existingLog && !showLogForm && (
          <div className="mt-4 bg-surface border border-border rounded-lg p-4">
            <StarRating value={existingLog.rating} readOnly />
            {existingLog.review && <p className="mt-2 text-sm">{existingLog.review}</p>}
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
              <label className="text-sm text-text-muted block mb-1">Puan</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">İzleme Tarihi</label>
              <input
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                className="bg-base border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">İnceleme</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Film hakkında düşünceleriniz..."
                className="w-full bg-base border border-border rounded-md px-3 py-2 outline-none focus:border-accent resize-none"
              />
            </div>
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
    </div>
  );
}
