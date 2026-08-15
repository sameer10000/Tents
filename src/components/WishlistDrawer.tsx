import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { motion } from 'framer-motion'
import { useUI } from '../context/ui'
import { useWishlist } from '../context/wishlist'
import { formatPrice } from '../lib/format'
import { Drawer } from './Drawer'
import { ProductImage } from './ProductImage'
import { CloseIcon, HeartIcon } from './icons'

export function WishlistDrawer() {
  const { categoryById } = useCatalogue()
  const { panel, close, openInquiry } = useUI()
  const { items, remove, clear, count } = useWishlist()

  const total = items.reduce((sum, product) => sum + product.price, 0)

  return (
    <Drawer
      open={panel === 'wishlist'}
      onClose={close}
      eyebrow={count > 0 ? `${count} ${count === 1 ? 'piece' : 'pieces'}` : undefined}
      title="Saved"
      footer={
        count > 0 ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Indicative total</span>
              <span className="font-display text-2xl font-light tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openInquiry()}
              className="btn-luxe btn-solid w-full"
            >
              Request a quotation
            </button>
            <button
              type="button"
              onClick={clear}
              className="w-full text-[0.68rem] tracking-[0.22em] uppercase text-muted transition-colors hover:text-ink"
            >
              Clear list
            </button>
          </div>
        ) : null
      }
    >
      {count === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
          <HeartIcon className="h-8 w-8 text-muted/40" />
          <p className="max-w-[26ch] font-display text-xl leading-relaxed font-light text-muted">
            Nothing saved yet. Mark the pieces you want to discuss and they will collect
            here.
          </p>
          <Link to="/collections" onClick={close} className="btn-luxe mt-2">
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {items.map((product, index) => (
            <motion.li
              key={product.sku}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="flex gap-4 border-b pb-5 last:border-b-0"
            >
              <Link
                to={`/product/${product.sku}`}
                onClick={close}
                className="relative h-24 w-20 shrink-0 overflow-hidden"
              >
                <ProductImage product={product} />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${product.sku}`}
                  onClick={close}
                  className="link-draw font-display text-lg leading-snug font-light"
                >
                  {product.name}
                </Link>
                <p className="eyebrow mt-1.5">
                  {categoryById.get(product.category)?.name}
                </p>
                <p className="mt-2 text-sm font-light tabular-nums text-accent">
                  {formatPrice(product.price)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remove(product.sku)}
                className="-mt-1 -mr-1 h-fit p-1.5 text-muted/60 transition-colors hover:text-ink"
                aria-label={`Remove ${product.name}`}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
