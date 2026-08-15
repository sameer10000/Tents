import { BufferGeometry, CylinderGeometry, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries, taperedStrut } from './shared'

/**
 * The scale figure standing beside the tent in the technical view.
 *
 * A drawing is only honest about size if there is something familiar next to
 * it, and that something has to survive being orbited — a flat silhouette
 * turns into a line the moment the camera moves off axis. So this is a real
 * solid at real proportions: 1.8 m to the crown, seven and a half heads, with
 * the shoulders, hips, knees and ankles where a person's actually are.
 *
 * Everything below is written against a 1.8 m body and scaled at the end, so
 * the numbers can be read as centimetres on a person.
 */

/** Landmarks up the body, in metres, for a 1.8 m figure. */
const Y = {
  ground: 0,
  ankle: 0.075,
  knee: 0.5,
  hip: 0.92,
  waist: 1.12,
  shoulder: 1.44,
  chestTop: 1.46,
  neckTop: 1.585,
  // Set so the crown lands at exactly 1.8 m — the callout beside the figure
  // quotes that number, so the mesh had better reach it.
  headCentre: 1.685,
} as const

const HEAD_RADIUS = 0.115

const HALF = {
  hip: 0.095,
  shoulder: 0.19,
} as const

/**
 * A vertical section of the trunk: a tapered cylinder squashed front-to-back,
 * because no one is circular in plan.
 */
function trunk(
  bottom: number,
  top: number,
  radiusBottom: number,
  radiusTop: number,
  depthRatio: number,
): BufferGeometry {
  const height = top - bottom
  const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, 12, 1)
  geometry.scale(1, 1, depthRatio)
  geometry.translate(0, bottom + height / 2, 0)
  return geometry
}

/**
 * Builds the figure, standing at the origin and facing +Z.
 *
 * Returns one merged geometry — it is a single annotation on the drawing, not
 * a thing anyone needs to colour part by part.
 */
export function buildFigure(height = 1.8): BufferGeometry {
  const parts: BufferGeometry[] = []
  const at = (x: number, y: number, z = 0) => new Vector3(x, y, z)

  /* ── Trunk ────────────────────────────────────────────────────────────── */

  parts.push(trunk(Y.hip - 0.02, Y.waist, 0.15, 0.125, 0.7))
  parts.push(trunk(Y.waist, Y.chestTop, 0.125, 0.175, 0.62))

  // The shoulder line, capped at each joint.
  parts.push(taperedStrut(at(-HALF.shoulder, Y.shoulder), at(HALF.shoulder, Y.shoulder), 0.075, 0.075))
  for (const side of [-1, 1]) {
    const joint = new SphereGeometry(0.075, 10, 8)
    joint.translate(side * HALF.shoulder, Y.shoulder, 0)
    parts.push(joint)
  }

  /* ── Head ─────────────────────────────────────────────────────────────── */

  parts.push(taperedStrut(at(0, Y.chestTop - 0.02), at(0, Y.neckTop), 0.055, 0.048))

  const head = new SphereGeometry(HEAD_RADIUS, 12, 10)
  head.scale(0.92, 1, 0.88)
  head.translate(0, Y.headCentre, 0)
  parts.push(head)

  /* ── Arms ─────────────────────────────────────────────────────────────── */

  for (const side of [-1, 1]) {
    const shoulder = at(side * HALF.shoulder, Y.shoulder - 0.02)
    const elbow = at(side * 0.215, 1.12, 0.015)
    const wrist = at(side * 0.235, 0.84, 0.035)
    const hand = at(side * 0.245, 0.72, 0.045)

    parts.push(taperedStrut(shoulder, elbow, 0.052, 0.042))
    parts.push(taperedStrut(elbow, wrist, 0.042, 0.032))
    parts.push(taperedStrut(wrist, hand, 0.034, 0.026))
  }

  /* ── Legs ─────────────────────────────────────────────────────────────── */

  for (const side of [-1, 1]) {
    const hip = at(side * HALF.hip, Y.hip)
    const knee = at(side * 0.105, Y.knee, 0.005)
    const ankle = at(side * 0.11, Y.ankle, -0.01)

    parts.push(taperedStrut(hip, knee, 0.085, 0.058))
    parts.push(taperedStrut(knee, ankle, 0.058, 0.038))

    // The foot: a flattened cylinder running forward from the ankle. Turning
    // it on its side makes the squashed axis the vertical one, so the sole
    // sits at exactly that half-thickness above the ground.
    const soleHalf = 0.045 * 0.55
    const foot = new CylinderGeometry(0.045, 0.045, 0.25, 8, 1)
    foot.scale(1, 1, 0.55)
    foot.rotateX(Math.PI / 2)
    foot.translate(side * 0.11, soleHalf, 0.06)
    parts.push(foot)
  }

  const figure = mergeGeometries(parts)

  // Everything above is a 1.8 m body; scale it to whatever was asked for.
  const scale = height / 1.8
  if (scale !== 1) figure.scale(scale, scale, scale)

  return figure
}
