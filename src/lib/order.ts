import { getCatalogue } from '../data/catalogue'
import type { TentFamilyId, TentSpec } from '../data/tent-config'
import type { Product } from '../data/types'

/**
 * Order arithmetic and local order history.
 *
 * All money is whole rupees. Nothing here talks to a payment processor — see
 * the note in `placeOrder`.
 */

/** Standard GST rate applied to tents, bags and outdoor goods. */
export const GST_RATE = 0.18

/** Orders at or above this ship free. */
export const FREE_SHIPPING_THRESHOLD = 5000

export const SHIPPING_FLAT = 499

/** Express uplift, charged on top of the standard rate. */
export const EXPRESS_SURCHARGE = 900

export type DeliveryMethod = 'standard' | 'express'

export interface CartLine {
  sku: string
  qty: number
}

/**
 * A tent designed in the configurator.
 *
 * It carries no price — a commission is quoted against its drawing, not read
 * off a shelf — so it is held apart from the catalogue lines and never enters
 * the subtotal, the GST or the shipping maths. `id` is the record on the
 * server, and doubles as the share link.
 */
export interface CustomTentLine {
  id: string
  qty: number
  family: TentFamilyId
  /** "Bell Tent · 5.0 m Ø" — what the bag and the inbox both show. */
  headline: string
  spec: TentSpec
  addedAt: string
}

export interface ResolvedLine extends CartLine {
  product: Product
  lineTotal: number
}

export interface OrderTotals {
  /** Number of distinct pieces, not units. */
  lines: number
  units: number
  subtotal: number
  gst: number
  shipping: number
  total: number
  /** How much more to spend before shipping is free. Zero once it is. */
  toFreeShipping: number
  /** True when any line is quoted per project rather than sold outright. */
  hasTradeItems: boolean
}

/**
 * Attaches the live product to each stored line.
 *
 * The lookup is a parameter rather than a hidden read so callers that need to
 * recompute when the catalogue changes can depend on it explicitly.
 */
export function resolveLines(
  lines: CartLine[],
  productBySku: Map<string, Product> = getCatalogue().productBySku,
): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = productBySku.get(line.sku)
    if (!product) return []
    return [{ ...line, product, lineTotal: product.price * line.qty }]
  })
}

export function summarise(
  lines: ResolvedLine[],
  delivery: DeliveryMethod = 'standard',
): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const units = lines.reduce((sum, line) => sum + line.qty, 0)

  const base = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT
  const shipping =
    delivery === 'express' && subtotal > 0 ? base + EXPRESS_SURCHARGE : base

  // GST applies to the goods and the freight alike.
  const gst = Math.round((subtotal + shipping) * GST_RATE)

  return {
    lines: lines.length,
    units,
    subtotal,
    gst,
    shipping,
    total: subtotal + shipping + gst,
    toFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    hasTradeItems: lines.some((line) => line.product.channel === 'B2B'),
  }
}

export interface OrderCustomer {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  gstin?: string
  notes?: string
}

export interface Order {
  id: string
  placedAt: string
  customer: OrderCustomer
  delivery: DeliveryMethod
  paymentMethod: string
  lines: Array<{
    sku: string
    name: string
    qty: number
    unitPrice: number
    lineTotal: number
  }>
  totals: OrderTotals
}

const ORDERS_KEY = 'ce-orders'
const ORDER_CAP = 20

export function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch {
    return []
  }
}

export function findOrder(id: string): Order | undefined {
  return readOrders().find((order) => order.id === id)
}

/**
 * Records an order locally and returns it.
 *
 * There is no payment processor and no server behind this — the order is
 * written to localStorage so the confirmation page survives a refresh, and the
 * payload is logged for whatever this eventually gets wired to.
 */
export function placeOrder(input: {
  lines: ResolvedLine[]
  customer: OrderCustomer
  delivery: DeliveryMethod
  paymentMethod: string
}): Order {
  const totals = summarise(input.lines, input.delivery)

  const order: Order = {
    id: `CE${Date.now().toString(36).toUpperCase().slice(-7)}`,
    placedAt: new Date().toISOString(),
    customer: input.customer,
    delivery: input.delivery,
    paymentMethod: input.paymentMethod,
    lines: input.lines.map((line) => ({
      sku: line.sku,
      name: line.product.name,
      qty: line.qty,
      unitPrice: line.product.price,
      lineTotal: line.lineTotal,
    })),
    totals,
  }

  console.info('[Canvas Emporium] order placed', order)

  try {
    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify([order, ...readOrders()].slice(0, ORDER_CAP)),
    )
  } catch {
    // Storage unavailable — the confirmation still renders from memory for
    // this session, it just will not survive a refresh.
  }

  return order
}

/** Working days from today, skipping weekends. */
export function estimateDelivery(method: DeliveryMethod): string {
  const days = method === 'express' ? 3 : 8
  const date = new Date()
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
