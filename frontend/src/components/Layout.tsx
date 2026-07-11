import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-surface'
  }`;

export function Layout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await authApi.logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-base text-text flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <NavLink to="/" className="text-lg font-semibold text-highlight">
            CineLog
          </NavLink>
          {user && (
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Ara
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Loglarım
              </NavLink>
              <NavLink to="/watchlist" className={navLinkClass}>
                İzleme Listesi
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-text-muted hover:text-primary hover:bg-surface transition-colors"
              >
                Çıkış
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
