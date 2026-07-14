import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tmdbApi } from '../../api/tmdb';
import { ApiError } from '../../api/client';
import { posterUrl } from '../../lib/tmdbImage';
import type { Recommendation } from '../../api/types';

const MOODS: { value: string; label: string; emoji: string }[] = [
  { value: 'action', label: 'Aksiyon & Macera', emoji: '💥' },
  { value: 'cozy', label: 'Komedi & Keyifli', emoji: '😄' },
  { value: 'emotional', label: 'Dram & Duygusal', emoji: '🥹' },
  { value: 'thrill', label: 'Gerilim & Gizem', emoji: '🕵️' },
];

const PACES: { value: string; label: string }[] = [
  { value: 'fast', label: 'Hızlı tempolu' },
  { value: 'calm', label: 'Sakin & rahatlatıcı' },
];

function DiceRoll() {
  const navigate = useNavigate();
  const {
    mutate,
    data: result,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: () => tmdbApi.dice(),
  });

  return (
    <section className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center text-center gap-4">
      <h2 className="text-lg font-semibold">🎲 Zar At</h2>
      <p className="text-sm text-text-muted max-w-md">
        Ne izleyeceğine karar veremiyorsan zarı sen at, seçimi biz yapalım — izleme listenden veya sana özel
        önerilerden rastgele bir film seçelim.
      </p>
      <button
        onClick={() => mutate()}
        disabled={isPending}
        className="px-6 py-2.5 rounded-full bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isPending ? 'Zar atılıyor...' : result ? 'Tekrar Zar At' : 'Zarı At'}
      </button>

      {isError && (
        <p className="text-primary text-sm">
          {error instanceof ApiError ? error.message : 'Bir şeyler ters gitti, tekrar dene.'}
        </p>
      )}

      {result && (
        <button
          onClick={() => navigate(`/movie/${result.tmdbId}`)}
          className="mt-2 flex items-center gap-4 bg-canvas border border-border rounded-lg p-3 text-left hover:border-accent transition-colors max-w-sm w-full"
        >
          <div className="w-16 aspect-[2/3] rounded-md overflow-hidden bg-surface shrink-0">
            {posterUrl(result.posterPath, 'w200') ? (
              <img src={posterUrl(result.posterPath, 'w200')!} alt={result.title} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div>
            <p className="font-semibold">{result.title}</p>
            <p className="text-xs text-text-muted mt-1">{result.reason}</p>
          </div>
        </button>
      )}
    </section>
  );
}

function MoodQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [mood, setMood] = useState<string | null>(null);
  const [pace, setPace] = useState<string | null>(null);
  const [results, setResults] = useState<Recommendation[] | null>(null);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (vars: { mood: string; pace: string }) => tmdbApi.mood(vars.mood, vars.pace),
    onSuccess: (data) => {
      setResults(data);
      setStep(2);
    },
  });

  function reset() {
    setStep(0);
    setMood(null);
    setPace(null);
    setResults(null);
  }

  function pickMood(value: string) {
    setMood(value);
    setStep(1);
  }

  function pickPace(value: string) {
    setPace(value);
    if (mood) mutate({ mood, pace: value });
  }

  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-1">🧭 Bugün Ne İzlesem?</h2>
      <p className="text-sm text-text-muted mb-5">İki soruya cevap ver, sana uygun filmleri bulalım.</p>

      {step === 0 && (
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => pickMood(m.value)}
              className="flex flex-col items-center gap-2 py-5 rounded-lg bg-canvas border border-border hover:border-accent transition-colors"
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-muted">Nasıl bir tempo istersin?</p>
          <div className="grid grid-cols-2 gap-3">
            {PACES.map((p) => (
              <button
                key={p.value}
                onClick={() => pickPace(p.value)}
                disabled={isPending}
                className="py-4 rounded-lg bg-canvas border border-border hover:border-accent transition-colors text-sm font-medium disabled:opacity-60"
              >
                {isPending && pace === p.value ? 'Aranıyor...' : p.label}
              </button>
            ))}
          </div>
          <button onClick={reset} className="text-xs text-text-muted hover:text-text self-start mt-1">
            ← Baştan başla
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          {isError && <p className="text-primary text-sm mb-4">Öneri getirilemedi, tekrar dener misin?</p>}
          {results && results.length === 0 && (
            <p className="text-text-muted text-sm mb-4">Bu tercihe uygun yeni bir şey bulamadık, baştan dene.</p>
          )}
          {results && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {results.map((rec) => (
                <button key={rec.tmdbId} onClick={() => navigate(`/movie/${rec.tmdbId}`)} className="text-left group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-canvas border border-border">
                    {posterUrl(rec.posterPath, 'w200') ? (
                      <img
                        src={posterUrl(rec.posterPath, 'w200')!}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-xs p-2 text-center">
                        {rec.title}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-text mt-1 truncate">{rec.title}</p>
                </button>
              ))}
            </div>
          )}
          <button onClick={reset} className="text-xs text-text-muted hover:text-text">
            ← Baştan başla
          </button>
        </div>
      )}
    </section>
  );
}

export function Discover() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <DiceRoll />
      <MoodQuiz />
    </div>
  );
}
