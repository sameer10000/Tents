import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCatalogue, useCatalogue } from '../data/catalogue'
import { TENT_FAMILY_BY_ID } from '../data/tent-config'
import type { CartLine, CustomTentLine } from '../lib/order'
import { resolveLines, summarise } from '../lib/order'
import { CART_STORAGE_KEY, CUSTOM_STORAGE_KEY, CartContext } from './cart'
import type { CartValue } from './cart'

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((entry): CartLine[] => {
      if (typeof entry !== 'object' || entry === null) return []
      const { sku, qty } = entry as { sku?: unknown; qty?: unknown }
      if (typeof sku !== 'string' || typeof qty !== 'number') return []

      // Drop pieces that have left the catalogue, and re-floor anything that
      // was saved before a MOQ changed.
      const product = getCatalogue().productBySku.get(sku)
      if (!product) return []
      return [{ sku, qty: Math.max(product.moq, Math.floor(qty)) }]
    })
  } catch {
    return []
  }
}

/**
 * Custom tents survive a refresh in full — the specification travels with the
 * line, so the bag can describe a commission without asking the server.
 */
function readStoredCustom(): CustomTentLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) ?? 'null')
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((entry): CustomTentLine[] => {
      if (typeof entry !== 'object' || entry === null) return []
      const line = entry as Partial<CustomTentLine>
      if (typeof line.id !== 'string' || typeof line.headline !== 'string') return []
      // A family that no longer exists could not be drawn or quoted.
      if (!line.family || !TENT_FAMILY_BY_ID.has(line.family)) return []
      if (!line.spec || typeof line.spec !== 'object') return []

      return [
        {
          id: line.id,
          qty: Math.max(1, Math.floor(Number(line.qty) || 1)),
          family: line.family,
          headline: line.headline,
          spec: line.spec,
          addedAt: line.addedAt ?? new Date().toISOString(),
        },
      ]
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<CartLine[]>(readStored)
  const [custom, setCustom] = useState<CustomTentLine[]>(readStoredCustom)
  // Subscribed so prices and MOQs re-resolve when the admin portal edits a
  // piece that is already in someone's bag.
  const catalogue = useCatalogue()

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(raw))
    } catch {
      // Storage unavailable — the bag still works for this session.
    }
  }, [raw])

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(custom))
    } catch {
      // As above — a commission is still recoverable from its share link.
    }
  }, [custom])

  const add = useCallback((sku: string, qty?: number) => {
    const product = getCatalogue().productBySku.get(sku)
    if (!product) return

    // Quantities move in MOQ steps: a piece sold in twenty-fives goes
    // 25 → 50 → 75, never 26.
    const step = qty ?? product.moq

    setRaw((current) => {
      const existing = current.find((line) => line.sku === sku)
      if (!existing) return [{ sku, qty: Math.max(product.moq, step) }, ...current]
      return current.map((line) =>
        line.sku === sku ? { ...line, qty: line.qty + step } : line,
      )
    })
  }, [])

  const setQuantity = useCallback((sku: string, qty: number) => {
    const product = getCatalogue().productBySku.get(sku)
    if (!product) return

    setRaw((current) => {
      if (qty < product.moq) return current.filter((line) => line.sku !== sku)
      return current.map((line) => (line.sku === sku ? { ...line, qty } : line))
    })
  }, [])

  const remove = useCallback((sku: string) => {
    setRaw((current) => current.filter((line) => line.sku !== sku))
  }, [])

  const clear = useCallback(() => {
    setRaw([])
    setCustom([])
  }, [])

  const clearCatalogue = useCallback(() => setRaw([]), [])

  const addCustom = useCallback((line: Omit<CustomTentLine, 'addedAt'>) => {
    setCustom((current) => {
      // Re-bagging a design that is already there replaces it rather than
      // stacking a second, subtly different copy of the same tent.
      const without = current.filter((entry) => entry.id !== line.id)
      return [{ ...line, addedAt: new Date().toISOString() }, ...without]
    })
  }, [])

  const setCustomQuantity = useCallback((id: string, qty: number) => {
    setCustom((current) =>
      qty < 1
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, qty } : line)),
    )
  }, [])

  const removeCustom = useCallback((id: string) => {
    setCustom((current) => current.filter((line) => line.id !== id))
  }, [])

  const lines = useMemo(
    () => resolveLines(raw, catalogue.productBySku),
    [raw, catalogue.productBySku],
  )
  const totals = useMemo(() => summarise(lines), [lines])

  const has = useCallback((sku: string) => raw.some((line) => line.sku === sku), [raw])

  const quantityOf = useCallback(
    (sku: string) => raw.find((line) => line.sku === sku)?.qty ?? 0,
    [raw],
  )

  const customUnits = useMemo(
    () => custom.reduce((sum, line) => sum + line.qty, 0),
    [custom],
  )

  const value = useMemo<CartValue>(
    () => ({
      lines,
      raw,
      custom,
      totals,
      count: totals.units + customUnits,
      hasOnRequest: custom.length > 0,
      has,
      quantityOf,
      add,
      setQuantity,
      remove,
      clear,
      clearCatalogue,
      addCustom,
      setCustomQuantity,
      removeCustom,
    }),
    [
      lines,
      raw,
      custom,
      customUnits,
      totals,
      has,
      quantityOf,
      add,
      setQuantity,
      remove,
      clear,
      clearCatalogue,
      addCustom,
      setCustomQuantity,
      removeCustom,
    ],
  )

  return <CartContext value={value}>{children}</CartContext>
}
