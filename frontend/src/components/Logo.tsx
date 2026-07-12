import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo-mark group flex items-center gap-2 select-none">
      <span className="relative inline-block w-8 h-7 shrink-0">
        <svg viewBox="0 0 32 30" className="w-full h-full overflow-visible">
          <defs>
            <pattern id="clapStripes" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="3.5" height="7" fill="var(--ts-blue)" />
              <rect x="3.5" width="3.5" height="7" fill="var(--ts-bordo)" />
            </pattern>
            <linearGradient id="iconSheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* the logo's ink, so the sheen only lights the board + arm, never a rectangle */}
            <clipPath id="inkClip">
              <rect x="2" y="12" width="28" height="16" rx="2" />
              <rect x="1" y="4" width="29" height="7.5" rx="1.3" transform="rotate(-22 5 13)" />
            </clipPath>
          </defs>

          {/* board body */}
          <rect x="2" y="12" width="28" height="16" rx="2" fill="#1a2333" stroke="var(--ts-blue)" strokeWidth="1.3" />
          {/* fixed stripe strip on the board, aligns with the arm when "closed" */}
          <rect x="2" y="12" width="28" height="4.5" fill="url(#clapStripes)" />
          <rect x="2" y="12" width="28" height="16" rx="2" fill="none" stroke="var(--ts-blue)" strokeWidth="1.3" />

          {/* clapper arm, hinged at the left */}
          <g className="clapper-arm">
            <rect x="1" y="4" width="29" height="7.5" rx="1.3" fill="url(#clapStripes)" stroke="var(--ts-blue)" strokeWidth="1.3" />
          </g>

          {/* travelling sheen, confined to the ink by the clip */}
          <g clipPath="url(#inkClip)">
            <rect className="icon-shimmer" x="-12" y="0" width="12" height="30" fill="url(#iconSheen)" />
          </g>

          {/* flash at the hinge, timed to the clap */}
          <circle className="clapper-flash" cx="5" cy="12" r="5" fill="#eaf2ff" opacity="0" />
        </svg>
      </span>

      <span className="relative text-lg font-bold tracking-tight">
        {/* one wordmark: bordo→blue base, with a highlight that travels through the glyphs */}
        <span className="logo-wordmark">CineLog</span>

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
