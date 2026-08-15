import { motion } from 'framer-motion'
import { useCatalogue } from '../data/catalogue'
import { Link } from 'react-router-dom'
import { useCart } from '../context/cart'
import { useUI } from '../context/ui'
import { useWishlist } from '../context/wishlist'
import type { Product } from '../data/types'
import { formatUnitPrice } from '../lib/format'
import { ProductImage } from './ProductImage'
import { ArrowIcon, BagIcon, CheckIcon, HeartIcon } from './icons'

interface ProductCardProps {
  product: Product
  index?: number
  /** Drops the spec strip and shortens the copy — for dense related grids. */
  compact?: boolean
  priority?: boolean
}

export function ProductCard({
  product,
  index = 0,
  compact = false,
  priority = false,
}: ProductCardProps) {
  const { categoryById } = useCatalogue()
  const { has, toggle } = useWishlist()
  const { add, has: inBag, quantityOf } = useCart()
  const { open } = useUI()
  const saved = has(product.sku)
  const bagged = inBag(product.sku)
  const category = categoryById.get(product.category)

  // Three facts, whichever three this product actually has.
  const specs = [product.capacity, product.weight, product.waterproof].filter(
    Boolean,
  ) as string[]

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      // Fire as soon as any sliver is on screen. A stricter threshold left the
      // last row stuck at opacity 0 when the page could not scroll further.
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        duration: 0.85,
        // Stagger within a row, then reset — long lists should not accumulate
        // a delay that leaves the last card waiting seconds to appear.
        delay: (index % 4) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative flex flex-col"
    >
      <Link to={`/product/${product.sku}`} className="relative block overflow-hidden">
        <div className="relative aspect-4/5 overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
            <ProductImage product={product} priority={priority} />
          </div>

          {/* Gradient floor for the hover strip to sit on. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950/75 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          {specs.length > 0 && !compact ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-3 flex-wrap gap-x-4 gap-y-1 p-5 opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
              {specs.map((spec) => (
                <span
                  key={spec}
                  className="text-[0.6rem] tracking-[0.2em] text-ivory-100/85 uppercase"
                >
                  {spec}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {product.badge ? (
          <span className="absolute top-4 left-4 border border-ivory-100/25 bg-ink-950/35 px-3 py-1.5 text-[0.55rem] tracking-[0.28em] text-ivory-100 uppercase backdrop-blur-sm">
            {product.badge}
          </span>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={() => toggle(product.sku)}
        aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
        aria-pressed={saved}
        className={`absolute top-3.5 right-3.5 p-2.5 transition-all duration-500 ${
          saved
            ? 'text-brass-300 opacity-100'
            : 'text-ivory-100/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        } hover:text-brass-300`}
      >
        <HeartIcon className="h-[17px] w-[17px]" filled={saved} />
      </button>

      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow">
          {category?.name}
          <span className="ml-2 text-muted/45">{product.sku}</span>
        </p>

        <h3 className="mt-2.5 font-display text-[1.4rem] leading-tight font-light">
          <Link to={`/product/${product.sku}`} className="link-draw">
            {product.name}
          </Link>
        </h3>

        {!compact ? (
          <p className="mt-2.5 text-[0.82rem] leading-relaxed font-light text-muted">
            {product.tagline}
          </p>
        ) : null}

        {!compact && product.colors.length > 0 ? (
          <div className="mt-4 flex items-center gap-1.5">
            {product.colors.map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-line-strong ring-offset-2 ring-offset-surface"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            <span className="ml-1.5 text-[0.6rem] tracking-[0.18em] text-muted/60 uppercase">
              {product.colors.length}{' '}
              {product.colors.length === 1 ? 'finish' : 'finishes'}
            </span>
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.95rem] font-light tabular-nums text-ink">
              {formatUnitPrice(product.price, product.unit)}
            </span>

            <Link
              to={`/product/${product.sku}`}
              className="flex items-center gap-2 text-[0.62rem] tracking-[0.24em] text-muted uppercase transition-colors duration-500 group-hover:text-accent"
            >
              Explore
              <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => (bagged ? open('cart') : add(product.sku))}
            className={`mt-4 flex w-full items-center justify-center gap-2.5 border py-3 text-[0.62rem] tracking-[0.24em] uppercase transition-colors duration-500 ${
              bagged
                ? 'border-accent text-accent'
                : 'text-muted hover:border-accent hover:text-ink'
            }`}
          >
            {bagged ? (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                In bag · {quantityOf(product.sku)}
              </>
            ) : (
              <>
                <BagIcon className="h-3.5 w-3.5" />
                {/* MOQ is stated up front — a piece sold in 25s should never
                    look like it can be bought as one. */}
                {product.moq > 1 ? `Add ${product.moq} to bag` : 'Add to bag'}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
