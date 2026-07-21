import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">Yükleniyor...</div>;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
