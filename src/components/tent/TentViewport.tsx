import { Suspense, lazy, useDeferredValue, useState } from 'react'
import { useTheme } from '../../context/theme'
import type { LengthUnit, TentSpec } from '../../data/tent-config'
import { familyDef } from '../../data/tent-config'
import { ProductPlate } from '../ProductPlate'
import { RENDER_STYLES, type RenderStyle } from './renderStyles'

// three, r3f and drei are ~600 KB together. Nothing on the storefront pulls
// them in — they arrive only once this component actually mounts.
const TentScene = lazy(() => import('./TentScene'))

interface TentViewportProps {
  spec: TentSpec
  unit: LengthUnit
  className?: string
}

/** One-shot capability check. A blank canvas is not an acceptable failure. */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

export function TentViewport({ spec, unit, className = '' }: TentViewportProps) {
  const { theme } = useTheme()
  const [style, setStyle] = useState<RenderStyle>('matte')
  const [planView, setPlanView] = useState(false)
  // Resolved once, lazily, on the first render — the answer cannot change for
  // the life of the page.
  const [supported] = useState(detectWebGL)

  // Rebuilding the model is cheap but not free; letting the slider stay ahead
  // of the geometry keeps dragging smooth on a phone.
  const deferred = useDeferredValue(spec)
  const stale = deferred !== spec

  const def = familyDef(spec.family)

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {!supported ? (
        <>
          <ProductPlate plate={def.plate} seed={`custom-${spec.family}`} />
          <div className="absolute inset-x-0 bottom-0 p-6 text-center">
            <p className="eyebrow">Live view unavailable on this device</p>
            <p className="mt-2 text-sm text-muted">
              Your specification is still recorded in full — carry on below.
            </p>
          </div>
        </>
      ) : (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-32 overflow-hidden bg-line-strong">
                <div className="animate-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent bg-[length:300%_100%]" />
              </div>
            </div>
          }
        >
          <TentScene
            spec={deferred}
            style={style}
            unit={unit}
            planView={planView}
            dark={theme === 'dark'}
          />

        </Suspense>
      )}

      {/* Style switcher */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="glass pointer-events-auto flex border border-glass-line">
          {RENDER_STYLES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStyle(option.id)}
              title={option.hint}
              aria-pressed={style === option.id}
              className={`eyebrow px-3 py-2 transition-colors duration-500 ${
                style === option.id ? 'bg-ink text-surface' : 'hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {style === 'blueprint' && (
          <button
            type="button"
            onClick={() => setPlanView((current) => !current)}
            aria-pressed={planView}
            className={`glass eyebrow pointer-events-auto border border-glass-line px-3 py-2 transition-colors duration-500 ${
              planView ? 'bg-ink text-surface' : 'hover:text-ink'
            }`}
          >
            {planView ? 'Elevation' : 'Plan view'}
          </button>
        )}
      </div>

      {/* Orbit hint, and the busy state while geometry catches up */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        <p className="eyebrow">{stale ? 'Redrawing' : 'Drag to orbit · scroll to zoom'}</p>
        <p className="eyebrow">{def.name}</p>
      </div>
    </div>
  )
}
