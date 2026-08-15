import { BufferGeometry, SphereGeometry, Vector3 } from 'three'
import type { BellSpec, LengthUnit } from '../../data/tent-config'
import { formatLength } from '../../data/tent-config'
import type { DimensionLine, Opening, TentModel, TentPart } from './shared'
import {
  SEG,
  TAU,
  arcsBetween,
  mergeGeometries,
  onCircle,
  sagAt,
  spacedAngles,
  strut,
  surfaceFromGrid,
} from './shared'

/**
 * The bell tent: a cone on a short cylinder wall, hung from one centre pole.
 *
 * The door is a genuine gap — the wall arcs stop at its edges and the cone
 * above it is cut back along an arch — rather than a dark panel painted onto a
 * closed surface. Everything else hangs off that: the A-poles land on the door
 * corners, the guys avoid it, and the windows space themselves around it.
 */
export function buildBell(spec: BellSpec, unit: LengthUnit): TentModel {
  const radius = spec.diameter / 2
  const wallTop = spec.wallHeight
  const apex = Math.max(spec.centreHeight, wallTop + 0.9)
  const rise = apex - wallTop

  const parts: TentPart[] = []
  const push = (
    id: string,
    surface: TentPart['surface'],
    role: TentPart['role'],
    geometry: BufferGeometry,
    extra: Partial<TentPart> = {},
  ) => {
    parts.push({ id, surface, role, geometry, ...extra })
  }

  /* ── Doors ────────────────────────────────────────────────────────────── */

  const doorWidth = spec.doors === 'double' ? 1.7 : 1
  const doorHalf = Math.min(Math.asin(Math.min(doorWidth / 2 / radius, 0.95)), 1)
  const doorCenters = spec.doors === 'opposing' ? [0, Math.PI] : [0]
  const openings: Opening[] = doorCenters.map((center) => ({ center, half: doorHalf }))

  /** How far up the cone the door opening climbs, as a fraction of the rise. */
  const archT = 0.42
  const archHeight = wallTop + rise * archT

  /** The arch profile: full height at the centre, nothing at the corners. */
  const archAt = (theta: number) => {
    for (const center of doorCenters) {
      // Shortest angular distance to this door, in [0, π].
      const delta = Math.abs(((theta - center + Math.PI * 3) % TAU) - Math.PI)
      if (delta < doorHalf) return archT * Math.cos((Math.PI / 2) * (delta / doorHalf))
    }
    return 0
  }

  /* ── Wall ─────────────────────────────────────────────────────────────── */

  const wallArcs = arcsBetween(openings)

  const wallPanels = wallArcs.map((arc) => {
    const cols = Math.max(3, Math.ceil((arc.end - arc.start) / 0.14))
    const grid: Vector3[][] = []
    for (let r = 0; r <= SEG.height; r++) {
      const t = r / SEG.height
      const row: Vector3[] = []
      for (let c = 0; c < cols; c++) {
        const theta = arc.start + (arc.end - arc.start) * (c / (cols - 1))
        // Walls belly out very slightly between the eave and the skirt.
        const bulge = Math.sin(Math.PI * t) * radius * 0.008
        row.push(onCircle(radius + bulge, theta, t * wallTop))
      }
      grid.push(row)
    }
    return surfaceFromGrid(grid)
  })
  push('wall', 'walls', 'canvas', mergeGeometries(wallPanels), { doubleSide: true })

  /* ── Roof cone ────────────────────────────────────────────────────────── */

  const conePatch = (start: number, end: number, floor: (theta: number) => number) => {
    const cols = Math.max(3, Math.ceil((end - start) / 0.11))
    const grid: Vector3[][] = []
    for (let r = 0; r <= SEG.height + 2; r++) {
      const v = r / (SEG.height + 2)
      const row: Vector3[] = []
      for (let c = 0; c < cols; c++) {
        const theta = start + (end - start) * (c / (cols - 1))
        const base = floor(theta)
        const t = base + (1 - base) * v
        // Canvas droops between the pole and the eave; strongest mid-slope.
        const droop = sagAt(t, rise * 0.03)
        row.push(onCircle(radius * (1 - t), theta, wallTop + rise * t + droop))
      }
      grid.push(row)
    }
    return surfaceFromGrid(grid)
  }

  const conePanels = wallArcs.map((arc) => conePatch(arc.start, arc.end, () => 0))
  for (const center of doorCenters) {
    conePanels.push(conePatch(center - doorHalf, center + doorHalf, archAt))
  }
  push('cone', 'roof', 'canvas', mergeGeometries(conePanels), { doubleSide: true })

  /* ── Gore seams ───────────────────────────────────────────────────────── */

  const seams: BufferGeometry[] = []
  for (let i = 0; i < 12; i++) {
    const theta = (TAU * i) / 12
    if (archAt(theta) > 0.02) continue
    seams.push(
      strut(onCircle(radius, theta, wallTop), onCircle(0.02, theta, apex - 0.02), 0.012),
    )
  }
  push('seams', 'roof', 'canvas', mergeGeometries(seams))

  /* ── Valance and storm skirt ──────────────────────────────────────────── */

  if (spec.valance) {
    const grid: Vector3[][] = []
    for (const y of [wallTop - 0.16, wallTop + 0.01]) {
      const row: Vector3[] = []
      for (let c = 0; c <= 48; c++) {
        row.push(onCircle(radius + 0.025, (TAU * c) / 48, y))
      }
      grid.push(row)
    }
    push('valance', 'valance', 'canvas', surfaceFromGrid(grid), { doubleSide: true })
  }

  if (spec.stormSkirt) {
    const grid: Vector3[][] = []
    for (let r = 0; r <= 2; r++) {
      const t = r / 2
      const row: Vector3[] = []
      for (let c = 0; c <= 48; c++) {
        row.push(onCircle(radius + t * 0.11, (TAU * c) / 48, 0.16 * (1 - t)))
      }
      grid.push(row)
    }
    push('skirt', 'valance', 'canvas', surfaceFromGrid(grid), { doubleSide: true })
  }

  /* ── Windows ──────────────────────────────────────────────────────────── */

  if (spec.windows > 0 && spec.windowStyle !== 'none') {
    const half = Math.min(0.34, Math.PI / (spec.windows * 2.2))
    const panels = spacedAngles(spec.windows, openings).map((center) => {
      const grid: Vector3[][] = []
      for (let r = 0; r <= 3; r++) {
        const t = 0.07 + (r / 3) * 0.24
        const row: Vector3[] = []
        for (let c = 0; c <= 6; c++) {
          const theta = center - half + (2 * half * c) / 6
          // Sat 15 mm proud of the cloth so it reads as an aperture, not a stain.
          row.push(onCircle(radius * (1 - t) + 0.015, theta, wallTop + rise * t))
        }
        grid.push(row)
      }
      return surfaceFromGrid(grid)
    })

    const glazed = spec.windowStyle === 'pvc'
    push('windows', glazed ? 'glass' : 'mesh', glazed ? 'glass' : 'mesh', mergeGeometries(panels), {
      doubleSide: true,
      opacity: glazed ? 0.34 : 1,
    })
  }

  /* ── Door curtains, tied back ─────────────────────────────────────────── */

  const curtains: BufferGeometry[] = []
  for (const center of doorCenters) {
    for (const side of [-1, 1]) {
      const edge = center + side * doorHalf
      const grid: Vector3[][] = []
      for (let r = 0; r <= 3; r++) {
        const t = r / 3
        const row: Vector3[] = []
        for (let c = 0; c <= 3; c++) {
          const furl = (c / 3) * 0.3
          // The curtain rolls outward and gathers as it rises.
          const theta = edge + side * furl * (1 - t * 0.4)
          const bulge = Math.sin(Math.PI * (c / 3)) * 0.06
          row.push(onCircle(radius + bulge + 0.02, theta, t * (wallTop + rise * archT * 0.8)))
        }
        grid.push(row)
      }
      curtains.push(surfaceFromGrid(grid))
    }
  }
  push('door', 'door', 'canvas', mergeGeometries(curtains), { doubleSide: true })

  /* ── Ground ───────────────────────────────────────────────────────────── */

  if (spec.groundsheet !== 'none') {
    const grid: Vector3[][] = []
    for (let r = 0; r <= 2; r++) {
      const row: Vector3[] = []
      for (let c = 0; c <= 48; c++) {
        row.push(onCircle((radius * r) / 2, (TAU * c) / 48, 0.015))
      }
      grid.push(row)
    }
    push('groundsheet', 'interior', 'canvas', surfaceFromGrid(grid), { doubleSide: true })
  }

  /* ── Poles ────────────────────────────────────────────────────────────── */

  const poleRole = spec.poleFinish === 'wood' ? 'timber' : 'metal'
  const poles = [strut(new Vector3(0, 0, 0), new Vector3(0, apex, 0), 0.045)]

  for (const center of doorCenters) {
    const peak = onCircle(radius * (1 - archT) + 0.02, center, archHeight)
    for (const side of [-1, 1]) {
      poles.push(strut(onCircle(radius + 0.02, center + side * doorHalf, 0), peak, 0.028))
    }
  }
  push('poles', 'frame', poleRole, mergeGeometries(poles))

  /* ── Guys and pegs ────────────────────────────────────────────────────── */

  const guyCount = spec.guyKit === 'storm' ? 12 : 8
  const guyReach = radius * 0.55
  const guys: BufferGeometry[] = []
  const pegs: BufferGeometry[] = []

  for (const theta of spacedAngles(guyCount, openings, 0.1)) {
    const top = onCircle(radius + 0.03, theta, wallTop - 0.05)
    const ground = onCircle(radius + guyReach, theta, 0)
    guys.push(strut(top, ground, spec.guyKit === 'storm' ? 0.012 : 0.008))
    pegs.push(strut(ground, new Vector3(ground.x, 0.16, ground.z), 0.016))
  }
  push('guys', 'rope', 'rope', mergeGeometries(guys))
  push('pegs', 'frame', 'metal', mergeGeometries(pegs))

  /* ── Roof vents ───────────────────────────────────────────────────────── */

  if (spec.vents > 0) {
    const flaps = spacedAngles(spec.vents, openings, 0.4).map((theta) => {
      const grid: Vector3[][] = []
      for (let r = 0; r <= 1; r++) {
        const t = 0.62 + r * 0.14
        const row: Vector3[] = []
        for (let c = 0; c <= 3; c++) {
          const spread = (c / 3 - 0.5) * 0.34
          // The flap lifts away from the cone at its lower edge.
          const lift = (1 - r) * 0.1
          row.push(
            onCircle(radius * (1 - t) + 0.02 + lift, theta + spread, wallTop + rise * t + lift),
          )
        }
        grid.push(row)
      }
      return surfaceFromGrid(grid)
    })
    push('vents', 'roof', 'canvas', mergeGeometries(flaps), { doubleSide: true })
  }

  /* ── Stove jack ───────────────────────────────────────────────────────── */

  if (spec.stoveJack !== 'none') {
    const theta = Math.PI * 0.72
    const onRoof = spec.stoveJack === 'roof'
    const t = onRoof ? 0.5 : 0
    const base = onRoof
      ? onCircle(radius * (1 - t), theta, wallTop + rise * t)
      : onCircle(radius, theta, wallTop * 0.55)
    const top = onRoof
      ? new Vector3(base.x * 1.05, base.y + 0.75, base.z * 1.05)
      : new Vector3(base.x * 1.28, base.y + 0.55, base.z * 1.28)
    push('stove-jack', 'frame', 'metal', strut(base, top, 0.055))
  }

  /* ── Finial ───────────────────────────────────────────────────────────── */

  if (spec.finial) {
    const cap = new SphereGeometry(0.075, 12, 8)
    cap.translate(0, apex + 0.06, 0)
    push('finial', 'finial', 'metal', cap)
  }

  /* ── Awning ───────────────────────────────────────────────────────────── */

  if (spec.awning === 'porch') {
    const center = doorCenters[0]
    const reach = 1.7
    const outerY = Math.max(archHeight - 0.55, 1.5)
    const spread = doorHalf * 1.5

    const grid: Vector3[][] = []
    for (let r = 0; r <= 3; r++) {
      const t = r / 3
      const row: Vector3[] = []
      for (let c = 0; c <= 5; c++) {
        const u = c / 5
        const theta = center + (u - 0.5) * 2 * spread
        const innerPoint = onCircle(radius * (1 - archT * (1 - t)) + 0.02, theta, archHeight)
        const outerPoint = onCircle(radius + reach, theta, outerY)
        const point = innerPoint.clone().lerp(outerPoint, t)
        point.y += sagAt(u, 0.09) * t
        row.push(point)
      }
      grid.push(row)
    }
    push('awning', 'roof', 'canvas', surfaceFromGrid(grid), { doubleSide: true })

    const posts = [-1, 1].map((side) => {
      const foot = onCircle(radius + reach, center + side * spread, 0)
      return strut(foot, new Vector3(foot.x, outerY, foot.z), 0.032)
    })
    push('awning-posts', 'frame', poleRole, mergeGeometries(posts))
  }

  if (spec.awning === 'veranda') {
    const attachT = 0.45
    const attachY = wallTop + rise * attachT
    const reach = 1.5
    const outerY = Math.max(attachY - 0.3, 1.4)

    const grid: Vector3[][] = []
    for (let r = 0; r <= 2; r++) {
      const t = r / 2
      const row: Vector3[] = []
      for (let c = 0; c <= 48; c++) {
        const theta = (TAU * c) / 48
        const innerRadius = radius * (1 - attachT)
        row.push(
          onCircle(innerRadius + (radius + reach - innerRadius) * t, theta, attachY + (outerY - attachY) * t),
        )
      }
      grid.push(row)
    }
    push('awning', 'roof', 'canvas', surfaceFromGrid(grid), { doubleSide: true })

    const posts = spacedAngles(6, []).map((theta) => {
      const foot = onCircle(radius + reach, theta, 0)
      return strut(foot, new Vector3(foot.x, outerY, foot.z), 0.032)
    })
    push('awning-posts', 'frame', poleRole, mergeGeometries(posts))
  }

  /* ── Measured callouts ────────────────────────────────────────────────── */

  const dimensions: DimensionLine[] = [
    {
      id: 'diameter',
      from: [-radius, 0, 0],
      to: [radius, 0, 0],
      label: `Ø ${formatLength(spec.diameter, unit)}`,
    },
    {
      id: 'centre',
      from: [0, 0, 0],
      to: [0, apex, 0],
      label: formatLength(apex, unit),
    },
    {
      id: 'wall',
      from: [0, 0, radius],
      to: [0, wallTop, radius],
      label: formatLength(wallTop, unit),
    },
  ]

  return {
    parts: parts.filter((part) => part.geometry.getAttribute('position')),
    dimensions,
    radius: radius + (spec.awning === 'none' ? guyReach : 1.7),
    height: apex + (spec.finial ? 0.2 : 0),
  }
}
