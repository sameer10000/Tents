/**
 * The scallop profiles the valance can be cut to.
 *
 * Each `at(t)` walks one repeat of the pattern, `t` running 0 → 1 along the
 * eave, and returns how deep the cloth hangs at that point: 0 is the shallowest
 * part of the cut, 1 the deepest. The geometry multiplies that by `depth`, so
 * a profile is described here once and the pavilion, its braid and the little
 * preview in the form all read the same numbers.
 *
 * Nothing in this file imports three.js — it is a description of a shape, not
 * a mesh.
 */

export type ScallopId =
  | 'plain'
  | 'square'
  | 'sine'
  | 'fish-mouth'
  | 'inverted-taj'
  | 'raj'
  | 'fish-scale'
  | 'dragon-mouth'

export interface ScallopProfile {
  id: ScallopId
  label: string
  hint: string
  /** Preferred length of one repeat, in metres. */
  repeat: number
  /** Drop of the deepest part of the cut below the eave, in metres. */
  depth: number
  at: (t: number) => number
}

/** Smooth 0 → 1 across [edge0, edge1]; used to round every corner slightly. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * A flat-topped pulse with softened corners — the basis of the cut profiles.
 * Returns 1 inside [start, end] and 0 outside, easing across `soften`.
 */
function pulse(t: number, start: number, end: number, soften: number): number {
  return smoothstep(start - soften, start + soften, t) * (1 - smoothstep(end - soften, end + soften, t))
}

/**
 * A rounded lobe across [start, end], zero everywhere else.
 *
 * The bounds check is not decoration: a fractional power of a negative sine is
 * NaN, and one NaN here would travel all the way into the vertex buffer.
 */
function lobe(t: number, start: number, end: number, power = 0.7): number {
  if (t <= start || t >= end) return 0
  return Math.pow(Math.sin(Math.PI * ((t - start) / (end - start))), power)
}

export const SCALLOPS: ScallopProfile[] = [
  {
    id: 'plain',
    label: 'Plain Scallop',
    hint: 'A straight cut edge',
    repeat: 1,
    depth: 0.22,
    at: () => 1,
  },
  {
    id: 'square',
    label: 'Square Scallop',
    hint: 'Castellated, with square teeth',
    repeat: 0.6,
    depth: 0.34,
    // Even teeth and gaps, corners eased just enough to catch the light.
    at: (t) => pulse(t, 0.06, 0.5, 0.025),
  },
  {
    id: 'sine',
    label: 'Sine Wave Scallop',
    hint: 'An even, rounded wave',
    repeat: 0.55,
    depth: 0.3,
    at: (t) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t),
  },
  {
    id: 'fish-mouth',
    label: 'Fish Mouth Scallop',
    hint: 'Wide, deep mouths meeting at a sharp point',
    repeat: 0.95,
    depth: 0.62,
    // The exponent below 1 widens the mouth and sharpens the cusp between.
    at: (t) => Math.pow(Math.sin(Math.PI * t), 0.55),
  },
  {
    id: 'inverted-taj',
    label: 'Inverted Taj Scallop',
    hint: 'An onion dome on square shoulders',
    repeat: 0.72,
    depth: 0.42,
    at: (t) => {
      // Measured out from the centre of the dome: a true circular crown, set
      // down on square shoulders, with the valley floor either side.
      const s = Math.abs(t - 0.5) * 2
      const crown = 0.62 * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(s / 0.56, 2))))
      const shoulder = 0.62
      const valley = 1

      if (s <= 0.54) return crown
      if (s < 0.58) return crown + (shoulder - crown) * smoothstep(0.54, 0.58, s)
      if (s <= 0.7) return shoulder
      return shoulder + (valley - shoulder) * smoothstep(0.7, 0.74, s)
    },
  },
  {
    id: 'raj',
    label: 'Raj Scallop',
    hint: 'Broad panels split by a narrow slot and a tongue',
    repeat: 0.8,
    depth: 0.5,
    at: (t) => {
      // A broad panel on bracketed shoulders, a narrow slot cut up between
      // them, and a small tongue left hanging in the slot.
      const panel = pulse(t, 0.1, 0.9, 0.06)
      const tongue = pulse(t, 0.45, 0.55, 0.025) * 0.34
      return Math.max(panel, tongue)
    },
  },
  {
    id: 'fish-scale',
    label: 'Fish Scale Scallop',
    hint: 'Narrow points over shallow rounded scoops',
    repeat: 0.5,
    depth: 0.46,
    // Sharp at the repeat boundary, rounded and shallow through the middle.
    at: (t) => 1 - 0.82 * Math.pow(Math.sin(Math.PI * t), 0.5),
  },
  {
    id: 'dragon-mouth',
    label: 'Dragon Mouth Scallop',
    hint: 'A broad jaw with a small tongue between',
    repeat: 1.05,
    depth: 0.56,
    // One heavy round jaw, then a narrow neck carrying a smaller tongue.
    at: (t) => Math.max(0.1, lobe(t, 0.02, 0.58, 0.62), lobe(t, 0.68, 0.94, 0.7) * 0.55),
  },
]

export const SCALLOP_BY_ID = new Map(SCALLOPS.map((profile) => [profile.id, profile]))

/** Falls back rather than throwing — a stored design may predate a profile. */
export function scallopProfile(id: string): ScallopProfile {
  return SCALLOP_BY_ID.get(id as ScallopId) ?? SCALLOPS[0]
}

/**
 * The cut edge as an SVG path across `width`, for the swatch beside each
 * option in the form. Drawn from the same `at()` as the cloth, so the little
 * preview cannot drift from what the pavilion actually does.
 */
export function scallopPath(id: string, width = 96, height = 26, repeats = 3): string {
  const profile = scallopProfile(id)
  const steps = repeats * 48
  const points: string[] = []

  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    const x = u * width
    const y = profile.at((u * repeats) % 1) * height
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  return `M ${points.join(' L ')}`
}
