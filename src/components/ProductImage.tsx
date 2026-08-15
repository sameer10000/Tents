import { useState } from 'react'
import type { Product } from '../data/types'
import { ProductPlate } from './ProductPlate'

interface ProductImageProps {
  product: Product
  /** 0 is the primary view; higher indices vary the ground and light. */
  view?: number
  caption?: string
  /** Skip lazy-loading for anything above the fold. */
  priority?: boolean
  className?: string
}

/**
 * The plate is always rendered underneath. A photograph fades in over it when
 * one exists — either uploaded through the admin portal (`product.images`) or
 * dropped into `public/images/products/<sku>.jpg`.
 *
 * Consequence: there is never a broken image and never a layout shift.
 */
export function ProductImage({
  product,
  view = 0,
  caption,
  priority = false,
  className = '',
}: ProductImageProps) {
  const sku = product.sku.toLowerCase()

  // Uploaded imagery wins; the file convention is the fallback for anything
  // added by hand.
  const uploaded = product.images?.[view]
  const src =
    uploaded ??
    (view === 0
      ? `/images/products/${sku}.jpg`
      : `/images/products/${sku}-${view + 1}.jpg`)

  // Keyed by src so switching product or view resets the fade rather than
  // showing the previous photo while the next one loads.
  const [loaded, setLoaded] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  const seed = view === 0 ? product.sku : `${product.sku}-${view}`

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <ProductPlate plate={product.plate} seed={seed} caption={caption} />

      {failed === src ? null : (
        <img
          key={src}
          src={src}
          alt={`${product.name} — ${product.tagline}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            loaded === src ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
