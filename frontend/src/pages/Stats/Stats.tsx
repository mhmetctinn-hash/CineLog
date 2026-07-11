import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logsApi } from '../../api/logs';
import { GENRE_NAMES } from '../../lib/genres';
import { posterUrl } from '../../lib/tmdbImage';

const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function formatMonth(month: string) {
  const [, m] = month.split('-');
  return MONTH_LABELS[Number(m) - 1] ?? month;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[140px]">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-highlight">{value}</p>
    </div>
  );
}

export function Stats() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['logs-stats'],
    queryFn: () => logsApi.stats(),
  });

  if (isLoading) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  if (!data || data.totalLogs === 0) {
    return <p className="text-text-muted text-center mt-12">İstatistik göstermek için henüz film loglamadınız.</p>;
  }

  const topGenres = data.genreCounts.slice(0, 8);
  const maxGenreCount = topGenres[0]?.count ?? 1;
  const maxMonthlyCount = Math.max(...data.monthlyCounts.map((m) => m.count), 1);
  const favoriteGenreName = topGenres[0] ? GENRE_NAMES[topGenres[0].genreId] ?? 'Bilinmiyor' : '—';
  const busiestMonth = [...data.monthlyCounts].sort((a, b) => b.count - a.count)[0];

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-4">İstatistik Paneli</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatTile label="Toplam Film" value={String(data.totalLogs)} />
        <StatTile label="Ortalama Puanım" value={data.averageRating != null ? (data.averageRating / 2).toFixed(1) : '—'} />
        <StatTile label="Favori Tür" value={favoriteGenreName} />
        <StatTile label="En Yoğun Ay" value={busiestMonth ? `${formatMonth(busiestMonth.month)} (${busiestMonth.count})` : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-surface border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Tür Dağılımı</h2>
          <div className="flex flex-col gap-2">
            {topGenres.map((g) => (
              <div key={g.genreId} className="flex items-center gap-2" title={`${GENRE_NAMES[g.genreId] ?? g.genreId}: ${g.count} film`}>
                <span className="text-xs text-text-muted w-20 shrink-0 truncate">{GENRE_NAMES[g.genreId] ?? g.genreId}</span>
                <div className="flex-1 h-3 bg-base rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(g.count / maxGenreCount) * 100}%`, backgroundColor: '#fcd116' }}
                  />
                </div>
                <span className="text-xs text-text-muted w-6 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Aylık İzleme Aktivitesi</h2>
          <div className="flex items-end gap-1.5 h-40">
            {data.monthlyCounts.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full" title={`${m.month}: ${m.count} film`}>
                <div
                  className="w-full rounded-t"
                  style={{ height: `${(m.count / maxMonthlyCount) * 100}%`, minHeight: 2, backgroundColor: '#007bff' }}
                />
                <span className="text-[10px] text-text-muted mt-1">{formatMonth(m.month)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-text mb-3">En Yüksek Puan Verdiklerin</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {data.topRated.map((m) => (
            <button
              key={m.tmdbId}
              onClick={() => navigate(`/movie/${m.tmdbId}`)}
              className="text-left group"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-base border border-border">
                {posterUrl(m.posterPath, 'w200') ? (
                  <img src={posterUrl(m.posterPath, 'w200')!} alt={m.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">Görsel yok</div>
                )}
              </div>
              <p className="text-xs text-text mt-1 truncate">{m.title}</p>
              <p className="text-xs text-highlight">{m.rating != null ? (m.rating / 2).toFixed(1) : '—'}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
