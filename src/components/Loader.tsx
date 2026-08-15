import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Monogram } from './BrandMark'

/**
 * First-visit curtain. Shows once per session, lifts as two panels rather than
 * fading — the split is what makes it feel like a set change instead of a
 * loading spinner.
 */
export function Loader() {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(() => {
    if (typeof sessionStorage === 'undefined') return true
    return sessionStorage.getItem('ce-entered') !== '1'
  })

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(
      () => {
        setVisible(false)
        try {
          sessionStorage.setItem('ce-entered', '1')
        } catch {
          // Session storage unavailable — the curtain simply shows again later.
        }
      },
      reduced ? 200 : 1850,
    )
    return () => window.clearTimeout(timer)
  }, [visible, reduced])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          exit={{ pointerEvents: 'none' }}
        >
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-ink-950"
            exit={{ y: '-100%' }}
            transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink-950"
            exit={{ y: '100%' }}
            transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
          />

          <motion.div
            className="relative flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <Monogram className="h-12 w-12 text-brass-400" />
            <div className="flex flex-col items-center gap-3">
              <span className="font-display text-2xl font-light tracking-[0.24em] text-ivory-100">
                CANVAS
              </span>
              <span className="eyebrow text-ivory-400/70">Emporium</span>
            </div>

            {/* Progress hairline — a fixed sweep, not a fake percentage. */}
            <div className="mt-2 h-px w-40 overflow-hidden bg-ivory-100/12">
              <motion.div
                className="h-full bg-brass-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
                style={{ originX: 0 }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
