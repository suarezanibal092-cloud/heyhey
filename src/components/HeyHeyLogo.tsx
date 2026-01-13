export function HeyHeyLogo({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 200 120"
      className={className}
    >
      {/* Background bubble */}
      <defs>
        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d292d4" />
          <stop offset="50%" stopColor="#ba5cc6" />
          <stop offset="100%" stopColor="#9b4dca" />
        </linearGradient>
      </defs>

      {/* Chat bubble shape */}
      <path
        d="M30 20 Q30 10, 50 10 L150 10 Q170 10, 170 30 L170 70 Q170 90, 150 90 L70 90 L50 110 L55 90 L50 90 Q30 90, 30 70 Z"
        fill="url(#purpleGradient)"
        rx="20"
      />

      {/* hey text - first line */}
      <text
        x="100"
        y="45"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="white"
      >
        hey
      </text>

      {/* hey text - second line */}
      <text
        x="100"
        y="75"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="white"
      >
        hey
      </text>

      {/* Chat bubble indicator (small circle) */}
      <circle cx="155" cy="75" r="5" fill="white" />
    </svg>
  );
}
