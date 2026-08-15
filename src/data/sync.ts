import { api } from '../lib/api'
import { setCatalogue } from './catalogue'
import type { Category, Family, Product } from './types'

export interface CataloguePayload {
  products: Product[]
  families: Family[]
  categories: Category[]
}

/** Pulls the catalogue from the API and pushes it into the live store. */
export async function fetchCatalogue(): Promise<CataloguePayload> {
  return api.get<CataloguePayload>('/catalogue')
}

/** Called after every admin write so the storefront reflects it immediately. */
export async function refreshCatalogue(): Promise<CataloguePayload> {
  const catalogue = await fetchCatalogue()
  setCatalogue(catalogue)
  return catalogue
}
