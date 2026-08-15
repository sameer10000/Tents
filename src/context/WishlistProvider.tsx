import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCatalogue, useCatalogue } from '../data/catalogue'
import type { Product } from '../data/types'
import { WISHLIST_STORAGE_KEY, WishlistContext } from './wishlist'
import type { WishlistValue } from './wishlist'

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Drop anything that no longer exists in the catalogue.
    const { productBySku } = getCatalogue()
    return parsed.filter((s): s is string => typeof s === 'string' && productBySku.has(s))
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [skus, setSkus] = useState<string[]>(readStored)
  const { productBySku } = useCatalogue()

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(skus))
    } catch {
      // Nothing to do — the list still works for this session.
    }
  }, [skus])

  const has = useCallback((sku: string) => skus.includes(sku), [skus])

  const toggle = useCallback((sku: string) => {
    setSkus((current) =>
      current.includes(sku) ? current.filter((s) => s !== sku) : [sku, ...current],
    )
  }, [])

  const remove = useCallback((sku: string) => {
    setSkus((current) => current.filter((s) => s !== sku))
  }, [])

  const clear = useCallback(() => setSkus([]), [])

  const items = useMemo(
    () =>
      skus.map((sku) => productBySku.get(sku)).filter((p): p is Product => Boolean(p)),
    [skus, productBySku],
  )

  const value = useMemo<WishlistValue>(
    () => ({ skus, items, has, toggle, remove, clear, count: skus.length }),
    [skus, items, has, toggle, remove, clear],
  )

  return <WishlistContext value={value}>{children}</WishlistContext>
}
