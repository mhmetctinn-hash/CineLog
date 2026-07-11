import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Register() {
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
      const user = await authApi.register(email, password);
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kayıt başarısız oldu');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-semibold text-highlight mb-6 text-center">Kayıt Ol</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Şifre (en az 8 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover transition-colors rounded-md py-2 font-medium disabled:opacity-50"
        >
          Kayıt Ol
        </button>
      </form>
      <p className="text-sm text-text-muted mt-4 text-center">
        Zaten hesabın var mı?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
