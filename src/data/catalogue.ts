import { useSyncExternalStore } from 'react'
import { products as seedProducts } from './products'
import { categories as seedCategories, families as seedFamilies } from './taxonomy'
import type { Category, CategoryId, Family, FamilyId, Product } from './types'

/**
 * The live catalogue.
 *
 * The bundled TypeScript data is the seed, so the storefront renders instantly
 * and still works with no server running. Once `/api/catalogue` answers, the
 * snapshot is replaced and every subscriber re-renders.
 *
 * The shape deliberately matches what the static modules exported — the same
 * Maps with the same `.get()` calls — so consumers only swap an import for a
 * hook.
 */
export interface Catalogue {
  products: Product[]
  families: Family[]
  categories: Category[]

  productBySku: Map<string, Product>
  categoryById: Map<CategoryId, Category>
  familyById: Map<FamilyId, Family>
  familyBySlug: Map<string, Family>

  categoriesOf: (familyId: FamilyId) => Category[]
  productsInCategory: (id: CategoryId) => Product[]
  productsInFamily: (id: FamilyId) => Product[]
  relatedProducts: (product: Product, limit?: number) => Product[]
  searchProducts: (query: string, limit?: number) => Product[]

  featured: Product[]
  hero: Product[]
  /** True once the API has answered — the storefront does not wait on it. */
  live: boolean
}

function build(
  products: Product[],
  families: Family[],
  categories: Category[],
  live: boolean,
): Catalogue {
  const productBySku = new Map(products.map((p) => [p.sku, p]))
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const familyById = new Map(families.map((f) => [f.id, f]))
  const familyBySlug = new Map(families.map((f) => [f.slug, f]))

  const categoriesOf = (familyId: FamilyId) =>
    categories.filter((category) => category.family === familyId)

  const productsInCategory = (id: CategoryId) =>
    products.filter((product) => product.category === id)

  const productsInFamily = (id: FamilyId) =>
    products.filter((product) => product.family === id)

  /** Same section first, then same house, never the piece itself. */
  const relatedProducts = (product: Product, limit = 4) => {
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

  /** Weighted substring scan. Small catalogue — no index to keep warm. */
  const searchProducts = (rawQuery: string, limit = 8) => {
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

  return {
    products,
    families,
    categories,
    productBySku,
    categoryById,
    familyById,
    familyBySlug,
    categoriesOf,
    productsInCategory,
    productsInFamily,
    relatedProducts,
    searchProducts,
    featured: products.filter((p) => p.featured),
    hero: products.filter((p) => p.hero),
    live,
  }
}

let snapshot = build(seedProducts, seedFamilies, seedCategories, false)

const listeners = new Set<() => void>()

/** Non-reactive read, for module-level code and state initialisers. */
export function getCatalogue(): Catalogue {
  return snapshot
}

export function setCatalogue(next: {
  products: Product[]
  families: Family[]
  categories: Category[]
}) {
  snapshot = build(next.products, next.families, next.categories, true)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useCatalogue(): Catalogue {
  return useSyncExternalStore(subscribe, getCatalogue, getCatalogue)
}
