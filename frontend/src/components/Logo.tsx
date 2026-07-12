import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo-mark group flex items-center gap-2 select-none">
      <span className="relative inline-block w-7 h-8 shrink-0">
        <svg viewBox="0 0 72 84" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="markBordo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8c2a46" />
              <stop offset="1" stopColor="#551b31" />
            </linearGradient>
            <linearGradient id="markBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4c86e0" />
              <stop offset="1" stopColor="#1c4f9c" />
            </linearGradient>
            {/* bookmark silhouette: rounded top, notch at the bottom */}
            <clipPath id="bookmarkClip">
              <path d="M8,14 Q8,2 20,2 L52,2 Q64,2 64,14 L64,80 L36,62 L8,80 Z" />
            </clipPath>
            <linearGradient id="iconSheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g clipPath="url(#bookmarkClip)">
            {/* bordo half, left */}
            <rect x="0" y="0" width="42" height="84" fill="url(#markBordo)" />
            {/* blue half, right, diagonal seam */}
            <polygon points="42,0 72,0 72,84 30,84" fill="url(#markBlue)" />
            {/* play triangle */}
            <polygon points="27,30 27,54 47,42" fill="#ede6d8" />
            {/* travelling sheen */}
            <rect className="icon-shimmer" x="-24" y="0" width="24" height="84" fill="url(#iconSheen)" />
          </g>
        </svg>
      </span>

      <span className="relative text-lg font-bold tracking-tight">
        {/* one wordmark: bordo→blue base, with a highlight that travels through the glyphs */}
        <span className="logo-wordmark">SineVA</span>

        {/* easter-egg: a generic action silhouette dashes across on hover */}
        <span className="absolute left-0 right-0 -bottom-1 h-3 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 24 24" className="logo-runner absolute w-4 h-4" fill="var(--ts-bordo)">
            <circle cx="15.5" cy="3.6" r="2" />
            <path d="M14 6.5 L11 11 L14 12 L12 18.5 L14 19.3 L16.3 14 L19 16.6 L20.1 15.2 L17 11.8 L18 7.2 Z" />
          </svg>
        </span>
      </span>
    </Link>
  );
}
