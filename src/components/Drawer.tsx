import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CloseIcon } from './icons'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  /** Pinned to the bottom, outside the scroll area. */
  footer?: ReactNode
}

/** Right-hand slide-over. Shared by the wishlist and the enquiry form. */
export function Drawer({ open, onClose, title, eyebrow, children, footer }: DrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-ink-950/70 backdrop-blur-sm"
            onClick={onClose}
            aria-label={`Close ${title}`}
          />

          <motion.aside
            role="dialog"
            aria-label={title}
            className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l bg-surface"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between border-b px-7 py-7">
              <div>
                {eyebrow ? <p className="eyebrow eyebrow-accent">{eyebrow}</p> : null}
                <h2 className="mt-2 font-display text-3xl font-light">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-1.5 p-1.5 text-muted transition-colors hover:text-ink"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-7 py-7">{children}</div>

            {footer ? <div className="border-t px-7 py-6">{footer}</div> : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
