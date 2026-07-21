import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../api/client';

export function Admin() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  const { data: users, isLoading: usersLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.users,
  });

  const removeUser = useMutation({
    mutationFn: (id: string) => adminApi.removeUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  function handleDelete(id: string, email: string) {
    if (window.confirm(`${email} hesabını ve tüm verilerini kalıcı olarak silmek istediğine emin misin?`)) {
      removeUser.mutate(id);
    }
  }

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold auth-heading mb-6">Yönetim Paneli</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Kullanıcı" value={stats?.totalUsers} loading={statsLoading} />
        <StatCard label="Film Logu" value={stats?.totalMovieLogs} loading={statsLoading} />
        <StatCard label="Dizi Logu" value={stats?.totalTvLogs} loading={statsLoading} />
        <StatCard label="İzleme Listesi" value={stats?.totalWatchlistItems} loading={statsLoading} />
        <StatCard label="Son 30 Gün Kayıt" value={stats?.signupsLast30Days} loading={statsLoading} />
      </div>

      <h2 className="text-lg font-semibold text-highlight mb-4">Kullanıcılar</h2>

      {usersLoading && <p className="text-text-muted">Yükleniyor...</p>}
      {error && <p className="text-primary">{error instanceof ApiError ? error.message : 'Bir şeyler ters gitti'}</p>}

      {users && (
        <div className="bg-surface border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="px-4 py-3 font-medium">E-posta</th>
                <th className="px-4 py-3 font-medium">Kayıt Tarihi</th>
                <th className="px-4 py-3 font-medium">Film</th>
                <th className="px-4 py-3 font-medium">Dizi</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 text-text-muted">{u.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">{u.movie_log_count}</td>
                  <td className="px-4 py-3">{u.tv_log_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={removeUser.isPending}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      Hesabı Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-highlight">{loading ? '—' : (value ?? 0)}</p>
    </div>
  );
}
