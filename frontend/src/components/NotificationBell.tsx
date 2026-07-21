import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { disablePush, enablePush, getPushSubscriptionState, isPushSupported } from '../lib/push';
import type { AppNotification } from '../api/types';

const TYPE_ICON: Record<AppNotification['type'], string> = {
  system: '⚙️',
  watchlist_reminder: '🎞️',
  daily_recommendation: '🎬',
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState<'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'>(
    'loading',
  );
  const [pushError, setPushError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  useEffect(() => {
    if (isPushSupported()) {
      getPushSubscriptionState().then(setPushState);
    } else {
      setPushState('unsupported');
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleTogglePush() {
    setPushError(null);
    try {
      if (pushState === 'subscribed') {
        await disablePush();
        setPushState('unsubscribed');
      } else {
        await enablePush();
        setPushState('subscribed');
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Bir şeyler ters gitti');
    }
  }

  function handleNotificationClick(n: AppNotification) {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
    if (n.url) navigate(n.url);
  }

  const count = unread?.count ?? 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Bildirimler"
        className="relative p-2 rounded-md text-text-muted hover:text-text hover:bg-surface transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-md border border-border bg-surface shadow-lg z-20">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-text">Bildirimler</p>
            {count > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs auth-link"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {pushState !== 'unsupported' && (
            <div className="px-3 py-2 border-b border-border">
              <button
                onClick={handleTogglePush}
                disabled={pushState === 'denied' || pushState === 'loading'}
                className="text-xs text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pushState === 'subscribed' && '🔔 Tarayıcı bildirimleri açık — kapat'}
                {pushState === 'unsubscribed' && '🔕 Tarayıcı bildirimlerini aç'}
                {pushState === 'denied' && '🔕 Bildirim izni engellendi'}
                {pushState === 'loading' && 'Kontrol ediliyor...'}
              </button>
              {pushError && <p className="text-xs text-primary mt-1">{pushError}</p>}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {!notifications && <p className="text-sm text-text-muted text-center py-6">Yükleniyor...</p>}
            {notifications && notifications.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">Henüz bildirimin yok.</p>
            )}
            {notifications?.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-canvas transition-colors flex gap-2 ${
                  !n.read_at ? 'bg-canvas/60' : ''
                }`}
              >
                <span className="text-base leading-none mt-0.5">{TYPE_ICON[n.type]}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-text font-medium truncate">{n.title}</span>
                  {n.body && <span className="block text-xs text-text-muted truncate">{n.body}</span>}
                  <span className="block text-[10px] text-text-muted mt-0.5">{timeAgo(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
