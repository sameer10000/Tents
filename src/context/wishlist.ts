import { createContext, useContext } from 'react'
import type { Product } from '../data/types'

export interface WishlistValue {
  skus: string[]
  items: Product[]
  has: (sku: string) => boolean
  toggle: (sku: string) => void
  remove: (sku: string) => void
  clear: () => void
  count: number
}

export const WishlistContext = createContext<WishlistValue | null>(null)

export const WISHLIST_STORAGE_KEY = 'ce-wishlist'

export function useWishlist(): WishlistValue {
  const value = useContext(WishlistContext)
  if (!value) throw new Error('useWishlist must be used inside WishlistProvider')
  return value
}
