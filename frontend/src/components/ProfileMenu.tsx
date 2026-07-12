import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

const AVATAR_SIZE = 128;

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel yüklenemedi'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas desteklenmiyor'));
          return;
        }
        const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileMenu() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  async function handleLogout() {
    await authApi.logout();
    setUser(null);
    navigate('/login');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const result = await authApi.updateAvatar(dataUrl);
      setUser({ ...user!, avatarUrl: result.avatarUrl });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setError(null);
    try {
      await authApi.removeAvatar();
      setUser({ ...user!, avatarUrl: null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Fotoğraf kaldırılamadı');
    }
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full overflow-hidden border border-border flex items-center justify-center bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        aria-label="Profil menüsü"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="Profil fotoğrafı" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-surface shadow-lg py-1 z-20">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-text truncate">{user.email}</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full text-left px-3 py-2 text-sm text-text hover:bg-base transition-colors disabled:opacity-50"
          >
            {uploading ? 'Yükleniyor...' : 'Fotoğraf Değiştir'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {user.avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="w-full text-left px-3 py-2 text-sm text-text hover:bg-base transition-colors"
            >
              Fotoğrafı Kaldır
            </button>
          )}

          {error && <p className="px-3 py-1 text-xs text-red-500">{error}</p>}

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-text-muted hover:text-primary hover:bg-base transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
