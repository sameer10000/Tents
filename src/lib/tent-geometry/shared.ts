import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Matrix4,
  Quaternion,
  Vector3,
  type Vector3Tuple,
} from 'three'
import type { ColorPart } from '../../data/tent-config'

/**
 * Shared builders for the parametric tent models.
 *
 * Everything here is pure: a specification goes in, a list of `TentPart`s comes
 * out. Nothing touches React, and nothing knows what colour anything will be —
 * a part only declares *which* surface it is, and the viewport resolves that
 * against the user's palette. The same model therefore drives the matte,
 * photoreal and blueprint styles without being rebuilt.
 *
 * The world is metres, Y is up, and every structure is centred on the origin
 * with its door facing +Z (towards the default camera).
 */

/** Which colour slot a part draws from, plus the fixed non-palette surfaces. */
export type PartSurface = ColorPart | 'mesh' | 'glass' | 'interior' | 'rope'

/** Drives material choice: sheen, roughness, whether it is a solid or a line. */
export type PartRole = 'canvas' | 'metal' | 'timber' | 'mesh' | 'glass' | 'rope'

export interface TentPart {
  id: string
  surface: PartSurface
  role: PartRole
  geometry: BufferGeometry
  /** Canvas has no back face to cull — you can stand inside it. */
  doubleSide?: boolean
  opacity?: number
}

/** A measured callout, drawn only in the blueprint style. */
export interface DimensionLine {
  id: string
  from: Vector3Tuple
  to: Vector3Tuple
  label: string
}

export interface TentModel {
  parts: TentPart[]
  dimensions: DimensionLine[]
  /** Widest horizontal extent and total height — the camera frames from this. */
  radius: number
  height: number
}

/* ── Primitives ─────────────────────────────────────────────────────────── */

export const TAU = Math.PI * 2

/** Theta is measured from +Z, so theta = 0 is the front of every structure. */
export function onCircle(radius: number, theta: number, y: number): Vector3 {
  return new Vector3(radius * Math.sin(theta), y, radius * Math.cos(theta))
}

/**
 * Builds a surface from a grid of points, `rows × cols`, two triangles per
 * cell. Rows run along one parameter, columns the other; winding is consistent
 * so normals come out facing the same way across the whole sheet.
 */
export function surfaceFromGrid(grid: Vector3[][]): BufferGeometry {
  const rows = grid.length
  const cols = grid[0].length
  const positions = new Float32Array(rows * cols * 3)
  const uvs = new Float32Array(rows * cols * 2)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const p = grid[r][c]
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      uvs[i * 2] = c / (cols - 1)
      uvs[i * 2 + 1] = r / (rows - 1)
    }
  }

  const indices: number[] = []
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c
      const b = a + 1
      const d = (r + 1) * cols + c
      const e = d + 1
      indices.push(a, d, b, b, d, e)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** A flat sheet from four corners, wound a → b → c → d. */
export function quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3): BufferGeometry {
  return surfaceFromGrid([
    [a, b],
    [d, c],
  ])
}

/** Merges several geometries into one part. Cheaper than one mesh per panel. */
export function mergeGeometries(list: BufferGeometry[]): BufferGeometry {
  const usable = list.filter((g) => g.getAttribute('position'))
  if (usable.length === 1) return usable[0]

  let vertexCount = 0
  let indexCount = 0
  for (const g of usable) {
    vertexCount += g.getAttribute('position').count
    indexCount += g.getIndex()?.count ?? 0
  }

  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)
  const indices = new Uint32Array(indexCount)

  let vOffset = 0
  let iOffset = 0
  for (const g of usable) {
    const pos = g.getAttribute('position')
    const nor = g.getAttribute('normal')
    const uv = g.getAttribute('uv')
    const idx = g.getIndex()

    positions.set(pos.array as Float32Array, vOffset * 3)
    if (nor) normals.set(nor.array as Float32Array, vOffset * 3)
    if (uv) uvs.set(uv.array as Float32Array, vOffset * 2)
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices[iOffset + i] = idx.getX(i) + vOffset
      iOffset += idx.count
    }
    vOffset += pos.count
  }

  const merged = new BufferGeometry()
  merged.setAttribute('position', new BufferAttribute(positions, 3))
  merged.setAttribute('normal', new BufferAttribute(normals, 3))
  merged.setAttribute('uv', new BufferAttribute(uvs, 2))
  merged.setIndex(new BufferAttribute(indices, 1))
  return merged
}

/** A capsule-free strut between two points — poles, ridges, guy ropes. */
export function strut(from: Vector3, to: Vector3, radius: number): BufferGeometry {
  return taperedStrut(from, to, radius, radius)
}

/** As `strut`, but thinning from one end to the other — limbs, mostly. */
export function taperedStrut(
  from: Vector3,
  to: Vector3,
  radiusFrom: number,
  radiusTo: number,
  segments = 8,
): BufferGeometry {
  const direction = new Vector3().subVectors(to, from)
  const length = direction.length()
  if (length < 1e-6) return new BufferGeometry()

  // CylinderGeometry's first radius is its +Y end, which the rotation below
  // maps onto `to`.
  const geometry = new CylinderGeometry(radiusTo, radiusFrom, length, segments, 1)

  // CylinderGeometry stands on Y; swing it onto the from→to axis.
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  )
  geometry.applyMatrix4(new Matrix4().makeRotationFromQuaternion(rotation))

  const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5)
  geometry.translate(mid.x, mid.y, mid.z)
  return geometry
}

/* ── Angular openings ───────────────────────────────────────────────────── */

export interface AngularRange {
  start: number
  end: number
}

/** An opening, as a centre angle and a half-width in radians. */
export interface Opening {
  center: number
  half: number
}

/**
 * Returns the arcs of a full circle that survive once the openings are removed.
 * This is how a door becomes a real gap in a wall rather than a painted panel.
 */
export function arcsBetween(openings: Opening[], period = TAU): AngularRange[] {
  if (!openings.length) return [{ start: 0, end: period }]

  const sorted = [...openings].sort((a, b) => a.center - b.center)
  const arcs: AngularRange[] = []

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const isLast = i + 1 === sorted.length
    const next = isLast ? sorted[0] : sorted[i + 1]

    const start = current.center + current.half
    const end = (isLast ? next.center + period : next.center) - next.half
    if (end - start > 1e-4 * period) arcs.push({ start, end })
  }

  return arcs
}

/**
 * Evenly spaced positions around a loop that clear every opening.
 *
 * `period` is `TAU` for angles and `1` for normalised perimeter distance, so
 * this serves circular and rectangular plans alike.
 */
export function spacedAngles(
  count: number,
  openings: Opening[],
  clearance = 0.18,
  period = TAU,
): number[] {
  if (count <= 0) return []

  const gaps = arcsBetween(openings, period).map((arc) => ({
    start: arc.start + clearance,
    end: arc.end - clearance,
  }))
  const usable = gaps.filter((gap) => gap.end > gap.start)
  if (!usable.length) return []

  const totalSpan = usable.reduce((sum, gap) => sum + (gap.end - gap.start), 0)
  const angles: number[] = []

  // Walk the usable span as one continuous line, dropping a marker at each
  // even division, then map back onto whichever gap that distance lands in.
  for (let i = 0; i < count; i++) {
    let distance = (totalSpan * (i + 0.5)) / count
    for (const gap of usable) {
      const span = gap.end - gap.start
      if (distance <= span) {
        angles.push(gap.start + distance)
        break
      }
      distance -= span
    }
  }

  return angles
}

/* ── Ground plans ───────────────────────────────────────────────────────── */

/**
 * A closed ground plan, addressed by normalised distance around its perimeter.
 *
 * Round, oval and rectangular structures all reduce to this, so one wall
 * builder covers every family — and a door is just a range of `u` removed.
 * `u = 0` is always the middle of the front face, facing +Z.
 */
export interface Loop {
  at: (u: number) => Vector3
  perimeter: number
}

/** Samples a closed polyline by arc length. */
export function polylineLoop(points: Vector3[]): Loop {
  const lengths: number[] = []
  let perimeter = 0
  for (let i = 0; i < points.length; i++) {
    const segment = points[(i + 1) % points.length].distanceTo(points[i])
    lengths.push(segment)
    perimeter += segment
  }

  return {
    perimeter,
    at(u) {
      let distance = (((u % 1) + 1) % 1) * perimeter
      for (let i = 0; i < points.length; i++) {
        if (distance <= lengths[i] || i === points.length - 1) {
          const t = lengths[i] > 1e-9 ? distance / lengths[i] : 0
          return points[i].clone().lerp(points[(i + 1) % points.length], t)
        }
        distance -= lengths[i]
      }
      return points[0].clone()
    },
  }
}

/* Every loop is walked the same way — front, +X side, rear, -X side — so the
   outward normal in `wallBand` is correct for all of them. */

export function circleLoop(radius: number): Loop {
  return {
    perimeter: TAU * radius,
    at: (u) => onCircle(radius, (((u % 1) + 1) % 1) * TAU, 0),
  }
}

/** Two semicircular ends joined by straight sides — the Burgundian plan. */
export function stadiumLoop(length: number, width: number, quarter = 8): Loop {
  const radius = width / 2
  const straight = Math.max(length - width, 0) / 2
  const points: Vector3[] = []
  const capPoint = (theta: number, zOffset: number) =>
    new Vector3(radius * Math.sin(theta), 0, zOffset + radius * Math.cos(theta))

  // Front quarter: centre front round to the +X straight.
  for (let i = 0; i <= quarter; i++) {
    points.push(capPoint((Math.PI / 2) * (i / quarter), straight))
  }
  // Rear cap, +X round to -X.
  for (let i = 1; i <= quarter * 2; i++) {
    points.push(capPoint(Math.PI / 2 + Math.PI * (i / (quarter * 2)), -straight))
  }
  // Closing front quarter, stopping short of the start point.
  for (let i = 1; i < quarter; i++) {
    points.push(capPoint((Math.PI * 3) / 2 + (Math.PI / 2) * (i / quarter), straight))
  }

  return polylineLoop(points)
}

/** Rectangle, walked from the middle of the front edge. */
export function rectLoop(length: number, width: number): Loop {
  const x = width / 2
  const z = length / 2
  return polylineLoop([
    new Vector3(0, 0, z),
    new Vector3(x, 0, z),
    new Vector3(x, 0, -z),
    new Vector3(-x, 0, -z),
    new Vector3(-x, 0, z),
  ])
}

/**
 * A wall standing on part of a ground plan.
 *
 * `bottom` and `top` are functions of `u` so a valance can be scalloped or
 * dagged simply by varying where the cloth ends.
 */
export function wallBand(
  loop: Loop,
  uStart: number,
  uEnd: number,
  bottom: (u: number) => number,
  top: (u: number) => number,
  options: { cols?: number; outset?: number; rows?: number } = {},
): BufferGeometry {
  const span = uEnd - uStart
  const cols = options.cols ?? Math.max(3, Math.ceil(Math.abs(span) * loop.perimeter * 4))
  const rows = options.rows ?? 2
  const outset = options.outset ?? 0

  const grid: Vector3[][] = []
  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1)
    const row: Vector3[] = []
    for (let c = 0; c < cols; c++) {
      const u = uStart + span * (c / (cols - 1))
      const base = loop.at(u)
      if (outset) {
        const ahead = loop.at(u + 0.002)
        const behind = loop.at(u - 0.002)
        const tangent = new Vector3().subVectors(ahead, behind).normalize()
        const normal = new Vector3(-tangent.z, 0, tangent.x).multiplyScalar(outset)
        base.add(normal)
      }
      base.y = bottom(u) + (top(u) - bottom(u)) * v
      row.push(base)
    }
    grid.push(row)
  }
  return surfaceFromGrid(grid)
}

/** Fills a ground plan — a fan from the centroid out to the loop. */
export function floorFromLoop(loop: Loop, y = 0.015, segments = 64): BufferGeometry {
  const centre = new Vector3(0, y, 0)
  const grid: Vector3[][] = [[], []]
  for (let i = 0; i <= segments; i++) {
    const edge = loop.at(i / segments)
    grid[0].push(centre.clone())
    grid[1].push(new Vector3(edge.x, y, edge.z))
  }
  return surfaceFromGrid(grid)
}

/* ── Canvas behaviour ───────────────────────────────────────────────────── */

/**
 * Catenary droop, normalised to 0…1 across a span. Real canvas never pulls
 * dead flat between two fixings, and the sag is most of what separates a tent
 * from a paper model.
 */
export function sagAt(t: number, amount: number): number {
  return -Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) * amount
}

/** Panel resolution — enough to curve, few enough to stay light on a phone. */
export const SEG = { arc: 6, height: 4, panel: 8 } as const
