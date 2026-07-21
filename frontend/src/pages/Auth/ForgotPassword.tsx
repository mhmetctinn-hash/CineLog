import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto mt-12 text-center">
        <h1 className="text-2xl font-semibold text-highlight mb-4">E-postanı kontrol et</h1>
        <p className="text-sm text-text-muted">
          E-posta adresine kayıtlı bir hesap varsa, şifreni sıfırlamak için bir bağlantı gönderdik.
        </p>
        <Link to="/login" className="text-accent hover:underline text-sm mt-6 inline-block">
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-semibold text-highlight mb-6 text-center">Şifremi Unuttum</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover transition-colors rounded-md py-2 font-medium disabled:opacity-50"
        >
          Sıfırlama Bağlantısı Gönder
        </button>
      </form>
      <p className="text-sm text-text-muted mt-4 text-center">
        <Link to="/login" className="text-accent hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </div>
  );
}
