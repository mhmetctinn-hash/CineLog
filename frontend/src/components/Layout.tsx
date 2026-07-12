import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CategoryMenu } from './CategoryMenu';
import { Logo } from './Logo';
import { ProfileMenu } from './ProfileMenu';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-surface'
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-canvas'
  }`;

export function Layout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-16">
          <Logo />
          {user && (
            <>
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass}>
                  Ara
                </NavLink>
                <CategoryMenu />
                <NavLink to="/profile" className={navLinkClass}>
                  İzlediklerim
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

              <div className="flex md:hidden items-center gap-1">
                <ProfileMenu />
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                  className="p-2 rounded-md text-text-muted hover:text-text hover:bg-surface transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    {mobileOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {user && mobileOpen && (
          <nav className="md:hidden border-t border-border px-4 py-2 flex flex-col gap-1">
            <NavLink to="/" end onClick={closeMobile} className={mobileNavLinkClass}>
              Ara
            </NavLink>
            <CategoryMenu onNavigate={closeMobile} />
            <NavLink to="/profile" onClick={closeMobile} className={mobileNavLinkClass}>
              İzlediklerim
            </NavLink>
            <NavLink to="/watchlist" onClick={closeMobile} className={mobileNavLinkClass}>
              İzleme Listesi
            </NavLink>
            <NavLink to="/map" onClick={closeMobile} className={mobileNavLinkClass}>
              Harita
            </NavLink>
            <NavLink to="/stats" onClick={closeMobile} className={mobileNavLinkClass}>
              İstatistik
            </NavLink>
          </nav>
        )}
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
