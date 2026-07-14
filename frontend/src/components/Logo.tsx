import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo-mark group flex items-center gap-2 select-none">
      <span className="relative inline-block w-12 h-12 shrink-0 rounded-[12px] bg-[#151827] flex items-center justify-center">
        <svg viewBox="0 0 56 56" className="w-[92%] h-[92%] overflow-visible">
          <defs>
            <linearGradient id="markGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e0a23c" />
              <stop offset="1" stopColor="#4a1942" />
            </linearGradient>
            <linearGradient id="vGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8c3d6e" />
              <stop offset="1" stopColor="#4a1942" />
            </linearGradient>
            {/* highlight band baked into the same gradient the strokes are painted with,
                so it always lands exactly on the letterforms — no clip-path drift */}
            <linearGradient id="sheenGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-1 0; 1 0; 1 0"
                keyTimes="0; 0.55; 1"
                dur="4.5s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>

          {/* S */}
          <path d="M10,15 L24,41 L38,15" fill="none" stroke="url(#markGrad)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* V */}
          <path d="M26,20 L39,38 L52,20" fill="none" stroke="url(#vGrad)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* sheen overlay, same paths, painted with the sliding highlight gradient */}
          <path d="M10,15 L24,41 L38,15" fill="none" stroke="url(#sheenGrad)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26,20 L39,38 L52,20" fill="none" stroke="url(#sheenGrad)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
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
