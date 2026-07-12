import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CategoryMenu } from './CategoryMenu';
import { Logo } from './Logo';
import { ProfileMenu } from './ProfileMenu';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-surface'
  }`;

export function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-base text-text flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Logo />
          {user && (
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Ara
              </NavLink>
              <CategoryMenu />
              <NavLink to="/profile" className={navLinkClass}>
                Loglarım
              </NavLink>
              <NavLink to="/watchlist" className={navLinkClass}>
                İzleme Listesi
              </NavLink>
              <NavLink to="/map" className={navLinkClass}>
                Harita
              </NavLink>
              <NavLink to="/stats" className={navLinkClass}>
                İstatistik
              </NavLink>
              <ProfileMenu />
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
