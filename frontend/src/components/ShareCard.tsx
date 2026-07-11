import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { posterUrl } from '../lib/tmdbImage';

interface ShareCardProps {
  title: string;
  year: string | undefined;
  posterPath: string | null;
  rating: number | null;
  review: string | null;
  watchedDate: string;
  onClose: () => void;
}

const MAX_REVIEW_CHARS = 220;

export function ShareCard({ title, year, posterPath, rating, review, watchedDate, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const stars = rating != null ? rating / 2 : null;
  const src = posterUrl(posterPath, 'w500');
  const trimmedReview = review && review.length > MAX_REVIEW_CHARS ? `${review.slice(0, MAX_REVIEW_CHARS)}…` : review;

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#121824',
        scale: 3,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-cinelog.png`;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div
          ref={cardRef}
          className="w-[360px] flex flex-col overflow-hidden rounded-2xl"
          style={{ backgroundColor: '#121824', fontFamily: 'sans-serif' }}
        >
          <div className="relative w-full aspect-[2/3]">
            {src ? (
              <img src={src} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60" style={{ backgroundColor: '#1a2333' }}>
                {title}
              </div>
            )}
            <div
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{ background: 'linear-gradient(to top, #121824 20%, transparent)' }}
            />
          </div>

          <div className="px-5 pb-6 -mt-16 relative flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white leading-tight">
              {title} {year && <span className="text-white/50 font-normal">({year})</span>}
            </h2>

            {stars != null && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const fill = Math.min(Math.max(stars - (i - 1), 0), 1);
                  return (
                    <div key={i} className="relative w-5 h-5">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: '#334155' }} fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                        <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: '#fcd116' }} fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
                <span className="ml-1 text-sm font-semibold" style={{ color: '#fcd116' }}>
                  {stars.toFixed(1)}
                </span>
              </div>
            )}

            {trimmedReview && <p className="text-sm text-white/85 leading-relaxed">"{trimmedReview}"</p>}

            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #2e3648' }}>
              <span className="text-xs text-white/50">{watchedDate}</span>
              <span className="text-sm font-bold" style={{ color: '#d61c2c' }}>
                Cine<span style={{ color: '#fcd116' }}>Log</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-primary hover:bg-primary-hover transition-colors rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {downloading ? 'Hazırlanıyor...' : 'PNG Olarak İndir'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
