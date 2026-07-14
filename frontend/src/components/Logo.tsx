import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo-mark group flex items-center gap-2 select-none">
      <span className="relative inline-block w-8 h-8 shrink-0 rounded-[9px] bg-[#151827] flex items-center justify-center">
        <svg viewBox="0 0 56 56" className="w-[70%] h-[70%] overflow-visible">
          <defs>
            <linearGradient id="markGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e0a23c" />
              <stop offset="1" stopColor="#4a1942" />
            </linearGradient>
            <linearGradient id="iconSheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="svClip">
              <path d="M12,16 L24,40 L36,16 L36,16 L36,20 L24,44 L12,20 Z" />
              <path d="M28,20 L38,36 L48,20 L48,20 L48,24 L38,40 L28,24 Z" />
            </clipPath>
          </defs>

          {/* S */}
          <path d="M12,16 L24,40 L36,16" fill="none" stroke="url(#markGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {/* V */}
          <path d="M28,20 L38,36 L48,20" fill="none" stroke="#6b2456" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

          {/* travelling sheen, confined to the S+V strokes */}
          <g clipPath="url(#svClip)">
            <rect className="icon-shimmer" x="-24" y="0" width="24" height="56" fill="url(#iconSheen)" />
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
