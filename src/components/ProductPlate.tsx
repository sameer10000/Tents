import { useId, useMemo } from 'react'
import type { PlateId } from '../data/types'
import { PLATE_ART, plateTone } from '../lib/plate'

interface ProductPlateProps {
  plate: PlateId
  /** Usually the SKU. Decides the ground colour and light direction. */
  seed: string
  /** Overlaid at the foot of the plate, in micro-caps. */
  caption?: string
  className?: string
}

/**
 * A generated editorial plate: duotone ground, raking light, floor shadow,
 * schematic line art and film grain.
 *
 * Deterministic — the same SKU always produces the same plate, so a grid looks
 * identical on every visit and across sessions.
 */
export function ProductPlate({
  plate,
  seed,
  caption,
  className = '',
}: ProductPlateProps) {
  const raw = useId()
  const uid = useMemo(() => raw.replace(/[:«»]/g, ''), [raw])
  const tone = useMemo(() => plateTone(seed), [seed])

  // A plate id can arrive from the admin portal, so an unknown one falls back
  // rather than destructuring undefined.
  const art = PLATE_ART[plate] ?? PLATE_ART.project

  const [accent, ...quiet] = art

  return (
    <div className={`grain absolute inset-0 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`g-${uid}`}
            gradientTransform={`rotate(${tone.angle} 0.5 0.5)`}
          >
            <stop offset="0%" stopColor={tone.to} />
            <stop offset="58%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.from} />
          </linearGradient>

          <radialGradient id={`l-${uid}`} cx={`${tone.focus * 100}%`} cy="26%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`v-${uid}`} cx="50%" cy="46%" r="76%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>

          <radialGradient id={`s-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="240" height="180" fill={`url(#g-${uid})`} />
        <rect width="240" height="180" fill={`url(#l-${uid})`} />

        {/* Horizon — implies a studio sweep rather than a flat field. */}
        <path
          d="M0 150 L240 150"
          stroke="#ffffff"
          strokeOpacity="0.06"
          strokeWidth="0.75"
        />

        {/* Contact shadow beneath the subject. */}
        <ellipse cx="120" cy="155" rx="82" ry="9" fill={`url(#s-${uid})`} />

        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          {quiet.map((d, i) => (
            <path key={i} d={d} stroke="#F2EEE6" strokeOpacity={0.38} strokeWidth="0.9" />
          ))}
          <path d={accent} stroke="#E3CD9B" strokeOpacity={0.92} strokeWidth="1.15" />
        </g>

        <rect width="240" height="180" fill={`url(#v-${uid})`} />
      </svg>

      <div className="grain-layer" />

      {caption ? (
        <span className="eyebrow absolute bottom-4 left-4 text-ivory-200/55">
          {caption}
        </span>
      ) : null}
    </div>
  )
}
