import { BufferGeometry, ConeGeometry, SphereGeometry, Vector3 } from 'three'
import type { LengthUnit, MedievalSpec } from '../../data/tent-config'
import { formatLength, isRoundPlan, isSquarePlan } from '../../data/tent-config'
import { scallopProfile } from '../../data/scallops'
import type { DimensionLine, Loop, Opening, TentModel, TentPart } from './shared'
import {
  TAU,
  arcsBetween,
  circleLoop,
  floorFromLoop,
  mergeGeometries,
  onCircle,
  polylineLoop,
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
 * The medieval pavilion, in eleven historic forms.
 *
 * Gores are built individually rather than textured, so an alternating cut is
 * real geometry: each panel is its own surface, and the two colours are two
 * merged meshes. That is also why the valance can be scalloped or dagged — the
 * cloth genuinely ends at a different height as you walk round it.
 *
 * The forms differ in three things only — the ground plan, the roof, and what
 * holds it up — so each of those is a small builder below and the form picks
 * from them. Anything shared (walls, valance, braid, door, floor) is cut once
 * and serves all eleven.
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

  const form = spec.form
  const pitch = (spec.roofPitch * Math.PI) / 180
  const wallTop = spec.wallHeight
  const roundPlan = isRoundPlan(form)
  const squarePlan = isSquarePlan(form)
  /** Two masts and a run of straight cloth between them, on a stadium plan. */
  const doubleEnded = form === 'oval' || form === 'double-bell-wedge' || form === 'tudor'
  /** A ridge tent: two straight slopes and a gable at each end. */
  const wedgeLike = form === 'wedge' || form === 'geteld'

  /* ── Plan ─────────────────────────────────────────────────────────────── */

  const radius = spec.diameter / 2

  /**
   * The Tudor is two round pavilions joined by a covered gallery, and the
   * makers quote that gallery at eleven feet whatever the pavilions measure.
   * So it is a constant of the design rather than another control: the gallery
   * is the clear span between the two pavilions, which puts their centres a
   * diameter and a gallery apart and makes the whole thing two diameters and a
   * gallery long.
   */
  const TUDOR_GALLERY = 3.3528

  // A square pavilion is driven by one side length; every other plan has two.
  const length = squarePlan
    ? spec.width
    : form === 'tudor'
      ? spec.diameter * 2 + TUDOR_GALLERY
      : spec.length
  const width = form === 'tudor' ? spec.diameter : spec.width
  const halfW = width / 2
  const halfL = length / 2
  /** Half the straight run between the two masts of a double-ended plan. */
  const straight = Math.max(length - width, 0) / 2
  /** Half the ridge of a hipped roof — a hip eats a half-width at each end. */
  const ridgeHalf = Math.max(halfL - halfW, 0)

  /**
   * The Imperial is a marquee: a long straight ridge with the cloth falling
   * from it on every side. Its corners are cut off rather than square, which
   * is what gives the eave its many-sided line and the ends their broad rake.
   */
  const imperialCut = Math.min(halfW, halfL) * 0.45
  const imperialPlan = [
    new Vector3(0, 0, halfL),
    new Vector3(halfW - imperialCut, 0, halfL),
    new Vector3(halfW, 0, halfL - imperialCut),
    new Vector3(halfW, 0, -(halfL - imperialCut)),
    new Vector3(halfW - imperialCut, 0, -halfL),
    new Vector3(-(halfW - imperialCut), 0, -halfL),
    new Vector3(-halfW, 0, -(halfL - imperialCut)),
    new Vector3(-halfW, 0, halfL - imperialCut),
    new Vector3(-(halfW - imperialCut), 0, halfL),
  ]

  let loop: Loop
  let footprint: { x: number; z: number }

  if (form === 'tudor') {
    // Two round pavilions and the gallery between them read as one capsule.
    loop = stadiumLoop(length, width)
    footprint = { x: halfW, z: halfL }
  } else if (roundPlan) {
    loop = circleLoop(radius)
    footprint = { x: radius, z: radius }
  } else if (doubleEnded) {
    loop = stadiumLoop(length, width)
    footprint = { x: halfW, z: halfL }
  } else if (form === 'imperial') {
    loop = polylineLoop(imperialPlan)
    footprint = { x: halfW, z: halfL }
  } else {
    loop = rectLoop(length, width)
    footprint = { x: halfW, z: halfL }
  }

  /** What a plain cone or ridge would reach at this pitch. */
  const baseRise = (roundPlan ? radius : halfW) * Math.tan(pitch)
  // Only the Regent stands taller than its pitch alone allows, carrying a
  // crown above the roof proper.
  const extraRise = form === 'regent' ? baseRise * 0.45 : 0

  const apex = wallTop + baseRise + extraRise
  const rise = apex - wallTop

  /**
   * Where the Tudor's gallery roof sits: well below both pavilions, so each
   * cone shows its face above it, as they do on the real thing.
   */
  const galleryY = wallTop + rise * 0.42
  /** Half the Imperial's ridge — the run of it between the two masts. */
  const imperialRidgeZ = Math.max(halfL - halfW, halfL * 0.3)

  /* ── Anglo Saxon ──────────────────────────────────────────────────────── */

  if (form === 'saxon') {
    // An inverted V and nothing else: two flat sheets of cloth meeting along a
    // ridge and running straight to the ground. No walls, no valance, no
    // gables, no frame — the shape is the whole of the tent, so it is built
    // here and returns before any of the pavilion fittings are cut.
    //
    // It lies across the plan, its ridge running the long way on X, and the
    // ridge stands at whatever the pitch makes of the half-width.
    const ridgeY = halfW * Math.tan(pitch)
    const striped = spec.stripe === 'alternating'
    const bays = Math.max(4, Math.round(length / 0.7))
    const first: BufferGeometry[] = []
    const second: BufferGeometry[] = []

    /**
     * The entrance: the middle of the front sheet lifted off the ground and
     * propped out on two rods, which opens the tent and shades the doorway.
     *
     * The cloth cannot stretch, so the canopy reaches exactly as far as that
     * sheet is long — its slant from ridge to ground — less whatever it gives
     * up dropping from the ridge to the rod tops.
     */
    const flapHalf = Math.min(halfL * 0.62, halfL - 0.25)
    const slant = Math.hypot(halfW, ridgeY)
    const rodY = ridgeY * 0.82
    const reach = Math.sqrt(Math.max(slant * slant - (ridgeY - rodY) ** 2, 0.04))

    for (let i = 0; i < bays; i++) {
      const x0 = -halfL + (length * i) / bays
      const x1 = -halfL + (length * (i + 1)) / bays
      for (const side of [1, -1]) {
        // The front sheet is absent across the entrance — that cloth is the
        // canopy now, hinged at the ridge and lying overhead.
        if (side > 0 && x0 >= -flapHalf && x1 <= flapHalf) continue

        const grid: Vector3[][] = []
        for (let r = 0; r <= 2; r++) {
          const t = r / 2
          const row: Vector3[] = []
          for (let c = 0; c <= 2; c++) {
            const x = x0 + (x1 - x0) * (c / 2)
            row.push(new Vector3(x, ridgeY * t, side * halfW * (1 - t)))
          }
          grid.push(row)
        }
        ;(striped && i % 2 === 1 ? second : first).push(surfaceFromGrid(grid))
      }
    }

    /**
     * The two ends, closed with a flared panel each.
     *
     * The cloth is cut with more width than the end needs, so pegging it out
     * bellies it away from the tent: it leaves the ridge at a point, swells
     * out past the end of the body, and comes to ground on a curve. At the
     * two side seams it has no belly left, which is what lets it meet the
     * side sheets flush instead of leaving a gap to lace up.
     */
    const flare = halfW * 0.6
    const endCols = 14
    const endRows = 5

    for (const end of [1, -1]) {
      const tip = new Vector3(end * halfL, ridgeY, 0)
      const grid: Vector3[][] = []

      for (let r = 0; r <= endRows; r++) {
        const t = r / endRows
        const row: Vector3[] = []
        for (let c = 0; c <= endCols; c++) {
          const across = -1 + 2 * (c / endCols)
          const foot = new Vector3(
            end * (halfL + flare * Math.cos((across * Math.PI) / 2)),
            0,
            across * halfW,
          )
          row.push(foot.lerp(tip, t))
        }
        grid.push(row)
      }
      first.push(surfaceFromGrid(grid))
    }

    push('roof', 'roof', 'canvas', mergeGeometries(first), { doubleSide: true })
    if (second.length) {
      push('roof-alt', 'roofAlt', 'canvas', mergeGeometries(second), { doubleSide: true })
    }

    // The lifted cloth itself, still hanging off the ridge it was cut at. It
    // is the same sheet as the rest of the tent, so it takes the same colour.
    push(
      'awning',
      'roof',
      'canvas',
      surfaceFromGrid([
        [new Vector3(-flapHalf, ridgeY, 0), new Vector3(flapHalf, ridgeY, 0)],
        [new Vector3(-flapHalf, rodY, reach), new Vector3(flapHalf, rodY, reach)],
      ]),
      { doubleSide: true },
    )

    // An A-frame at each end — two units — and one ridge pole lying in their
    // crotches and running out past both. The poles cross above the cloth and
    // carry on past the crossing, and their feet stand clear of the cloth.
    const footZ = halfW * 1.1
    const topZ = halfW * 0.22
    // Set so the two poles cross exactly on the ridge line.
    const poleTop = ridgeY * (footZ + topZ) / footZ
    const timber: BufferGeometry[] = []

    for (const end of [1, -1]) {
      for (const side of [1, -1]) {
        timber.push(
          strut(
            new Vector3(end * halfL, 0, side * footZ),
            new Vector3(end * halfL, poleTop, -side * topZ),
            0.045,
          ),
        )
      }
    }
    timber.push(
      strut(
        new Vector3(halfL + 0.3, ridgeY, 0),
        new Vector3(-halfL - 0.3, ridgeY, 0),
        0.04,
      ),
    )

    // The two rods under the lifted cloth, footed a little wider than they
    // stand so they lean into the load, and carrying on past the corner.
    for (const side of [1, -1]) {
      timber.push(
        strut(
          new Vector3(side * flapHalf * 1.1, 0, reach + 0.12),
          new Vector3(side * flapHalf, rodY + 0.14, reach),
          0.032,
        ),
      )
    }
    push('frame', 'frame', 'timber', mergeGeometries(timber))

    return {
      parts,
      dimensions: [
        {
          id: 'length',
          from: [-halfL, 0, halfW],
          to: [halfL, 0, halfW],
          label: formatLength(length, unit),
        },
        {
          id: 'width',
          from: [halfL, 0, -halfW],
          to: [halfL, 0, halfW],
          label: formatLength(width, unit),
        },
        { id: 'apex', from: [0, 0, 0], to: [0, ridgeY, 0], label: formatLength(ridgeY, unit) },
      ],
      // The flared ends and the propped canopy both reach past the body.
      radius: Math.hypot(halfL + flare, Math.max(footZ, reach + 0.2)) + 1.2,
      height: poleTop + 0.6,
    }
  }

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
  // profile usable at every wall height. A pavilion pitched straight to the
  // ground has no drop at all to give it.
  const depth = Math.min(profile.depth, Math.max(0, wallTop - 0.08))

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
  // further out than the valance so it stands proud of the cloth. A pavilion
  // with no valance to speak of has no cut edge to run it along, and a cord
  // lying flat on the ground is worse than no cord.
  if (spec.braid && depth > 0.02) {
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

  /**
   * A gored cone over a circular plan.
   *
   * The profile maps 0…1, eave to peak, onto a radius and a height — which is
   * all that separates a plain cone from the Regent's crown and the Tudor's
   * ogee. Each gore bellies out between its seams; the cut is not flat.
   */
  const goredCone = (
    count: number,
    profileR: (t: number) => number,
    profileY: (t: number) => number,
    options: { arch?: boolean; rows?: number } = {},
  ) => {
    const rows = options.rows ?? 5
    for (let i = 0; i < count; i++) {
      const uStart = i / count
      const uEnd = (i + 1) / count
      const grid: Vector3[][] = []
      for (let r = 0; r <= rows; r++) {
        const v = r / rows
        const row: Vector3[] = []
        for (let c = 0; c <= 5; c++) {
          const u = uStart + (uEnd - uStart) * (c / 5)
          const base = options.arch === false ? 0 : archAtU(u)
          const t = base + (1 - base) * v
          const seam = profileR(t)
          const belly = Math.sin(Math.PI * (c / 5)) * seam * 0.028
          row.push(onCircle(seam + belly, u * TAU, profileY(t)))
        }
        grid.push(row)
      }
      bucket(i).push(surfaceFromGrid(grid))
    }
  }

  /**
   * The A-frame roof of a ridge tent: two straight slopes from the eave up to
   * the ridge, split into bays so an alternating cut has something to
   * alternate. `bow` pushes the cross-section outward — the Saxon's curve.
   */
  const aFrame = (sag: number, from = -halfL, to = halfL) => {
    const span = to - from
    const bays = Math.max(2, Math.round(span / 0.9))
    for (let i = 0; i < bays; i++) {
      const z0 = from + (span * i) / bays
      const z1 = from + (span * (i + 1)) / bays
      for (const side of [1, -1]) {
        const grid: Vector3[][] = []
        for (let r = 0; r <= 3; r++) {
          const t = r / 3
          const row: Vector3[] = []
          for (let c = 0; c <= 2; c++) {
            const z = z0 + (z1 - z0) * (c / 2)
            row.push(
              new Vector3(side * halfW * (1 - t), wallTop + rise * t + sagAt(t, sag), z),
            )
          }
          grid.push(row)
        }
        bucket(i).push(surfaceFromGrid(grid))
      }
    }
    return bays
  }

  /**
   * A marquee roof: every point of the ground plan drawn up to the nearest
   * point of a level ridge.
   *
   * One loft covers the straight sides and the raked ends alike — along the
   * sides each panel rises to the ridge directly above it, and past the ends
   * of the ridge they all converge on its last point. The ridge itself stays
   * dead straight, which is the whole character of an Imperial.
   */
  const ridgeLoft = (ridgeZ: number, panels: number, sag: number) => {
    for (let p = 0; p < panels; p++) {
      const grid: Vector3[][] = []
      for (let r = 0; r <= 4; r++) {
        const v = r / 4
        const row: Vector3[] = []
        for (let c = 0; c <= 4; c++) {
          const u = (p + c / 4) / panels
          const base = archAtU(u)
          const t = base + (1 - base) * v
          const foot = loop.at(u)
          const onRidge = Math.max(-ridgeZ, Math.min(ridgeZ, foot.z))
          row.push(
            new Vector3(
              foot.x * (1 - t),
              wallTop + rise * t + sagAt(t, sag),
              foot.z + (onRidge - foot.z) * t,
            ),
          )
        }
        grid.push(row)
      }
      bucket(p).push(surfaceFromGrid(grid))
    }
  }

  /**
   * A complete round pavilion standing at `zCentre` — the Tudor's halves.
   *
   * Built whole rather than as a half-cone, because that is what it is: two
   * round tents that can be pitched on their own. The gallery roof runs in
   * under their flanks, which is exactly how the two meet on the real thing.
   */
  const pavilion = (zCentre: number, count: number, index: number) => {
    for (let i = 0; i < count; i++) {
      const uStart = i / count
      const uEnd = (i + 1) / count
      const grid: Vector3[][] = []
      for (let r = 0; r <= 5; r++) {
        const v = r / 5
        const row: Vector3[] = []
        for (let c = 0; c <= 5; c++) {
          const u = uStart + (uEnd - uStart) * (c / 5)
          // Only the front pavilion carries the entry.
          const base = zCentre > 0 ? archAtU(u) : 0
          const t = base + (1 - base) * v
          const seam = halfW * (1 - t)
          const belly = Math.sin(Math.PI * (c / 5)) * seam * 0.028
          const point = onCircle(
            seam + belly,
            u * TAU,
            wallTop + rise * t + sagAt(t, rise * 0.025),
          )
          row.push(new Vector3(point.x, point.y, point.z + zCentre))
        }
        grid.push(row)
      }
      bucket(index + i).push(surfaceFromGrid(grid))
    }
  }

  /**
   * The cloth closing off a gable end, following whatever curve the roof
   * takes. The front one is cut round the door when the walls are too low to
   * carry it on their own.
   */
  const gable = (zEnd: number) => {
    const isFront = zEnd > 0
    const cut = isFront && archT > 0 ? Math.min(doorWidth / 2, halfW * 0.8) : 0
    /** A point on the gable's raked edge, `t` running eave to ridge. */
    const edge = (t: number, side: number) =>
      new Vector3(side * halfW * (1 - t), wallTop + rise * t, zEnd)

    if (!cut) {
      const steps = [0, 0.3, 0.6, 0.85, 1]
      for (let i = 0; i < steps.length - 1; i++) {
        const a = steps[i]
        const b = steps[i + 1]
        primary.push(quad(edge(a, -1), edge(a, 1), edge(b, 1), edge(b, -1)))
      }
      return
    }

    // Two panels either side of the arched entry, a spanner over its head,
    // then the gable closes as normal above it.
    for (const side of [1, -1]) {
      primary.push(
        quad(
          new Vector3(side * cut, wallTop, zEnd),
          edge(0, side),
          edge(0.45, side),
          new Vector3(side * cut * 0.7, doorTop, zEnd),
        ),
      )
    }
    primary.push(
      quad(
        new Vector3(-cut * 0.7, doorTop, zEnd),
        new Vector3(cut * 0.7, doorTop, zEnd),
        edge(0.45, 1),
        edge(0.45, -1),
      ),
    )
    primary.push(quad(edge(0.45, -1), edge(0.45, 1), edge(0.8, 1), edge(0.8, -1)))
    primary.push(quad(edge(0.8, -1), edge(0.8, 1), edge(1, 1), edge(1, -1)))
  }

  /**
   * A gored half-cone capping one end of a double-ended plan.
   *
   * `curve` below 1 carries the cloth out past a straight cone on its way down
   * — the flared skirt that makes an end a bell rather than a cone.
   */
  const bellCap = (
    end: 1 | -1,
    count: number,
    index: number,
    flare: number,
    curve = 1,
    sag = rise * 0.02,
  ) => {
    const zMast = end * straight
    const cols = 6

    // The entry falls on the front cap, so that is where the cloth has to be
    // cut away — on a pavilion pitched straight to the ground the walls carry
    // no door at all, and the cone would otherwise close over the entrance.
    const doorSweep = Math.min(doorWidth / 2 / Math.max(halfW, 0.4), 0.85)
    const archAtTheta = (theta: number) => {
      if (archT <= 0 || end < 0) return 0
      const delta = Math.abs(theta - Math.PI / 2)
      if (delta >= doorSweep) return 0
      return archT * Math.cos((Math.PI / 2) * (delta / doorSweep))
    }

    for (let i = 0; i < count; i++) {
      const a0 = (Math.PI * i) / count
      const a1 = (Math.PI * (i + 1)) / count
      const grid: Vector3[][] = []
      for (let r = 0; r <= 4; r++) {
        const v = r / 4
        const row: Vector3[] = []
        for (let c = 0; c <= cols; c++) {
          const theta = a0 + (a1 - a0) * (c / cols)
          const base = archAtTheta(theta)
          const t = base + (1 - base) * v
          const seam = halfW * Math.pow(1 - t, curve)
          const signed = end > 0 ? theta - Math.PI / 2 : theta + Math.PI / 2
          const belly = Math.sin(Math.PI * (c / cols)) * halfW * flare * (1 - t)
          const point = onCircle(seam + belly, signed, wallTop + rise * t + sagAt(t, sag))
          row.push(new Vector3(point.x, point.y, point.z + zMast))
        }
        grid.push(row)
      }
      bucket(index + i).push(surfaceFromGrid(grid))
    }
  }

  /**
   * The centre bay of a double-ended plan, run between the two masts. The
   * ridge is a function of z, because the Imperial's swags and the others' do
   * not.
   */
  const ridgedCentre = (ridgeY: (z: number) => number, sag: number) => {
    if (straight <= 1e-6) return
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
            const top = ridgeY(z)
            row.push(
              new Vector3(
                side * halfW * (1 - t),
                wallTop + (top - wallTop) * t + sagAt(t, sag),
                z,
              ),
            )
          }
          grid.push(row)
        }
        bucket(i).push(surfaceFromGrid(grid))
      }
    }
  }

  /** A four-sided pyramid — the square pavilion's roof. */
  const pyramid = () => {
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
          const point = corner.clone().lerp(next, c / 3).lerp(new Vector3(0, apex, 0), t)
          point.y += sagAt(t, rise * 0.03)
          row.push(point)
        }
        grid.push(row)
      }
      bucket(i).push(surfaceFromGrid(grid))
    })
  }

  /** A hipped roof: a ridge down the length, raked back at both ends. */
  const hipped = () => {
    const bays = Math.max(3, Math.round(length / 1.1))
    const drop = (t: number) => wallTop + rise * t + sagAt(t, rise * 0.025)
    /** How far the ridge line has pulled in from the eave at height `t`. */
    const zAt = (t: number) => halfL - (halfL - ridgeHalf) * t

    // The two long slopes, each a trapezoid split into bays along the ridge.
    for (const side of [1, -1]) {
      for (let i = 0; i < bays; i++) {
        const grid: Vector3[][] = []
        for (let r = 0; r <= 3; r++) {
          const t = r / 3
          const span = zAt(t)
          const row: Vector3[] = []
          for (let c = 0; c <= 2; c++) {
            const f = (i + c / 2) / bays
            row.push(new Vector3(side * halfW * (1 - t), drop(t), -span + 2 * span * f))
          }
          grid.push(row)
        }
        bucket(i).push(surfaceFromGrid(grid))
      }
    }

    // The two hips, each closing an end down onto the eave.
    for (const [index, end] of [1, -1].entries()) {
      const grid: Vector3[][] = []
      for (let r = 0; r <= 3; r++) {
        const t = r / 3
        const x = halfW * (1 - t)
        const row: Vector3[] = []
        for (let c = 0; c <= 3; c++) {
          row.push(new Vector3(-x + 2 * x * (c / 3), drop(t), end * zAt(t)))
        }
        grid.push(row)
      }
      bucket(bays + index).push(surfaceFromGrid(grid))
    }
  }

  /* ── Roof, per form ───────────────────────────────────────────────────── */

  const capGores = Math.max(4, Math.round(spec.gores / 2))

  if (form === 'round') {
    goredCone(
      spec.gores,
      (t) => radius * (1 - t),
      (t) => wallTop + rise * t + sagAt(t, rise * 0.025),
    )
  } else if (form === 'regent') {
    // Two tiers: the roof proper, a short vertical crown that vents it, and a
    // cap over the top. The crown is what makes a Regent a Regent.
    const crownR = radius * 0.4
    const shoulder = wallTop + rise * 0.55
    const crownTop = wallTop + rise * 0.66

    goredCone(
      spec.gores,
      (t) => radius + (crownR - radius) * t,
      (t) => wallTop + (shoulder - wallTop) * t + sagAt(t, rise * 0.02),
    )
    push(
      'crown',
      'roof',
      'canvas',
      wallBand(circleLoop(crownR), 0, 1, () => shoulder, () => crownTop, {
        cols: 96,
        rows: 2,
      }),
      { doubleSide: true },
    )
    goredCone(
      spec.gores,
      (t) => crownR * (1 - t),
      (t) => crownTop + (apex - crownTop) * t,
      { arch: false, rows: 3 },
    )
  } else if (form === 'tudor') {
    // Two round pavilions joined by a covered gallery, roofed well below both
    // of them so each pavilion stands clear above it.
    ridgedCentre(() => galleryY, rise * 0.012)
    pavilion(straight, spec.gores, 0)
    pavilion(-straight, spec.gores, spec.gores)
  } else if (form === 'oval') {
    bellCap(1, capGores, 0, 0.02)
    bellCap(-1, capGores, capGores, 0.02)
    ridgedCentre(() => apex, rise * 0.02)
  } else if (form === 'double-bell-wedge') {
    // A wedge with a bell at each end: the ends flare out to a proper skirt,
    // and the centre is pulled taut over the ridge pole and stays dead
    // straight. That is what separates it from the oval, which is smooth all
    // the way round.
    bellCap(1, capGores + 1, 0, 0.04, 0.86, rise * 0.008)
    bellCap(-1, capGores + 1, capGores + 1, 0.04, 0.86, rise * 0.008)
    ridgedCentre(() => apex, rise * 0.006)
  } else if (form === 'imperial') {
    ridgeLoft(imperialRidgeZ, Math.max(10, spec.gores), rise * 0.02)
  } else if (form === 'square') {
    pyramid()
  } else if (form === 'rectangular') {
    hipped()
  } else if (form === 'wedge') {
    aFrame(rise * 0.015)
    gable(halfL)
    gable(-halfL)
  } else {
    // Viking geteld: the same slopes, but the cloth is thrown over a wooden
    // frame rather than tensioned, so it hangs slacker.
    aFrame(rise * 0.035)
    gable(halfL)
    gable(-halfL)
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

  /**
   * The head of the entry: the door head where the walls carry it, and the top
   * of the arch cut into the cloth where they do not. Filling exactly the hole
   * that was cut is what keeps the door out of the roof on a pavilion pitched
   * straight to the ground.
   */
  const doorHead = (u: number) => Math.min(doorTop, wallTop + rise * archAtU(u))

  if (spec.door === 'laced') {
    // A closed entry: the cloth stays, the lacing is drawn over it.
    push(
      'door',
      'door',
      'canvas',
      wallBand(loop, -doorHalfU, doorHalfU, () => 0, doorHead, {
        rows: 3,
        cols: 12,
        outset: 0.015,
      }),
      { doubleSide: true },
    )
    const lacing: BufferGeometry[] = []
    const head = doorHead(0)
    for (let i = 0; i < 7; i++) {
      const y = head * (0.12 + (i * 0.8) / 7)
      const left = loop.at(-doorHalfU * 0.55)
      const right = loop.at(doorHalfU * 0.55)
      lacing.push(
        strut(
          new Vector3(left.x, y, left.z),
          new Vector3(right.x, y + head * 0.05, right.z),
          0.012,
        ),
      )
    }
    push('lacing', 'rope', 'rope', mergeGeometries(lacing))
  } else {
    // The curtains are tied back against the cloth beside the entry, so they
    // can only stand as high as that cloth does. A pavilion pitched straight
    // to the ground has nothing to tie them to, and they fall away to nothing
    // rather than standing through the roof.
    const curtains = [1, -1].map((side) =>
      wallBand(loop, side * doorHalfU, side * doorHalfU * 1.5, () => 0, doorHead, {
        rows: 3,
        cols: 5,
        outset: 0.09,
      }),
    )
    push('door', 'door', 'canvas', mergeGeometries(curtains), { doubleSide: true })
  }

  /* ── Structure ────────────────────────────────────────────────────────── */

  /**
   * Where the roof actually peaks. A finial has to cap something, and half
   * these forms peak twice.
   */
  /** How far a projecting ridge pole runs out past the cloth it carries. */
  const overhang = 0.3

  /**
   * One pole in the middle holds it up. The Tudor is sized by diameter like
   * the other round plans but stands on two, one under each pavilion.
   */
  const singleMast = (roundPlan && form !== 'tudor') || form === 'square'

  const peaks: number[] = singleMast
    ? [0]
    : form === 'rectangular'
      ? [ridgeHalf, -ridgeHalf]
      : form === 'wedge'
        ? [halfL + overhang, -halfL - overhang]
        : // The double bell wedge's ridge runs past both masts too.
          form === 'double-bell-wedge'
          ? [straight + overhang, -straight - overhang]
          : form === 'imperial'
            ? [imperialRidgeZ, -imperialRidgeZ]
            : doubleEnded
              ? [straight, -straight]
              : // The geteld crosses its poles above the ridge; there is one
                // place a finial can sit, and it is the middle.
                [0]

  const frame: BufferGeometry[] = []

  /**
   * A mast pokes out above the cloth, so its finial sits higher than the ridge.
   * A projecting ridge pole, crossed poles and an internal frame do not.
   */
  const ridgeCarried = wedgeLike || form === 'double-bell-wedge'
  const hasMast = spec.frame === 'rope-and-pole' && !ridgeCarried

  if (spec.frame === 'rope-and-pole') {
    const mastTop = apex + 0.35

    if (singleMast) {
      frame.push(strut(new Vector3(0, 0, 0), new Vector3(0, mastTop, 0), 0.05))
    } else if (form === 'wedge' || form === 'double-bell-wedge') {
      // Two uprights carrying a ridge beam that runs out past the cloth at
      // both ends — the finials sit on the overhang.
      const mastZ = form === 'wedge' ? halfL : straight
      for (const z of new Set([mastZ, -mastZ])) {
        frame.push(strut(new Vector3(0, 0, z), new Vector3(0, apex, z), 0.04))
      }
      frame.push(
        strut(
          new Vector3(0, apex, mastZ + overhang),
          new Vector3(0, apex, -mastZ - overhang),
          0.04,
        ),
      )
    } else if (form === 'imperial') {
      // Two masts under a level ridge, which is the whole of the structure.
      for (const z of new Set([imperialRidgeZ, -imperialRidgeZ])) {
        frame.push(strut(new Vector3(0, 0, z), new Vector3(0, mastTop, z), 0.05))
      }
      frame.push(
        strut(
          new Vector3(0, apex, imperialRidgeZ),
          new Vector3(0, apex, -imperialRidgeZ),
          0.035,
        ),
      )
    } else if (doubleEnded || form === 'rectangular') {
      const mastZ = form === 'rectangular' ? ridgeHalf : straight
      for (const z of new Set([mastZ, -mastZ])) {
        frame.push(strut(new Vector3(0, 0, z), new Vector3(0, mastTop, z), 0.05))
      }
      // The Tudor's ridge pole is slung along its gallery, which sits well
      // below the two pavilions it joins.
      const ridgeY = form === 'tudor' ? galleryY : apex
      frame.push(strut(new Vector3(0, ridgeY, mastZ), new Vector3(0, ridgeY, -mastZ), 0.035))
    } else {
      // Viking geteld: crossed poles at each gable, with a ridge between them.
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

      // It is a wooden frame with cloth thrown over it rather than a cloth
      // pulled tight on a pole, so it carries side rails along the foot and
      // cross-beams tying the two gables together.
      for (const side of [1, -1]) {
        frame.push(
          strut(
            new Vector3(side * halfW * 0.9, 0.07, halfL),
            new Vector3(side * halfW * 0.9, 0.07, -halfL),
            0.035,
          ),
        )
      }
      for (let i = 1; i <= 4; i++) {
        const z = -halfL + (2 * halfL * i) / 5
        const y = wallTop + rise * 0.45
        frame.push(
          strut(
            new Vector3(-halfW * 0.55, y, z),
            new Vector3(halfW * 0.55, y, z),
            0.028,
          ),
        )
      }
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
    const top = hasMast ? apex + 0.35 : apex
    // Duplicates collapse when a plan has no straight run to speak of.
    const anchors = [...new Set(peaks.map((z) => Number(z.toFixed(4))))]
    const bits: BufferGeometry[] = []

    for (const z of anchors) {
      if (spec.finial === 'ball') {
        const ball = new SphereGeometry(0.11, 12, 10)
        ball.translate(0, top + 0.1, z)
        bits.push(ball)
      } else {
        const spear = new ConeGeometry(0.075, 0.42, 8)
        spear.translate(0, top + 0.24, z)
        bits.push(spear)
        const ball = new SphereGeometry(0.075, 10, 8)
        ball.translate(0, top - 0.02, z)
        bits.push(ball)
      }
    }
    push('finial', 'finial', 'metal', mergeGeometries(bits))

    if (spec.finial === 'pennant') {
      // One pennant, on the foremost peak — a flag per mast reads as bunting.
      const flagZ = Math.max(...anchors)
      const grid: Vector3[][] = []
      for (let r = 0; r <= 1; r++) {
        const row: Vector3[] = []
        for (let c = 0; c <= 6; c++) {
          const t = c / 6
          // A tapering pennant, rippling as it runs out.
          const drop = r === 0 ? 0 : 0.22 * (1 - t * 0.55)
          row.push(
            new Vector3(Math.sin(t * 4) * 0.06, top + 0.34 - drop - t * 0.06, flagZ + t * 1.05),
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
    roundPlan
      ? {
          id: 'diameter',
          // On the Tudor this measures one pavilion, so it is drawn across one.
          from: [-radius, 0, form === 'tudor' ? straight : 0],
          to: [radius, 0, form === 'tudor' ? straight : 0],
          label: `Ø ${formatLength(spec.diameter, unit)}`,
        }
      : {
          id: 'length',
          from: [footprint.x, 0, -footprint.z],
          to: [footprint.x, 0, footprint.z],
          label: formatLength(length, unit),
        },
    { id: 'apex', from: [0, 0, 0], to: [0, apex, 0], label: formatLength(apex, unit) },
  ]
  if (!roundPlan) {
    dimensions.push({
      id: 'width',
      from: [-footprint.x, 0, footprint.z],
      to: [footprint.x, 0, footprint.z],
      label: formatLength(width, unit),
    })
  }
  if (form === 'tudor') {
    // Two pavilions and a gallery: the overall length is the useful number,
    // and it is not a control, so the drawing has to report it.
    dimensions.push({
      id: 'length',
      from: [footprint.x, 0, -footprint.z],
      to: [footprint.x, 0, footprint.z],
      label: formatLength(length, unit),
    })
  }

  return {
    parts,
    dimensions,
    radius: Math.hypot(footprint.x, footprint.z) + 1.2,
    height: apex + 0.8,
  }
}
