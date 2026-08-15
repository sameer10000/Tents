import { useId, useMemo } from 'react'

/** Deterministic star field — no Math.random, so it never re-scatters. */
const STARS = Array.from({ length: 64 }, (_, i) => {
  const x = ((i * 137.508) % 100) * 16
  const y = ((i * 61.803) % 42) * 9
  const r = 0.6 + ((i * 7) % 5) * 0.22
  const o = 0.18 + ((i * 13) % 7) * 0.09
  return { x, y, r, o }
})

/**
 * The hero backdrop: a night camp rendered as layered silhouettes with a warm
 * tent glow. Drawn rather than photographed, so it costs nothing to load and
 * never fails to arrive.
 */
export function HeroScene({ className = '' }: { className?: string }) {
  const raw = useId()
  const uid = useMemo(() => raw.replace(/[:«»]/g, ''), [raw])

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080b0e" />
          <stop offset="42%" stopColor="#121a1d" />
          <stop offset="72%" stopColor="#26302b" />
          <stop offset="100%" stopColor="#3a3a29" />
        </linearGradient>

        <radialGradient id={`moon-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2EEE6" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#E3CD9B" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#E3CD9B" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0C97A" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#C6A667" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#C6A667" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`far-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2429" />
          <stop offset="100%" stopColor="#141b1f" />
        </linearGradient>

        <linearGradient id={`mid-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141a17" />
          <stop offset="100%" stopColor="#0e1311" />
        </linearGradient>

        <linearGradient id={`near-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0d0b" />
          <stop offset="100%" stopColor="#070908" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill={`url(#sky-${uid})`} />

      {STARS.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="#F2EEE6"
          opacity={star.o}
        />
      ))}

      <circle cx="1210" cy="182" r="190" fill={`url(#moon-${uid})`} />
      <circle cx="1210" cy="182" r="42" fill="#F2EEE6" opacity="0.82" />

      {/* Far range */}
      <path
        d="M0 520 L170 424 L318 492 L520 352 L706 470 L884 396 L1062 500 L1244 416 L1424 496 L1600 436 L1600 900 L0 900 Z"
        fill={`url(#far-${uid})`}
      />
      {/* Snow lines catching the moon */}
      <path
        d="M520 352 L560 392 L586 372 L620 410 M1244 416 L1276 448 L1298 432 L1326 462"
        stroke="#F2EEE6"
        strokeOpacity="0.14"
        strokeWidth="2"
        fill="none"
      />

      {/* Mid range */}
      <path
        d="M0 626 L224 542 L426 614 L642 500 L862 592 L1084 520 L1302 612 L1600 542 L1600 900 L0 900 Z"
        fill={`url(#mid-${uid})`}
      />

      {/* Treeline */}
      <g fill="#0b100d" opacity="0.9">
        {Array.from({ length: 26 }, (_, i) => {
          const x = 40 + i * 62
          const h = 46 + ((i * 29) % 34)
          const base = 664 + ((i * 17) % 12)
          return (
            <path
              key={i}
              d={`M${x} ${base} L${x + 13} ${base - h} L${x + 26} ${base} Z`}
            />
          )
        })}
      </g>

      {/* Near ground */}
      <path
        d="M0 744 C 300 704 600 766 900 734 C 1152 708 1400 748 1600 722 L1600 900 L0 900 Z"
        fill={`url(#near-${uid})`}
      />

      {/* Camp — a lit bell tent, the one thing with warmth in the frame */}
      <ellipse cx="1156" cy="742" rx="220" ry="120" fill={`url(#glow-${uid})`} />
      <g transform="translate(1060 612)">
        <path d="M96 0 L14 130 L178 130 Z" fill="#0d100d" />
        <path d="M82 130 L96 58 L110 130 Z" fill="#F0C97A" opacity="0.72" />
        <path d="M96 0 L96 -12" stroke="#0d100d" strokeWidth="3" />
        <path
          d="M96 0 L14 130 M96 0 L178 130"
          stroke="#C6A667"
          strokeOpacity="0.3"
          strokeWidth="1.5"
          fill="none"
        />
      </g>

      {/* A second, unlit tent for depth */}
      <g transform="translate(392 648) scale(0.62)" opacity="0.7">
        <path d="M96 0 L14 130 L178 130 Z" fill="#0a0d0b" />
        <path d="M96 0 L96 -12" stroke="#0a0d0b" strokeWidth="3" />
      </g>
    </svg>
  )
}
