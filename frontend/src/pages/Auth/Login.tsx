import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await authApi.login(email, password);
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Giriş başarısız oldu');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="text-2xl font-semibold auth-heading mb-6 text-center">Giriş Yap</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          <input
            type="password"
            required
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          {error && <p className="text-sm text-primary">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="auth-button">
            Giriş Yap
          </button>
        </form>
        <p className="text-sm text-text-muted mt-4 text-center">
          <Link to="/forgot-password" className="auth-link">
            Şifremi unuttum
          </Link>
        </p>
        <p className="text-sm text-text-muted mt-2 text-center">
          Hesabın yok mu?{' '}
          <Link to="/register" className="auth-link">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
