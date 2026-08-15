import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * Route-level transition plus scroll restoration.
 *
 * The curtain is a single sweeping panel rather than a crossfade — it hides the
 * moment where the outgoing page has unmounted and the incoming one has not yet
 * laid out.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const reduced = useReducedMotion()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  if (reduced) return <>{children}</>

  return (
    <>
      <motion.div
        key={`curtain-${pathname}`}
        className="pointer-events-none fixed inset-0 z-[90] origin-top bg-surface"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  )
}
