import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BufferGeometry, EdgesGeometry, Float32BufferAttribute, Vector3 } from 'three'
import type { LengthUnit, TentSpec } from '../../data/tent-config'
import { formatLength } from '../../data/tent-config'
import { buildTent, disposeModel } from '../../lib/tent-geometry'
import { buildFigure } from '../../lib/tent-geometry/figure'
import type { TentModel, TentPart } from '../../lib/tent-geometry'
import { canvasWeave, finishFor, surfaceColor } from './materials'
import type { RenderStyle } from './renderStyles'

interface SceneProps {
  spec: TentSpec
  style: RenderStyle
  unit: LengthUnit
  planView: boolean
  dark: boolean
}

/** Line colours for the technical view, per theme. */
const INK = { line: '#14161a', accent: '#8c6d3a', faint: 'rgba(20,22,26,0.10)' }
const IVORY = { line: '#ede8dd', accent: '#c6a667', faint: 'rgba(237,232,221,0.10)' }

/* ── Cloth and hardware ─────────────────────────────────────────────────── */

function SolidPart({
  part,
  spec,
  style,
}: {
  part: TentPart
  spec: TentSpec
  style: RenderStyle
}) {
  const color = surfaceColor(part.surface, part.role, spec.colors)
  const finish = finishFor(part.role)
  const weave = style === 'photoreal' && part.role === 'canvas' ? canvasWeave() : null

  return (
    <mesh geometry={part.geometry} castShadow={style === 'photoreal'} receiveShadow>
      <meshStandardMaterial
        color={color}
        map={weave?.map ?? null}
        bumpMap={weave?.bump ?? null}
        bumpScale={weave ? 0.5 : 0}
        roughness={style === 'photoreal' ? finish.roughness : Math.min(finish.roughness + 0.04, 1)}
        metalness={style === 'matte' && part.role === 'metal' ? 0.45 : finish.metalness}
        transparent={part.opacity !== undefined}
        opacity={part.opacity ?? 1}
        side={part.doubleSide ? 2 : 0}
        // Cloth is thin; without this the inside face fights the outside one.
        polygonOffset
        polygonOffsetFactor={1}
      />
    </mesh>
  )
}

/* ── Technical view ─────────────────────────────────────────────────────── */

function BlueprintPart({ part, tone }: { part: TentPart; tone: typeof INK }) {
  const edges = useMemo(() => new EdgesGeometry(part.geometry, 22), [part.geometry])
  useEffect(() => () => edges.dispose(), [edges])

  return (
    <group>
      <mesh geometry={part.geometry}>
        <meshBasicMaterial color={tone.line} transparent opacity={0.05} side={2} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={tone.line} transparent opacity={0.62} />
      </lineSegments>
    </group>
  )
}

function DimensionCallouts({ model, tone }: { model: TentModel; tone: typeof INK }) {
  const lines = useMemo(() => {
    const positions: number[] = []
    for (const dimension of model.dimensions) {
      const from = new Vector3(...dimension.from)
      const to = new Vector3(...dimension.to)
      // Stand the leader off the structure so it does not sit inside the cloth.
      const offset = new Vector3(0, 0, 0)
      if (Math.abs(from.y - to.y) < 1e-6) offset.y = -0.28
      const a = from.clone().add(offset)
      const b = to.clone().add(offset)
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z)

      // End ticks.
      const across = new Vector3().subVectors(b, a).normalize().cross(new Vector3(0, 1, 0))
      if (across.lengthSq() < 1e-6) across.set(1, 0, 0)
      across.multiplyScalar(0.14)
      for (const point of [a, b]) {
        positions.push(
          point.x - across.x,
          point.y - across.y,
          point.z - across.z,
          point.x + across.x,
          point.y + across.y,
          point.z + across.z,
        )
      }
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geometry
  }, [model])

  useEffect(() => () => lines.dispose(), [lines])

  return (
    <group>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={tone.accent} transparent opacity={0.9} />
      </lineSegments>

      {model.dimensions.map((dimension) => {
        const mid = new Vector3(...dimension.from)
          .add(new Vector3(...dimension.to))
          .multiplyScalar(0.5)
        const flat = Math.abs(dimension.from[1] - dimension.to[1]) < 1e-6
        return (
          <Html
            key={dimension.id}
            position={[mid.x, mid.y + (flat ? -0.28 : 0), mid.z + (flat ? 0 : 0.1)]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span
              className="eyebrow whitespace-nowrap"
              style={{ color: tone.accent, fontSize: '0.5rem' }}
            >
              {dimension.label}
            </span>
          </Html>
        )
      })}
    </group>
  )
}

/**
 * A 1.8 m figure — the only honest way to show how big a tent actually is.
 *
 * Solid rather than drawn, so it still reads as a person from every angle the
 * camera can reach, and carries its own height callout.
 */
const FIGURE_HEIGHT = 1.8

function ScaleFigure({
  x,
  z,
  tone,
  unit,
}: {
  x: number
  z: number
  tone: typeof INK
  unit: LengthUnit
}) {
  const body = useMemo(() => buildFigure(FIGURE_HEIGHT), [])
  const edges = useMemo(() => new EdgesGeometry(body, 24), [body])

  useEffect(
    () => () => {
      body.dispose()
      edges.dispose()
    },
    [body, edges],
  )

  const leader = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        // A height stick beside the figure, ticked top and bottom.
        [
          0.42, 0, 0, 0.42, FIGURE_HEIGHT, 0,
          0.36, 0, 0, 0.48, 0, 0,
          0.36, FIGURE_HEIGHT, 0, 0.48, FIGURE_HEIGHT, 0,
        ],
        3,
      ),
    )
    return geometry
  }, [])

  useEffect(() => () => leader.dispose(), [leader])

  return (
    <group position={[x, 0, z]}>
      <mesh geometry={body}>
        <meshBasicMaterial color={tone.line} transparent opacity={0.07} side={2} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={tone.line} transparent opacity={0.5} />
      </lineSegments>

      <lineSegments geometry={leader}>
        <lineBasicMaterial color={tone.accent} transparent opacity={0.7} />
      </lineSegments>
      <Html
        position={[0.55, FIGURE_HEIGHT / 2, 0]}
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <span className="eyebrow whitespace-nowrap" style={{ color: tone.accent, fontSize: '0.5rem' }}>
          {formatLength(FIGURE_HEIGHT, unit)}
        </span>
      </Html>
    </group>
  )
}

/** A one-metre reference grid under the structure. */
function TechnicalGrid({ radius, tone }: { radius: number; tone: typeof INK }) {
  const geometry = useMemo(() => {
    const extent = Math.ceil(radius) + 2
    const positions: number[] = []
    for (let i = -extent; i <= extent; i++) {
      positions.push(i, 0, -extent, i, 0, extent)
      positions.push(-extent, 0, i, extent, 0, i)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [radius])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} position={[0, -0.002, 0]}>
      <lineBasicMaterial color={tone.line} transparent opacity={0.14} />
    </lineSegments>
  )
}

/* ── Camera ─────────────────────────────────────────────────────────────── */

function CameraRig({
  radius,
  height,
  planView,
  family,
}: {
  radius: number
  height: number
  planView: boolean
  family: string
}) {
  const controls = useRef<{ target: Vector3; update: () => void } | null>(null)
  const camera = useThree((state) => state.camera)
  const goal = useRef<{ position: Vector3; target: Vector3 } | null>(null)

  // Re-frame when the structure changes shape entirely, and when the plan view
  // is toggled — but never on an ordinary slider drag, which would fight the
  // user's own orbiting.
  useEffect(() => {
    goal.current = planView
      ? {
          position: new Vector3(0, radius * 2.5 + height, 0.01),
          target: new Vector3(0, 0, 0),
        }
      : {
          position: new Vector3(radius * 1.15, height * 0.95, radius * 1.75),
          target: new Vector3(0, height * 0.34, 0),
        }
  }, [planView, family, radius, height])

  useFrame((_, delta) => {
    const destination = goal.current
    if (!destination || !controls.current) return

    const ease = 1 - Math.pow(0.0015, delta)
    camera.position.lerp(destination.position, ease)
    controls.current.target.lerp(destination.target, ease)
    controls.current.update()

    if (camera.position.distanceTo(destination.position) < 0.02) goal.current = null
  })

  return (
    <OrbitControls
      // @ts-expect-error — drei's ref type is the full controls implementation.
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={Math.max(2, radius * 0.6)}
      maxDistance={radius * 5 + 8}
      maxPolarAngle={Math.PI / 2 - 0.02}
      target={[0, height * 0.34, 0]}
    />
  )
}

/* ── Scene ──────────────────────────────────────────────────────────────── */

function Structure({ spec, style, unit, planView, dark }: SceneProps) {
  const model = useMemo(() => buildTent(spec, unit), [spec, unit])
  useEffect(() => () => disposeModel(model), [model])

  const tone = dark ? IVORY : INK
  const blueprint = style === 'blueprint'

  return (
    <>
      {blueprint ? (
        <>
          <TechnicalGrid radius={model.radius} tone={tone} />
          {model.parts.map((part) => (
            <BlueprintPart key={part.id} part={part} tone={tone} />
          ))}
          <DimensionCallouts model={model} tone={tone} />
          <ScaleFigure
            x={model.radius * 0.82}
            z={model.radius * 0.5}
            tone={tone}
            unit={unit}
          />
        </>
      ) : (
        <>
          {model.parts.map((part) => (
            <SolidPart key={part.id} part={part} spec={spec} style={style} />
          ))}
          <ContactShadows
            position={[0, 0.001, 0]}
            scale={model.radius * 3.4}
            opacity={dark ? 0.55 : 0.34}
            blur={2.4}
            far={model.height}
            resolution={512}
          />
        </>
      )}

      <CameraRig
        radius={model.radius}
        height={model.height}
        planView={blueprint && planView}
        family={spec.family}
      />
    </>
  )
}

export default function TentScene(props: SceneProps) {
  const { style, dark } = props
  const photoreal = style === 'photoreal'

  return (
    <Canvas
      shadows={photoreal}
      dpr={[1, photoreal ? 2 : 1.75]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ fov: 38, position: [6, 4, 9], near: 0.1, far: 200 }}
      style={{ touchAction: 'pan-y' }}
    >
      <hemisphereLight
        intensity={dark ? 0.5 : 0.85}
        color={dark ? '#8fa0b0' : '#ffffff'}
        groundColor={dark ? '#1a1c1f' : '#c9c1ad'}
      />
      <directionalLight
        position={[6, 9, 5]}
        intensity={photoreal ? 2.1 : 1.5}
        color="#fff4e2"
        castShadow={photoreal}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-7, 4, -4]} intensity={0.45} color="#c8d6e0" />

      {photoreal && (
        // Built in-scene rather than fetched, so the page stays self-contained.
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 6, -4]} scale={[12, 6, 1]} />
          <Lightformer
            form="rect"
            intensity={1.4}
            position={[-6, 3, 3]}
            rotation-y={Math.PI / 2}
            scale={[8, 5, 1]}
          />
          <Lightformer
            form="circle"
            intensity={2}
            position={[4, 7, 4]}
            scale={5}
            color="#ffe9c9"
          />
        </Environment>
      )}

      <Structure {...props} />
    </Canvas>
  )
}
