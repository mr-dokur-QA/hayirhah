import React from 'react';

interface CrescentStarLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const CrescentStarLogo: React.FC<CrescentStarLogoProps> = ({
  className = 'w-10 h-10',
  size,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 group ${className ? '' : ''}`}>
      <div
        className={`relative rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-850 to-teal-900 p-1.5 flex items-center justify-center text-white shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30 hover:ring-amber-400/40 transition-all duration-300 group-hover:scale-105 shrink-0 overflow-hidden ${className}`}
        style={size ? { width: size, height: size } : undefined}
        aria-label="Hayırhah Hilal ve Yıldız Sembolü"
      >
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute inset-0 bg-radial from-amber-400/15 via-transparent to-transparent opacity-75 pointer-events-none" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-sm"
        >
          <defs>
            {/* Rich Imperial Gold Gradient */}
            <linearGradient id="crescent-gold-rich" x1="20" y1="18" x2="82" y2="84" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FDE047" />
              <stop offset="65%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Inner Edge Highlight */}
            <linearGradient id="crescent-specular" x1="30" y1="20" x2="60" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FDE047" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
            </linearGradient>

            {/* Star Radiant Gradient */}
            <radialGradient id="star-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>

            {/* Soft Glow Filter */}
            <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Subtle Star Flare Glow */}
            <filter id="star-flare" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Sacred Geometric 8-Point Star Rosette (Subtle Watermark) */}
          <g opacity="0.12" stroke="#FEF08A" strokeWidth="0.75">
            <rect x="25" y="25" width="50" height="50" rx="4" fill="none" transform="rotate(0 50 50)" />
            <rect x="25" y="25" width="50" height="50" rx="4" fill="none" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="34" fill="none" strokeWidth="0.5" strokeDasharray="1.5 2" />
          </g>

          {/* Crescent Moon (Hilal) - Precise Golden Arc Construction */}
          <path
            d="M48 15C30.33 15 16 29.33 16 47C16 64.67 30.33 79 48 79C61.42 79 72.88 70.73 77.62 59C62.1 61.2 46.5 49.5 46.5 33.2C46.5 25.1 50.4 17.8 56.7 15.6C53.9 15.2 51 15 48 15Z"
            fill="url(#crescent-gold-rich)"
            filter="url(#subtle-glow)"
          />

          {/* Inner Light Reflection Contour */}
          <path
            d="M47 18C31.5 18 19 30.5 19 46C19 61.5 31.5 74 47 74C56.8 74 65.4 68.9 70.2 61C57 60 45 49.5 45 34C45 27 48.2 20.8 53.2 18.5C51.2 18.2 49.1 18 47 18Z"
            fill="none"
            stroke="url(#crescent-specular)"
            strokeWidth="0.8"
            opacity="0.6"
          />

          {/* Radiant Central Morning Star (8-Point Brilliant Islamic Geometry) */}
          <g transform="translate(68, 38)" filter="url(#star-flare)">
            {/* Primary Diamond Cross Rays */}
            <path
              d="M0 -15 L3.2 -4.2 L14 -3.2 L5.5 4.5 L7.8 15 L0 9.5 L-7.8 15 L-5.5 4.5 L-14 -3.2 L-3.2 -4.2 Z"
              fill="url(#star-radial)"
            />
            {/* Secondary Diagonal Diamond Rays */}
            <path
              d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
            {/* Radiant Bright Core Specular */}
            <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="0.9" fill="#FEF08A" />
          </g>

          {/* Elegant Micro Light Sparkles around the Crescent */}
          <circle cx="28" cy="28" r="1" fill="#FEF08A" opacity="0.6" />
          <circle cx="23" cy="58" r="0.8" fill="#FDE047" opacity="0.5" />
          <circle cx="58" cy="74" r="1.1" fill="#FEF08A" opacity="0.7" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-emerald-950 dark:text-emerald-200 leading-tight">
            Hayırhah
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium tracking-wide uppercase">
            İbadet & Dua
          </span>
        </div>
      )}
    </div>
  );
};
