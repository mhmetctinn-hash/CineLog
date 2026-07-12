import { useState } from 'react';

export function SpoilerGuard({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="w-full text-left bg-canvas border border-border rounded-md px-3 py-2 text-sm text-text-muted hover:border-primary transition-colors"
    >
      🔒 Bu inceleme spoiler içeriyor. Görmek için tıklayın.
    </button>
  );
}
