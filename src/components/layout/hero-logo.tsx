'use client'

/**
 * Hero Logo Component
 * 
 * Displays the neutral-toned (charcoal/gray) version of the حبيب الحبايب logo.
 * This is a dedicated Hero version; the header logo remains unchanged.
 * 
 * Arabic text: dark charcoal (#2a2a2a)
 * "MARKET" text: slightly lighter gray (#4a4a4a)
 * Aspect ratio and proportions preserved exactly from the official SVG.
 */

export default function HeroLogo() {
  return (
    <svg
      viewBox="0 0 400 150"
      className="w-64 h-24 drop-shadow-lg"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main Logo Group */}
      <g>
        {/* Decorative dots (neutral gray) */}
        <circle cx="40" cy="30" r="3" fill="#4a4a4a" />
        <circle cx="360" cy="30" r="3" fill="#4a4a4a" />
        <circle cx="40" cy="120" r="3" fill="#4a4a4a" />
        <circle cx="360" cy="120" r="3" fill="#4a4a4a" />

        {/* Arabic Text: حبيب الحبايب (dark charcoal) */}
        <text
          x="200"
          y="65"
          textAnchor="middle"
          fontSize="48"
          fontWeight="700"
          fill="#2a2a2a"
          fontFamily="Arial, sans-serif"
          direction="rtl"
        >
          حبيب الحبايب
        </text>

        {/* English "MARKET" text (lighter gray) */}
        <text
          x="200"
          y="105"
          textAnchor="middle"
          fontSize="20"
          fontWeight="600"
          fill="#4a4a4a"
          fontFamily="Arial, sans-serif"
          letterSpacing="2"
        >
          MARKET
        </text>

        {/* Subtle underline (very light gray) */}
        <line x1="80" y1="118" x2="320" y2="118" stroke="#6a6a6a" strokeWidth="1" opacity="0.5" />
      </g>
    </svg>
  )
}
