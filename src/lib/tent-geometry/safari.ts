import { BoxGeometry, BufferGeometry, Vector3 } from 'three'
import type { LengthUnit, SafariSpec } from '../../data/tent-config'
import { formatLength } from '../../data/tent-config'
import type { DimensionLine, Opening, TentModel, TentPart } from './shared'
import {
  arcsBetween,
  mergeGeometries,
  quad,
  rectLoop,
  sagAt,
  strut,
  surfaceFromGrid,
  wallBand,
} from './shared'

/**
 * The safari tent: a steel frame carrying a ridged canvas room.
 *
 * Unlike the pole tents this one is genuinely rectilinear, so the walls come
 * off a rectangular ground plan and the roof is built plane by plane. The
 * veranda, the fly sheet and the ensuite pod are separate volumes attached to
 * that core, which is why any combination of them holds together.
 */
export function buildSafari(spec: SafariSpec, unit: LengthUnit): TentModel {
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

  const halfW = spec.width / 2
  const halfL = spec.length / 2
  const eave = spec.eaveHeight
  const ridge = Math.max(spec.ridgeHeight, eave + 0.4)
  const overhang = 0.16

  const loop = rectLoop(spec.length, spec.width)
  const perimeter = loop.perimeter

  /* ── Openings, in perimeter distance ──────────────────────────────────── */

  const doorWidth = 1.2
  const doorHalfU = doorWidth / 2 / perimeter
  const doorTop = Math.min(2.1, eave - 0.05)
  const doorCentres = spec.doors === 'front-rear' ? [0, 0.5] : [0]
  const openings: Opening[] = doorCentres.map((center) => ({ center, half: doorHalfU }))

  // Where each face begins and ends, as normalised perimeter distance.
  const face = {
    right: [halfW / perimeter, (halfW + spec.length) / perimeter] as const,
    left: [
      (halfW + spec.length + spec.width) / perimeter,
      (halfW + 2 * spec.length + spec.width) / perimeter,
    ] as const,
  }

  /* ── Walls ────────────────────────────────────────────────────────────── */

  const wallArcs = arcsBetween(openings, 1)
  const solidWalls: BufferGeometry[] = []

  for (const arc of wallArcs) {
    if (spec.rollUpWalls) {
      // Rolled sides leave only the end walls standing.
      const clipped = clipToEnds(arc, face)
      for (const piece of clipped) {
        solidWalls.push(wallBand(loop, piece.start, piece.end, () => 0, () => eave, { rows: 2 }))
      }
    } else {
      solidWalls.push(wallBand(loop, arc.start, arc.end, () => 0, () => eave, { rows: 2 }))
    }
  }
  push('walls', 'walls', 'canvas', mergeGeometries(solidWalls), { doubleSide: true })

  if (spec.rollUpWalls) {
    // The rolled bundle sits under the eave on each long side.
    const rolls = [face.right, face.left].map(([start, end]) => {
      const a = loop.at(start + 0.01)
      const b = loop.at(end - 0.01)
      return strut(new Vector3(a.x, eave - 0.18, a.z), new Vector3(b.x, eave - 0.18, b.z), 0.15)
    })
    push('rolled-walls', 'walls', 'canvas', mergeGeometries(rolls))
  }

  /* ── Roof ─────────────────────────────────────────────────────────────── */

  const verandaDepth = spec.veranda === 'none' ? 0 : spec.verandaDepth
  const roofFront = halfL + verandaDepth
  const roofBack = -halfL - (spec.veranda === 'wrap' ? verandaDepth : 0)

  const roofPlane = (side: number, lift = 0, spread = 0) => {
    const grid: Vector3[][] = []
    for (let r = 0; r <= 3; r++) {
      const t = r / 3
      const row: Vector3[] = []
      for (let c = 0; c <= 4; c++) {
        const z = roofBack + (roofFront - roofBack) * (c / 4)
        const x = side * (halfW + overhang + spread) * (1 - t)
        const y = eave + (ridge - eave) * t + lift + sagAt(c / 4, 0.06) * (1 - t)
        row.push(new Vector3(x, y, z))
      }
      grid.push(row)
    }
    return surfaceFromGrid(grid)
  }

  push('roof', 'roof', 'canvas', mergeGeometries([roofPlane(1), roofPlane(-1)]), {
    doubleSide: true,
  })

  if (spec.roof === 'double') {
    // The fly stands off the roof, wider and a little higher.
    push(
      'fly',
      'roof',
      'canvas',
      mergeGeometries([roofPlane(1, 0.22, 0.2), roofPlane(-1, 0.22, 0.2)]),
      { doubleSide: true },
    )
  }

  // Gable ends, above the walls.
  const gables: BufferGeometry[] = []
  for (const z of [halfL, -halfL]) {
    gables.push(
      quad(
        new Vector3(-halfW, eave, z),
        new Vector3(halfW, eave, z),
        new Vector3(0, ridge, z),
        new Vector3(0, ridge, z),
      ),
    )
  }
  push('gables', 'walls', 'canvas', mergeGeometries(gables), { doubleSide: true })

  /* ── Veranda ──────────────────────────────────────────────────────────── */

  if (spec.veranda !== 'none') {
    const posts: BufferGeometry[] = []
    const cornerZ = spec.veranda === 'wrap' ? [roofFront, roofBack] : [roofFront]

    for (const z of cornerZ) {
      for (const side of [1, -1]) {
        const x = side * (halfW + overhang)
        posts.push(strut(new Vector3(x, 0, z), new Vector3(x, eave, z), 0.05))
      }
    }

    if (spec.veranda === 'wrap') {
      // Side aprons, sloping outward and down from the eave.
      const aprons = [1, -1].map((side) => {
        const grid: Vector3[][] = []
        for (let r = 0; r <= 1; r++) {
          const row: Vector3[] = []
          for (let c = 0; c <= 4; c++) {
            const z = roofBack + (roofFront - roofBack) * (c / 4)
            const reach = r === 0 ? overhang : overhang + verandaDepth
            row.push(new Vector3(side * (halfW + reach), eave - r * 0.32, z))
          }
          grid.push(row)
        }
        return surfaceFromGrid(grid)
      })
      push('veranda-roof', 'roof', 'canvas', mergeGeometries(aprons), { doubleSide: true })

      for (const z of [halfL * 0.4, -halfL * 0.4, roofFront, roofBack]) {
        for (const side of [1, -1]) {
          const x = side * (halfW + verandaDepth)
          posts.push(strut(new Vector3(x, 0, z), new Vector3(x, eave - 0.32, z), 0.05))
        }
      }
    }

    push('veranda-posts', 'frame', 'metal', mergeGeometries(posts))

    // A trim band along the front edge of the veranda roof.
    push(
      'veranda-trim',
      'valance',
      'canvas',
      quad(
        new Vector3(-halfW - overhang, eave - 0.26, roofFront),
        new Vector3(halfW + overhang, eave - 0.26, roofFront),
        new Vector3(halfW + overhang, eave, roofFront),
        new Vector3(-halfW - overhang, eave, roofFront),
      ),
      { doubleSide: true },
    )
  }

  /* ── Ensuite pod ──────────────────────────────────────────────────────── */

  if (spec.ensuite === 'rear') {
    const podW = halfW * 0.78
    const podZ = -halfL
    const podBack = podZ - spec.ensuiteDepth
    const podEave = eave * 0.88
    const podRidge = podEave + 0.45

    const podParts = [
      // Side walls.
      quad(
        new Vector3(podW, 0, podZ),
        new Vector3(podW, 0, podBack),
        new Vector3(podW, podEave, podBack),
        new Vector3(podW, podEave, podZ),
      ),
      quad(
        new Vector3(-podW, 0, podBack),
        new Vector3(-podW, 0, podZ),
        new Vector3(-podW, podEave, podZ),
        new Vector3(-podW, podEave, podBack),
      ),
      // Back wall and its gable.
      quad(
        new Vector3(-podW, 0, podBack),
        new Vector3(podW, 0, podBack),
        new Vector3(podW, podEave, podBack),
        new Vector3(-podW, podEave, podBack),
      ),
      quad(
        new Vector3(-podW, podEave, podBack),
        new Vector3(podW, podEave, podBack),
        new Vector3(0, podRidge, podBack),
        new Vector3(0, podRidge, podBack),
      ),
    ]
    push('ensuite', 'walls', 'canvas', mergeGeometries(podParts), { doubleSide: true })

    const podRoof = [1, -1].map((side) =>
      quad(
        new Vector3(side * (podW + 0.1), podEave, podBack),
        new Vector3(side * (podW + 0.1), podEave, podZ),
        new Vector3(0, podRidge, podZ),
        new Vector3(0, podRidge, podBack),
      ),
    )
    push('ensuite-roof', 'roof', 'canvas', mergeGeometries(podRoof), { doubleSide: true })
  }

  /* ── Windows ──────────────────────────────────────────────────────────── */

  if (spec.windowsPerWall > 0) {
    const meshPanels: BufferGeometry[] = []
    const flaps: BufferGeometry[] = []
    const sill = eave * 0.42
    const head = eave * 0.86

    for (const [start, end] of [face.right, face.left]) {
      const span = end - start
      for (let i = 0; i < spec.windowsPerWall; i++) {
        const centre = start + (span * (i + 0.5)) / spec.windowsPerWall
        const half = Math.min(span / (spec.windowsPerWall * 2.6), 0.7 / perimeter)
        if (spec.rollUpWalls) continue

        meshPanels.push(
          wallBand(loop, centre - half, centre + half, () => sill, () => head, {
            rows: 2,
            cols: 3,
            outset: 0.015,
          }),
        )

        // The canvas flap above, propped out on a short stick.
        const a = loop.at(centre - half * 1.15)
        const b = loop.at(centre + half * 1.15)
        const outward = new Vector3(a.x + b.x, 0, a.z + b.z).normalize().multiplyScalar(0.42)
        flaps.push(
          quad(
            new Vector3(a.x, head, a.z),
            new Vector3(b.x, head, b.z),
            new Vector3(b.x + outward.x, head + 0.3, b.z + outward.z),
            new Vector3(a.x + outward.x, head + 0.3, a.z + outward.z),
          ),
        )
      }
    }
    push('windows', 'mesh', 'mesh', mergeGeometries(meshPanels), { doubleSide: true })
    push('window-flaps', 'walls', 'canvas', mergeGeometries(flaps), { doubleSide: true })
  }

  /* ── Doors ────────────────────────────────────────────────────────────── */

  const curtains: BufferGeometry[] = []
  for (const centre of doorCentres) {
    for (const side of [1, -1]) {
      curtains.push(
        wallBand(
          loop,
          centre + side * doorHalfU,
          centre + side * doorHalfU * 1.55,
          () => 0,
          () => doorTop,
          { rows: 2, cols: 4, outset: 0.08 },
        ),
      )
    }
  }
  push('doors', 'door', 'canvas', mergeGeometries(curtains), { doubleSide: true })

  if (spec.meshInner) {
    const screens = doorCentres.map((centre) =>
      wallBand(loop, centre - doorHalfU, centre + doorHalfU, () => 0, () => doorTop, {
        rows: 2,
        cols: 3,
        outset: -0.02,
      }),
    )
    push('door-screens', 'mesh', 'mesh', mergeGeometries(screens), { doubleSide: true })
  }

  /* ── Frame ────────────────────────────────────────────────────────────── */

  const frame: BufferGeometry[] = []
  const corners = [
    new Vector3(halfW, 0, halfL),
    new Vector3(halfW, 0, -halfL),
    new Vector3(-halfW, 0, -halfL),
    new Vector3(-halfW, 0, halfL),
  ]

  for (const corner of corners) {
    frame.push(strut(corner, new Vector3(corner.x, eave, corner.z), 0.055))
  }
  for (const side of [1, -1]) {
    frame.push(
      strut(new Vector3(side * halfW, eave, -halfL), new Vector3(side * halfW, eave, halfL), 0.04),
    )
  }
  frame.push(strut(new Vector3(0, ridge, -halfL), new Vector3(0, ridge, halfL), 0.045))

  // Rafters, roughly every 1.2 m along the ridge.
  const bays = Math.max(2, Math.round(spec.length / 1.2))
  for (let i = 0; i <= bays; i++) {
    const z = -halfL + (spec.length * i) / bays
    for (const side of [1, -1]) {
      frame.push(
        strut(new Vector3(side * halfW, eave, z), new Vector3(0, ridge, z), 0.028),
      )
    }
  }
  push('frame', 'frame', 'metal', mergeGeometries(frame))

  /* ── Floor ────────────────────────────────────────────────────────────── */

  if (spec.floor === 'deck') {
    const deckFront = roofFront
    const deckBack = spec.ensuite === 'rear' ? -halfL - spec.ensuiteDepth : roofBack
    const deckWidth = spec.veranda === 'wrap' ? spec.width + verandaDepth * 2 : spec.width
    const deckLength = deckFront - deckBack

    const slab = new BoxGeometry(deckWidth + 0.3, 0.14, deckLength + 0.3)
    slab.translate(0, -0.07, (deckFront + deckBack) / 2)
    push('deck', 'deck', 'timber', slab)

    const boards: BufferGeometry[] = []
    const boardCount = Math.round(deckLength / 0.22)
    for (let i = 0; i <= boardCount; i++) {
      const z = deckBack + (deckLength * i) / boardCount
      boards.push(
        strut(
          new Vector3(-(deckWidth + 0.3) / 2, 0.005, z),
          new Vector3((deckWidth + 0.3) / 2, 0.005, z),
          0.006,
        ),
      )
    }
    push('deck-boards', 'frame', 'timber', mergeGeometries(boards))
  } else if (spec.floor === 'pvc') {
    push(
      'floor',
      'interior',
      'canvas',
      quad(
        new Vector3(-halfW, 0.012, halfL),
        new Vector3(halfW, 0.012, halfL),
        new Vector3(halfW, 0.012, -halfL),
        new Vector3(-halfW, 0.012, -halfL),
      ),
      { doubleSide: true },
    )
  }

  /* ── Ridge vents and partition ────────────────────────────────────────── */

  if (spec.ridgeVents > 0) {
    const vents: BufferGeometry[] = []
    for (let i = 0; i < spec.ridgeVents; i++) {
      const z = -halfL + (spec.length * (i + 0.5)) / spec.ridgeVents
      const half = Math.min(0.4, spec.length / (spec.ridgeVents * 3))
      vents.push(
        quad(
          new Vector3(-0.45, ridge + 0.02, z - half),
          new Vector3(0.45, ridge + 0.02, z - half),
          new Vector3(0.45, ridge + 0.26, z + half),
          new Vector3(-0.45, ridge + 0.26, z + half),
        ),
      )
    }
    push('ridge-vents', 'roof', 'canvas', mergeGeometries(vents), { doubleSide: true })
  }

  if (spec.partition) {
    push(
      'partition',
      'walls',
      'canvas',
      quad(
        new Vector3(-halfW, 0, 0),
        new Vector3(halfW, 0, 0),
        new Vector3(halfW, eave, 0),
        new Vector3(-halfW, eave, 0),
      ),
      { doubleSide: true },
    )
  }

  /* ── Callouts ─────────────────────────────────────────────────────────── */

  const dimensions: DimensionLine[] = [
    {
      id: 'length',
      from: [halfW, 0, -halfL],
      to: [halfW, 0, halfL],
      label: formatLength(spec.length, unit),
    },
    {
      id: 'width',
      from: [-halfW, 0, halfL],
      to: [halfW, 0, halfL],
      label: formatLength(spec.width, unit),
    },
    { id: 'ridge', from: [0, 0, 0], to: [0, ridge, 0], label: formatLength(ridge, unit) },
    {
      id: 'eave',
      from: [halfW, 0, halfL],
      to: [halfW, eave, halfL],
      label: formatLength(eave, unit),
    },
  ]

  // The pod pushes the structure back further than the roof does, so the
  // camera has to frame the deeper of the two.
  const rearExtent = spec.ensuite === 'rear' ? halfL + spec.ensuiteDepth : Math.abs(roofBack)

  return {
    parts,
    dimensions,
    radius: Math.hypot(halfW + verandaDepth, Math.max(roofFront, rearExtent)) + 0.6,
    height: ridge + 0.5,
  }
}

/**
 * Keeps only the parts of an arc that fall on the front and rear faces —
 * used when the long sides are rolled up and no longer carry cloth.
 */
function clipToEnds(
  arc: { start: number; end: number },
  face: { right: readonly [number, number]; left: readonly [number, number] },
): Array<{ start: number; end: number }> {
  const blocked = [face.right, face.left]
  let pieces = [arc]

  for (const [blockStart, blockEnd] of blocked) {
    pieces = pieces.flatMap((piece) => {
      const overlapStart = Math.max(piece.start, blockStart)
      const overlapEnd = Math.min(piece.end, blockEnd)
      if (overlapStart >= overlapEnd) return [piece]

      const kept: Array<{ start: number; end: number }> = []
      if (piece.start < overlapStart) kept.push({ start: piece.start, end: overlapStart })
      if (overlapEnd < piece.end) kept.push({ start: overlapEnd, end: piece.end })
      return kept
    })
  }

  return pieces.filter((piece) => piece.end - piece.start > 1e-4)
}
