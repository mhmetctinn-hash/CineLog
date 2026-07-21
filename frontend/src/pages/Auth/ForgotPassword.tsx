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
      <div className="auth-page">
        <div className="auth-card text-center">
          <h1 className="text-2xl font-semibold auth-heading mb-4">E-postanı kontrol et</h1>
          <p className="text-sm text-text-muted">
            E-posta adresine kayıtlı bir hesap varsa, şifreni sıfırlamak için bir bağlantı gönderdik.
          </p>
          <Link to="/login" className="auth-link text-sm mt-6 inline-block">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="text-2xl font-semibold auth-heading mb-6 text-center">Şifremi Unuttum</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          {error && <p className="text-sm text-primary">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="auth-button">
            Sıfırlama Bağlantısı Gönder
          </button>
        </form>
        <p className="text-sm text-text-muted mt-4 text-center">
          <Link to="/login" className="auth-link">
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
