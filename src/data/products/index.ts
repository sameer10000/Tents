import type { CategoryId, FamilyId, Product } from '../types'
import { shelter } from './shelter'
import { heritage } from './heritage'
import { utility } from './utility'
import { materials } from './materials'
import { travel } from './travel'
import { sleep } from './sleep'
import { field } from './field'
import { living } from './living'
import { companion, home } from './home'
import { atelier } from './atelier'

/**
 * The complete catalogue — 122 SKUs.
 *
 * The 76 codes carried over from the founding business plan (T/O/B/H/C/P/X)
 * keep their original price, cost, channel and MOQ exactly. Everything else was
 * drawn to complete the technical categories.
 */
export const products: Product[] = [
  ...shelter,
  ...heritage,
  ...utility,
  ...travel,
  ...materials,
  ...sleep,
  ...field,
  ...living,
  ...home,
  ...companion,
  ...atelier,
]

export const productBySku = new Map<string, Product>(products.map((p) => [p.sku, p]))

export function productsInCategory(id: CategoryId): Product[] {
  return products.filter((p) => p.category === id)
}

export function productsInFamily(id: FamilyId): Product[] {
  return products.filter((p) => p.family === id)
}

export const featuredProducts = products.filter((p) => p.featured)
export const heroProducts = products.filter((p) => p.hero)

/** Price extremes, used to seed the range filter. */
export const priceBounds = {
  min: Math.min(...products.map((p) => p.price)),
  max: Math.max(...products.map((p) => p.price)),
}

/**
 * Same category first, then same family, never the product itself.
 * Deterministic so a page looks identical on every visit.
 */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (p) => p.sku !== product.sku && p.category === product.category,
  )
  const sameFamily = products.filter(
    (p) =>
      p.sku !== product.sku &&
      p.family === product.family &&
      p.category !== product.category,
  )
  return [...sameCategory, ...sameFamily].slice(0, limit)
}

/**
 * Weighted substring search across name, SKU, tagline, materials and colours.
 * Small catalogue, so a linear scan is the right call — no index to keep warm.
 */
export function searchProducts(rawQuery: string, limit = 8): Product[] {
  const query = rawQuery.trim().toLowerCase()
  if (query.length < 2) return []

  const scored = products
    .map((p) => {
      const name = p.name.toLowerCase()
      let score = 0

      if (p.sku.toLowerCase() === query) score += 100
      if (name === query) score += 90
      if (name.startsWith(query)) score += 50
      if (name.includes(query)) score += 30
      if (p.category.includes(query)) score += 20
      if (p.tagline.toLowerCase().includes(query)) score += 12
      if (p.capacity?.toLowerCase().includes(query)) score += 10
      if (p.materials.some((m) => m.toLowerCase().includes(query))) score += 8
      if (p.colors.some((c) => c.name.toLowerCase().includes(query))) score += 6
      if (p.description.toLowerCase().includes(query)) score += 3

      return { product: p, score }
    })
    .filter((entry) => entry.score > 0)

  scored.sort((a, b) => b.score - a.score || a.product.price - b.product.price)
  return scored.slice(0, limit).map((entry) => entry.product)
}

export {
  shelter,
  heritage,
  utility,
  travel,
  materials,
  sleep,
  field,
  living,
  home,
  companion,
  atelier,
}
