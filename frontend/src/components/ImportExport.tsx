import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logsApi } from '../api/logs';
import { ApiError } from '../api/client';

export function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: number; notFound: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setIsImporting(true);

    try {
      const csv = await file.text();
      const res = await logsApi.importLetterboxd(csv);
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['logs-page'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['logs-stats'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İçe aktarma başarısız oldu');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-highlight">Verilerini Yönet</h2>
      <div className="flex flex-wrap gap-3 items-center">
        <a
          href="/api/logs/export"
          download
          className="px-4 py-2 rounded-md text-sm font-medium bg-canvas border border-border hover:border-accent transition-colors"
        >
          CSV Olarak Dışa Aktar
        </a>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="px-4 py-2 rounded-md text-sm font-medium bg-canvas border border-border hover:border-accent transition-colors disabled:opacity-50"
        >
          {isImporting ? 'İçe aktarılıyor...' : 'Letterboxd CSV İçe Aktar'}
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}

      {result && (
        <div className="text-sm text-text-muted">
          <p>
            {result.imported} film içe aktarıldı, {result.duplicates} tanesi zaten kayıtlıydı.
          </p>
          {result.notFound.length > 0 && (
            <p className="mt-1">
              Bulunamayan {result.notFound.length} film: {result.notFound.slice(0, 10).join(', ')}
              {result.notFound.length > 10 ? '...' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
