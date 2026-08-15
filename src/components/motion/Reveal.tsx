import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  from?: Direction
  distance?: number
  className?: string
  /** Fire once per element, or every time it re-enters the viewport. */
  once?: boolean
  as?: 'div' | 'section' | 'article' | 'li' | 'span'
}

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * The house scroll reveal. Long duration, heavy ease-out — the movement should
 * settle rather than arrive.
 *
 * Respects prefers-reduced-motion by rendering the final state immediately.
 */
export function Reveal({
  children,
  delay = 0,
  duration = 1.1,
  from = 'up',
  distance = 28,
  className,
  once = true,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion()
  const Tag = motion[as]
  const offset = OFFSET[from]

  if (reduced) {
    // Keep the element type — a Reveal inside a <ul> still has to be an <li>.
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, x: offset.x * distance, y: offset.y * distance }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-12% 0px -12% 0px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}
