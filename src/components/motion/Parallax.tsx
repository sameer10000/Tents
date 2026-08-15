import { useRef } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

interface ParallaxProps {
  children: ReactNode
  /** Pixels of travel across the full scroll pass. Negative moves against. */
  distance?: number
  /** Scale at the start of the pass; settles to 1 at the end. */
  zoom?: number
  className?: string
}

/**
 * Scroll-linked vertical drift. Used for plate backgrounds inside a clipped
 * frame — the child should be taller than its parent so the travel never
 * exposes an edge.
 */
export function Parallax({ children, distance = 80, zoom, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [-distance / 2, distance / 2])
  const scale = useTransform(scrollYProgress, [0, 1], [zoom ?? 1, 1])

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div ref={ref} className={className} style={{ y, scale }}>
      {children}
    </motion.div>
  )
}
