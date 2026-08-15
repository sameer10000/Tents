import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useUI } from '../context/ui'
import { MailIcon } from './icons'

/**
 * Persistent enquiry affordance. Stays out of the way until the visitor is
 * past the hero, then sits bottom-right and widens on hover.
 */
export function FloatingInquiry() {
  const { scrollY } = useScroll()
  const { openInquiry, panel } = useUI()
  const [visible, setVisible] = useState(false)

  useMotionValueEvent(scrollY, 'change', (value) => {
    setVisible(value > 560)
  })

  return (
    <AnimatePresence>
      {visible && !panel ? (
        <motion.button
          type="button"
          onClick={() => openInquiry()}
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass group fixed right-5 bottom-5 z-40 flex items-center gap-0 overflow-hidden rounded-full border py-3.5 pr-3.5 pl-3.5 shadow-lg transition-[gap,padding] duration-500 hover:gap-3 hover:pr-6 lg:right-8 lg:bottom-8"
          aria-label="Open enquiry"
        >
          <MailIcon className="h-[18px] w-[18px] shrink-0 text-accent" />
          <span className="max-w-0 overflow-hidden text-[0.66rem] tracking-[0.24em] whitespace-nowrap text-ink uppercase transition-[max-width] duration-500 group-hover:max-w-[9rem]">
            Enquire
          </span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
