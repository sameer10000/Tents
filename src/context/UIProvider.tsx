import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { UIContext } from './ui'
import type { Panel, UIValue } from './ui'

export function UIProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel>(null)
  const [inquirySubject, setInquirySubject] = useState<string | null>(null)

  const close = useCallback(() => {
    setPanel(null)
    setInquirySubject(null)
  }, [])

  const open = useCallback((next: Exclude<Panel, null>) => {
    setInquirySubject(null)
    setPanel(next)
  }, [])

  const openInquiry = useCallback((sku?: string) => {
    setInquirySubject(sku ?? null)
    setPanel('inquiry')
  }, [])

  // One overlay at a time, and Escape always closes it.
  useEffect(() => {
    if (!panel) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [panel, close])

  // ⌘K / Ctrl-K opens search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPanel((current) => (current === 'search' ? null : 'search'))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo<UIValue>(
    () => ({ panel, inquirySubject, open, openInquiry, close }),
    [panel, inquirySubject, open, openInquiry, close],
  )

  return <UIContext value={value}>{children}</UIContext>
}
