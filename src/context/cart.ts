import { createContext, useContext } from 'react'
import type { CartLine, CustomTentLine, ResolvedLine, OrderTotals } from '../lib/order'

export interface CartValue {
  lines: ResolvedLine[]
  raw: CartLine[]
  /**
   * Tents from the configurator. Held apart from the catalogue lines because
   * they carry no price — they are quoted, not sold.
   */
  custom: CustomTentLine[]
  totals: OrderTotals
  /** Total units across both kinds, which is what the navbar badge shows. */
  count: number
  /** True while the bag holds anything that has to be quoted before it ships. */
  hasOnRequest: boolean
  has: (sku: string) => boolean
  quantityOf: (sku: string) => number
  /** Adds `qty` units, or the piece's MOQ when qty is omitted. */
  add: (sku: string, qty?: number) => void
  /** Sets an absolute quantity. Below MOQ removes the line entirely. */
  setQuantity: (sku: string, qty: number) => void
  remove: (sku: string) => void
  /** Empties the bag entirely, commissions included. */
  clear: () => void
  /**
   * Empties only the priced pieces. Used after checkout, where paying for the
   * catalogue lines must not silently discard a commission still awaiting a
   * quotation.
   */
  clearCatalogue: () => void

  addCustom: (line: Omit<CustomTentLine, 'addedAt'>) => void
  setCustomQuantity: (id: string, qty: number) => void
  removeCustom: (id: string) => void
}

export const CartContext = createContext<CartValue | null>(null)

export const CART_STORAGE_KEY = 'ce-cart'

/** Kept in its own key so an existing bag survives the configurator arriving. */
export const CUSTOM_STORAGE_KEY = 'ce-custom-tents'

export function useCart(): CartValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside CartProvider')
  return value
}
