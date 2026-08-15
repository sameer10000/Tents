import { BufferGeometry, ConeGeometry, SphereGeometry, Vector3 } from 'three'
import type { LengthUnit, MedievalSpec } from '../../data/tent-config'
import { formatLength } from '../../data/tent-config'
import { scallopProfile } from '../../data/scallops'
import type { DimensionLine, Loop, Opening, TentModel, TentPart } from './shared'
import {
  TAU,
  arcsBetween,
  circleLoop,
  floorFromLoop,
  mergeGeometries,
  onCircle,
  quad,
  rectLoop,
  sagAt,
  spacedAngles,
  stadiumLoop,
  strut,
  surfaceFromGrid,
  wallBand,
} from './shared'

/**
 * The medieval pavilion, in four historic forms.
 *
 * Gores are built individually rather than textured, so an alternating cut is
 * real geometry: each panel is its own surface, and the two colours are two
 * merged meshes. That is also why the valance can be scalloped or dagged — the
 * cloth genuinely ends at a different height as you walk round it.
 */
export function buildMedieval(spec: MedievalSpec, unit: LengthUnit): TentModel {
  const parts: TentPart[] = []
  const push = (
    id: string,
    surface: TentPart['surface'],
    role: TentPart['role'],
    geometry: BufferGeometry,
    extra: Partial<TentPart> = {},
  ) => {
    if (geometry.getAttribute('position')) parts.push({ id, surface, role, geometry, ...extra })
  }

  const pitch = (spec.roofPitch * Math.PI) / 180
  const wallTop = spec.wallHeight
  const isRound = spec.form === 'round'
  const radius = spec.diameter / 2

  /* ── Plan ─────────────────────────────────────────────────────────────── */

  let loop: Loop
  let apex: number
  let footprint: { x: number; z: number }

  if (isRound) {
    loop = circleLoop(radius)
    apex = wallTop + radius * Math.tan(pitch)
    footprint = { x: radius, z: radius }
  } else if (spec.form === 'oval') {
    loop = stadiumLoop(spec.length, spec.width)
    apex = wallTop + (spec.width / 2) * Math.tan(pitch)
    footprint = { x: spec.width / 2, z: spec.length / 2 }
  } else {
    loop = rectLoop(spec.length, spec.width)
    apex =
      wallTop +
      (spec.form === 'saxon' ? Math.min(spec.width, spec.length) / 2 : spec.width / 2) *
        Math.tan(pitch)
    footprint = { x: spec.width / 2, z: spec.length / 2 }
  }

  const rise = apex - wallTop

  /* ── Door ─────────────────────────────────────────────────────────────── */

  const doorWidth = spec.door === 'double-arch' ? 1.8 : 1.1
  const doorHalfU = Math.min(doorWidth / 2 / loop.perimeter, 0.14)
  const openings: Opening[] = [{ center: 0, half: doorHalfU }]
  const doorTop = Math.max(1.95, wallTop)
  /** How far the door climbs into the roof when the walls are too low for it. */
  const archT = wallTop >= doorTop ? 0 : Math.min((doorTop - wallTop) / Math.max(rise, 0.1), 0.55)

  /* ── Valance edge ─────────────────────────────────────────────────────── */

  const profile = scallopProfile(spec.valanceEdge)
  const repeats = Math.max(6, Math.round(loop.perimeter / profile.repeat))

  // A short wall cannot carry a deep scallop — the cut would run into the
  // ground. Shortening the drop is what a cutter would do, and it keeps every
  // profile usable at every wall height.
  const depth = Math.min(profile.depth, Math.max(0.1, wallTop - 0.08))

  /** Where the cloth ends, measured down from the eave. */
  const valanceDrop = (u: number): number => {
    const local = ((((u % 1) + 1) % 1) * repeats) % 1
    return profile.at(local) * depth
  }

  // Enough columns that a square tooth reads as square rather than bevelled.
  const valanceCols = Math.min(900, Math.max(96, repeats * 14))

  /* ── Walls ────────────────────────────────────────────────────────────── */

  if (wallTop > 0.05) {
    const arcs = arcsBetween(openings, 1)
    const panels = arcs.map((arc) =>
      wallBand(loop, arc.start, arc.end, () => 0, () => wallTop, { rows: 3 }),
    )
    push('wall', 'walls', 'canvas', mergeGeometries(panels), { doubleSide: true })
  }

  // The valance hangs off the eave whatever the walls do.
  push(
    'valance',
    'valance',
    'canvas',
    wallBand(loop, 0, 1, (u) => wallTop - valanceDrop(u), () => wallTop + 0.02, {
      cols: valanceCols,
      rows: 3,
      outset: 0.03,
    }),
    { doubleSide: true },
  )

  // The braid: a cord sewn along the cut edge, following it exactly. Sat
  // further out than the valance so it stands proud of the cloth.
  if (spec.braid) {
    push(
      'braid',
      'braid',
      'canvas',
      wallBand(
        loop,
        0,
        1,
        (u) => wallTop - valanceDrop(u) - 0.012,
        (u) => wallTop - valanceDrop(u) + 0.05,
        { cols: valanceCols, rows: 2, outset: 0.052 },
      ),
      { doubleSide: true },
    )
  }

  /* ── Roof ─────────────────────────────────────────────────────────────── */

  const primary: BufferGeometry[] = []
  const secondary: BufferGeometry[] = []
  const striped = spec.stripe === 'alternating'
  const bucket = (index: number) => (striped && index % 2 === 1 ? secondary : primary)

  /** Distance in u from the door centre, wrapped. */
  const archAtU = (u: number) => {
    if (archT <= 0) return 0
    const delta = Math.abs(((u + 1.5) % 1) - 0.5)
    if (delta >= doorHalfU) return 0
    return archT * Math.cos((Math.PI / 2) * (delta / doorHalfU))
  }

  if (isRound) {
    const gores = spec.gores
    for (let i = 0; i < gores; i++) {
      const uStart = i / gores
      const uEnd = (i + 1) / gores
      const grid: Vector3[][] = []

      for (let r = 0; r <= 5; r++) {
        const v = r / 5
        const row: Vector3[] = []
        for (let c = 0; c <= 5; c++) {
          const u = uStart + (uEnd - uStart) * (c / 5)
          const base = archAtU(u)
          const t = base + (1 - base) * v
          // Each gore bellies out between its seams — the cut is not flat.
          const belly = Math.sin(Math.PI * (c / 5)) * radius * 0.022 * (1 - t)
          const droop = sagAt(t, rise * 0.025)
          row.push(onCircle(radius * (1 - t) + belly, u * TAU, wallTop + rise * t + droop))
        }
        grid.push(row)
      }
      bucket(i).push(surfaceFromGrid(grid))
    }
  } else if (spec.form === 'oval') {
    const capRadius = spec.width / 2
    const straight = Math.max(spec.length - spec.width, 0) / 2
    const capGores = Math.max(4, Math.round(spec.gores / 2))

    // Two half-cones, one at each mast.
    for (const [end, zMast] of [
      [1, straight],
      [-1, -straight],
    ] as const) {
      for (let i = 0; i < capGores; i++) {
        const a0 = (Math.PI * i) / capGores
        const a1 = (Math.PI * (i + 1)) / capGores
        const grid: Vector3[][] = []
        for (let r = 0; r <= 4; r++) {
          const t = r / 4
          const row: Vector3[] = []
          for (let c = 0; c <= 4; c++) {
            const theta = a0 + (a1 - a0) * (c / 4)
            const signed = end > 0 ? theta - Math.PI / 2 : theta + Math.PI / 2
            const belly = Math.sin(Math.PI * (c / 4)) * capRadius * 0.02 * (1 - t)
            const point = onCircle(
              capRadius * (1 - t) + belly,
              signed,
              wallTop + rise * t + sagAt(t, rise * 0.02),
            )
            row.push(new Vector3(point.x, point.y, point.z + zMast))
          }
          grid.push(row)
        }
        bucket(end > 0 ? i : i + capGores).push(surfaceFromGrid(grid))
      }
    }

    // The ridged centre, split into stripes along its length.
    const bays = Math.max(2, Math.round(straight))
    for (let i = 0; i < bays; i++) {
      const z0 = -straight + (2 * straight * i) / bays
      const z1 = -straight + (2 * straight * (i + 1)) / bays
      for (const side of [1, -1]) {
        const grid: Vector3[][] = []
        for (let r = 0; r <= 3; r++) {
          const t = r / 3
          const row: Vector3[] = []
          for (let c = 0; c <= 2; c++) {
            const z = z0 + (z1 - z0) * (c / 2)
            row.push(
              new Vector3(
                side * capRadius * (1 - t),
                wallTop + rise * t + sagAt(t, rise * 0.02),
                z,
              ),
            )
          }
          grid.push(row)
        }
        bucket(i).push(surfaceFromGrid(grid))
      }
    }
  } else if (spec.form === 'geteld') {
    const halfW = spec.width / 2
    const halfL = spec.length / 2
    const bays = Math.max(3, Math.round(spec.length / 0.9))

    for (let i = 0; i < bays; i++) {
      const z0 = -halfL + (spec.length * i) / bays
      const z1 = -halfL + (spec.length * (i + 1)) / bays
      for (const side of [1, -1]) {
        const grid: Vector3[][] = []
        for (let r = 0; r <= 3; r++) {
          const t = r / 3
          const row: Vector3[] = []
          for (let c = 0; c <= 2; c++) {
            const z = z0 + (z1 - z0) * (c / 2)
            row.push(
              new Vector3(side * halfW * (1 - t), wallTop + rise * t + sagAt(t, rise * 0.03), z),
            )
          }
          grid.push(row)
        }
        bucket(i).push(surfaceFromGrid(grid))
      }
    }

    // Gable ends. The front one carries the door when the walls are low.
    for (const zEnd of [halfL, -halfL]) {
      const isFront = zEnd > 0
      const cut = isFront && archT > 0 ? Math.min(doorWidth / 2, halfW * 0.8) : 0
      if (!cut) {
        primary.push(
          quad(
            new Vector3(-halfW, wallTop, zEnd),
            new Vector3(halfW, wallTop, zEnd),
            new Vector3(0, apex, zEnd),
            new Vector3(0, apex, zEnd),
          ),
        )
      } else {
        // Two side panels either side of the arched entry.
        for (const side of [1, -1]) {
          primary.push(
            quad(
              new Vector3(side * cut, wallTop, zEnd),
              new Vector3(side * halfW, wallTop, zEnd),
              new Vector3(side * halfW * 0.55, apex * 0.62, zEnd),
              new Vector3(side * cut * 0.7, doorTop, zEnd),
            ),
          )
        }
        primary.push(
          quad(
            new Vector3(-cut * 0.7, doorTop, zEnd),
            new Vector3(cut * 0.7, doorTop, zEnd),
            new Vector3(halfW * 0.55, apex * 0.62, zEnd),
            new Vector3(-halfW * 0.55, apex * 0.62, zEnd),
          ),
        )
        primary.push(
          quad(
            new Vector3(-halfW * 0.55, apex * 0.62, zEnd),
            new Vector3(halfW * 0.55, apex * 0.62, zEnd),
            new Vector3(0, apex, zEnd),
            new Vector3(0, apex, zEnd),
          ),
        )
      }
    }
  } else {
    // Saxon: a four-sided pyramid.
    const halfW = spec.width / 2
    const halfL = spec.length / 2
    const corners = [
      new Vector3(halfW, wallTop, halfL),
      new Vector3(halfW, wallTop, -halfL),
      new Vector3(-halfW, wallTop, -halfL),
      new Vector3(-halfW, wallTop, halfL),
    ]
    corners.forEach((corner, i) => {
      const next = corners[(i + 1) % corners.length]
      const grid: Vector3[][] = []
      for (let r = 0; r <= 3; r++) {
        const t = r / 3
        const row: Vector3[] = []
        for (let c = 0; c <= 3; c++) {
          const edge = corner.clone().lerp(next, c / 3)
          const point = edge.lerp(new Vector3(0, apex, 0), t)
          point.y += sagAt(t, rise * 0.03)
          row.push(point)
        }
        grid.push(row)
      }
      bucket(i).push(surfaceFromGrid(grid))
    })
  }

  push('roof', 'roof', 'canvas', mergeGeometries(primary), { doubleSide: true })
  if (secondary.length) {
    push('roof-alt', 'roofAlt', 'canvas', mergeGeometries(secondary), { doubleSide: true })
  }

  // A banded cut puts one horizontal stripe round the roof instead.
  if (spec.stripe === 'banded') {
    push(
      'band',
      'roofAlt',
      'canvas',
      wallBand(loop, 0, 1, () => wallTop + rise * 0.3, () => wallTop + rise * 0.46, {
        cols: 72,
        rows: 2,
        outset: 0.02,
      }),
      { doubleSide: true },
    )
  }

  /* ── Door curtains ────────────────────────────────────────────────────── */

  if (spec.door === 'laced') {
    // A closed entry: the cloth stays, the lacing is drawn over it.
    push(
      'door',
      'door',
      'canvas',
      wallBand(loop, -doorHalfU, doorHalfU, () => 0, () => doorTop, { rows: 3, outset: 0.015 }),
      { doubleSide: true },
    )
    const lacing: BufferGeometry[] = []
    for (let i = 0; i < 7; i++) {
      const y = 0.25 + i * ((doorTop - 0.4) / 7)
      const left = loop.at(-doorHalfU * 0.55)
      const right = loop.at(doorHalfU * 0.55)
      lacing.push(
        strut(new Vector3(left.x, y, left.z), new Vector3(right.x, y + 0.1, right.z), 0.012),
      )
    }
    push('lacing', 'rope', 'rope', mergeGeometries(lacing))
  } else {
    const curtains = [1, -1].map((side) =>
      wallBand(
        loop,
        side * doorHalfU,
        side * doorHalfU * 1.5,
        () => 0,
        () => doorTop * 0.92,
        { rows: 3, cols: 5, outset: 0.09 },
      ),
    )
    push('door', 'door', 'canvas', mergeGeometries(curtains), { doubleSide: true })
  }

  /* ── Structure ────────────────────────────────────────────────────────── */

  const frame: BufferGeometry[] = []

  if (spec.frame === 'rope-and-pole') {
    if (isRound || spec.form === 'saxon') {
      frame.push(strut(new Vector3(0, 0, 0), new Vector3(0, apex + 0.35, 0), 0.05))
    } else if (spec.form === 'oval') {
      const straight = Math.max(spec.length - spec.width, 0) / 2
      for (const z of [straight, -straight]) {
        frame.push(strut(new Vector3(0, 0, z), new Vector3(0, apex + 0.35, z), 0.05))
      }
      frame.push(
        strut(new Vector3(0, apex, straight), new Vector3(0, apex, -straight), 0.035),
      )
    } else {
      // Geteld: crossed poles at each gable, with a ridge between them.
      const halfW = spec.width / 2
      const halfL = spec.length / 2
      for (const z of [halfL, -halfL]) {
        for (const side of [1, -1]) {
          frame.push(
            strut(
              new Vector3(side * halfW * 0.9, 0, z),
              new Vector3(-side * halfW * 0.22, apex + 0.45, z),
              0.04,
            ),
          )
        }
      }
      frame.push(strut(new Vector3(0, apex, halfL), new Vector3(0, apex, -halfL), 0.035))
    }

    const guys: BufferGeometry[] = []
    const pegs: BufferGeometry[] = []
    for (const u of spacedAngles(10, openings, 0.04, 1)) {
      const anchor = loop.at(u)
      const outward = new Vector3(anchor.x, 0, anchor.z).normalize().multiplyScalar(1.1)
      const ground = new Vector3(anchor.x + outward.x, 0, anchor.z + outward.z)
      guys.push(strut(new Vector3(anchor.x, wallTop + 0.05, anchor.z), ground, 0.009))
      pegs.push(strut(ground, new Vector3(ground.x, 0.18, ground.z), 0.016))
    }
    push('guys', 'rope', 'rope', mergeGeometries(guys))
    push('pegs', 'frame', 'metal', mergeGeometries(pegs))
  } else {
    // Internal frame: legs at the eave line, hidden inside the cloth.
    for (const u of spacedAngles(8, openings, 0.04, 1)) {
      const point = loop.at(u)
      const inward = new Vector3(point.x, 0, point.z).multiplyScalar(0.94)
      frame.push(
        strut(new Vector3(inward.x, 0, inward.z), new Vector3(inward.x, wallTop, inward.z), 0.035),
      )
    }
  }
  push('frame', 'frame', 'metal', mergeGeometries(frame))

  /* ── Finial ───────────────────────────────────────────────────────────── */

  if (spec.finial !== 'none') {
    const finialZ = spec.form === 'oval' ? Math.max(spec.length - spec.width, 0) / 2 : 0
    // It caps whatever is underneath it. A mast pokes out above the cloth; a
    // ridge and an internal frame do not, and a finial hovering over thin air
    // is worse than no finial at all.
    const hasMast = spec.frame === 'rope-and-pole' && spec.form !== 'geteld'
    const top = hasMast ? apex + 0.35 : apex
    const bits: BufferGeometry[] = []

    if (spec.finial === 'ball') {
      const ball = new SphereGeometry(0.11, 12, 10)
      ball.translate(0, top + 0.1, finialZ)
      bits.push(ball)
    } else {
      const spear = new ConeGeometry(0.075, 0.42, 8)
      spear.translate(0, top + 0.24, finialZ)
      bits.push(spear)
      const ball = new SphereGeometry(0.075, 10, 8)
      ball.translate(0, top - 0.02, finialZ)
      bits.push(ball)
    }
    push('finial', 'finial', 'metal', mergeGeometries(bits))

    if (spec.finial === 'pennant') {
      const grid: Vector3[][] = []
      for (let r = 0; r <= 1; r++) {
        const row: Vector3[] = []
        for (let c = 0; c <= 6; c++) {
          const t = c / 6
          // A tapering pennant, rippling as it runs out.
          const drop = r === 0 ? 0 : 0.22 * (1 - t * 0.55)
          row.push(
            new Vector3(
              Math.sin(t * 4) * 0.06,
              top + 0.34 - drop - t * 0.06,
              finialZ + t * 1.05,
            ),
          )
        }
        grid.push(row)
      }
      push('pennant', 'finial', 'canvas', surfaceFromGrid(grid), { doubleSide: true })
    }
  }

  /* ── Ground and heraldry ──────────────────────────────────────────────── */

  if (spec.ground === 'sewn-in') {
    push('floor', 'interior', 'canvas', floorFromLoop(loop), { doubleSide: true })
  }

  if (spec.heraldry && wallTop > 0.7) {
    const centre = 0.5
    const half = Math.min(0.55 / loop.perimeter, 0.1)
    push(
      'heraldry',
      'roofAlt',
      'canvas',
      wallBand(
        loop,
        centre - half,
        centre + half,
        () => wallTop * 0.25,
        () => wallTop * 0.95,
        { rows: 2, cols: 4, outset: 0.02 },
      ),
      { doubleSide: true },
    )
  }

  /* ── Callouts ─────────────────────────────────────────────────────────── */

  const dimensions: DimensionLine[] = [
    isRound
      ? {
          id: 'diameter',
          from: [-radius, 0, 0],
          to: [radius, 0, 0],
          label: `Ø ${formatLength(spec.diameter, unit)}`,
        }
      : {
          id: 'length',
          from: [footprint.x, 0, -footprint.z],
          to: [footprint.x, 0, footprint.z],
          label: formatLength(spec.length, unit),
        },
    { id: 'apex', from: [0, 0, 0], to: [0, apex, 0], label: formatLength(apex, unit) },
  ]
  if (!isRound) {
    dimensions.push({
      id: 'width',
      from: [-footprint.x, 0, footprint.z],
      to: [footprint.x, 0, footprint.z],
      label: formatLength(spec.width, unit),
    })
  }

  return {
    parts,
    dimensions,
    radius: Math.hypot(footprint.x, footprint.z) + 1.2,
    height: apex + 0.8,
  }
}
