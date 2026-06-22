interface PausaLogoProps {
  size?: number;
  className?: string;
}

export function PausaLogo({ size = 36, className = "" }: PausaLogoProps) {
  const id = "pl" + size;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#0d1f3c" />
        </linearGradient>
        <linearGradient id={`${id}bar1`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#00E5D4" />
          <stop offset="100%" stopColor="#00c4b4" />
        </linearGradient>
        <linearGradient id={`${id}bar2`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#40e0ff" />
          <stop offset="100%" stopColor="#00a8cc" />
        </linearGradient>
        <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill={`url(#${id}bg)`} />

      {/* Subtle grid lines */}
      <line x1="8" y1="28" x2="32" y2="28" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <line x1="8" y1="22" x2="32" y2="22" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      <line x1="8" y1="16" x2="32" y2="16" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

      {/* Left bar (shorter — pause left) */}
      <rect x="9" y="20" width="8" height="12" rx="2.5" fill={`url(#${id}bar1)`} />

      {/* Right bar (taller — pause right + growth) */}
      <rect x="23" y="12" width="8" height="20" rx="2.5" fill={`url(#${id}bar2)`} />

      {/* Teal glow dot at top of right bar */}
      <circle cx="27" cy="11" r="2.5" fill="#00E5D4" filter={`url(#${id}glow)`} opacity="0.9" />

      {/* Tiny upward arrow accent */}
      <path d="M27 8 L24.5 11.5 M27 8 L29.5 11.5" stroke="#00E5D4" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
