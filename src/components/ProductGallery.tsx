import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import type { Product } from '../data/types'
import { ProductImage } from './ProductImage'

/**
 * Product gallery with pointer-driven perspective.
 *
 * The tilt is deliberately small — eight degrees at the extremes. Enough to
 * read as a physical object under a light, not enough to look like a toy.
 *
 * One frame per uploaded photograph. With nothing uploaded that is a single
 * generated plate — no thumbnail rail, since there is nothing to choose
 * between.
 */
export function ProductGallery({ product }: { product: Product }) {
  const [view, setView] = useState(0)
  const frameRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const images = product.images?.filter(Boolean) ?? []
  // Never zero: with no upload the frame still shows the plate, and the file
  // convention (`public/images/products/<sku>.jpg`) can still fill it.
  const count = Math.max(images.length, 1)
  // Guards against a stale index when navigating to a product with fewer views.
  const active = Math.min(view, count - 1)

  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const spring = { stiffness: 140, damping: 18, mass: 0.4 }
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), spring)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), spring)
  // Computed unconditionally — hooks cannot sit behind the reduced-motion check.
  const shine = useTransform(
    px,
    (value) =>
      `radial-gradient(60% 70% at ${(value + 0.5) * 100}% 22%, rgba(255,255,255,0.42), rgba(255,255,255,0) 70%)`,
  )

  function handleMove(event: React.PointerEvent) {
    if (reduced) return
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    px.set((event.clientX - rect.left) / rect.width - 0.5)
    py.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    px.set(0)
    py.set(0)
  }

  return (
    <div className="flex flex-col-reverse gap-5 lg:flex-row">
      {/* View rail — only earns its place when there is more than one view. */}
      {count > 1 ? (
        <div className="flex gap-3 lg:w-[88px] lg:shrink-0 lg:flex-col">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setView(index)}
              aria-label={`View ${index + 1} of ${count}`}
              aria-pressed={active === index}
              className={`relative aspect-4/5 flex-1 overflow-hidden border transition-all duration-500 lg:flex-none ${
                active === index
                  ? 'border-accent opacity-100'
                  : 'border-transparent opacity-45 hover:opacity-80'
              }`}
            >
              <ProductImage product={product} view={index} />
            </button>
          ))}
        </div>
      ) : null}

      {/* Main frame */}
      <div
        ref={frameRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className="relative flex-1 [perspective:1400px]"
      >
        <motion.div
          className="relative aspect-4/5 overflow-hidden lg:aspect-3/4"
          style={
            reduced ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductImage product={product} view={active} priority={active === 0} />
            </motion.div>
          </AnimatePresence>

          {/* Raking highlight that follows the pointer. */}
          {reduced ? null : (
            <motion.div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ background: shine }}
            />
          )}

          <span className="pointer-events-none absolute top-5 left-5 text-[0.55rem] tracking-[0.28em] text-ivory-100/55 uppercase">
            {product.sku}
          </span>

          {product.badge ? (
            <span className="pointer-events-none absolute top-5 right-5 border border-ivory-100/25 bg-ink-950/35 px-3 py-1.5 text-[0.55rem] tracking-[0.28em] text-ivory-100 uppercase backdrop-blur-sm">
              {product.badge}
            </span>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
