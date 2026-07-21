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
      <div className="max-w-sm mx-auto mt-12 text-center">
        <h1 className="text-2xl font-semibold text-highlight mb-4">Geçersiz Bağlantı</h1>
        <p className="text-sm text-text-muted">Bu şifre sıfırlama bağlantısı geçersiz.</p>
        <Link to="/forgot-password" className="text-accent hover:underline text-sm mt-6 inline-block">
          Yeni bağlantı iste
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-semibold text-highlight mb-6 text-center">Yeni Şifre Belirle</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          required
          minLength={8}
          placeholder="Yeni şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Yeni şifre (tekrar)"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover transition-colors rounded-md py-2 font-medium disabled:opacity-50"
        >
          Şifreyi Güncelle
        </button>
      </form>
    </div>
  );
}
