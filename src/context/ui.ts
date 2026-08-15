import { createContext, useContext } from 'react'

export type Panel = 'search' | 'wishlist' | 'cart' | 'inquiry' | null

export interface UIValue {
  panel: Panel
  /** SKU the inquiry drawer opened against, if any. */
  inquirySubject: string | null
  open: (panel: Exclude<Panel, null>) => void
  openInquiry: (sku?: string) => void
  close: () => void
}

export const UIContext = createContext<UIValue | null>(null)

export function useUI(): UIValue {
  const value = useContext(UIContext)
  if (!value) throw new Error('useUI must be used inside UIProvider')
  return value
}
