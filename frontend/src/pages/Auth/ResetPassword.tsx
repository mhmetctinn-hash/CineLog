import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card text-center">
          <h1 className="text-2xl font-semibold auth-heading mb-4">Geçersiz Bağlantı</h1>
          <p className="text-sm text-text-muted">Bu şifre sıfırlama bağlantısı geçersiz.</p>
          <Link to="/forgot-password" className="auth-link text-sm mt-6 inline-block">
            Yeni bağlantı iste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="text-2xl font-semibold auth-heading mb-6 text-center">Yeni Şifre Belirle</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            required
            minLength={8}
            placeholder="Yeni şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Yeni şifre (tekrar)"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
          />
          {error && <p className="text-sm text-primary">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="auth-button">
            Şifreyi Güncelle
          </button>
        </form>
      </div>
    </div>
  );
}
