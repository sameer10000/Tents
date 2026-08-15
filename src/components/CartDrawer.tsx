import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { motion } from 'framer-motion'
import { useCart } from '../context/cart'
import { useUI } from '../context/ui'
import { formatPrice } from '../lib/format'
import { FREE_SHIPPING_THRESHOLD } from '../lib/order'
import { Drawer } from './Drawer'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'
import { CustomTentLineItem } from './tent/CustomTentLineItem'
import { BagIcon, CloseIcon, TruckIcon } from './icons'

export function CartDrawer() {
  const { categoryById } = useCatalogue()
  const { panel, close } = useUI()
  const { lines, custom, totals, setQuantity, remove, setCustomQuantity, removeCustom } =
    useCart()

  const freeShippingProgress = Math.min(1, totals.subtotal / FREE_SHIPPING_THRESHOLD)
  const empty = lines.length === 0 && custom.length === 0
  const onRequest = custom.length > 0

  return (
    <Drawer
      open={panel === 'cart'}
      onClose={close}
      eyebrow={
        totals.units > 0
          ? `${totals.units} ${totals.units === 1 ? 'unit' : 'units'} · ${totals.lines} ${
              totals.lines === 1 ? 'piece' : 'pieces'
            }`
          : undefined
      }
      title="Your bag"
      footer={
        !empty ? (
          <div className="space-y-4">
            <dl className="space-y-2 text-sm font-light">
              {lines.length > 0 ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Shipping</dt>
                    <dd className="tabular-nums">
                      {totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">GST (18%)</dt>
                    <dd className="tabular-nums">{formatPrice(totals.gst)}</dd>
                  </div>
                </>
              ) : null}

              {onRequest ? (
                <div className="flex justify-between">
                  <dt className="text-muted">
                    {custom.length} {custom.length === 1 ? 'commission' : 'commissions'}
                  </dt>
                  <dd className="text-[0.72rem] tracking-[0.14em] text-accent uppercase">
                    On request
                  </dd>
                </div>
              ) : null}

              {lines.length > 0 ? (
                <div className="flex justify-between border-t pt-3">
                  <dt className="eyebrow self-center">
                    {onRequest ? 'Catalogue total' : 'Total'}
                  </dt>
                  <dd className="font-display text-2xl font-light tabular-nums">
                    {formatPrice(totals.total)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {/* A bag holding a commission cannot be paid for — it is quoted. */}
            <Link
              to={onRequest ? '/cart' : '/checkout'}
              onClick={close}
              className="btn-luxe btn-solid w-full"
            >
              {onRequest ? 'Request a quote' : 'Checkout'}
            </Link>
            <Link
              to="/cart"
              onClick={close}
              className="block w-full text-center text-[0.68rem] tracking-[0.22em] text-muted uppercase transition-colors hover:text-ink"
            >
              View full bag
            </Link>
          </div>
        ) : null
      }
    >
      {empty ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
          <BagIcon className="h-8 w-8 text-muted/40" />
          <p className="max-w-[26ch] font-display text-xl leading-relaxed font-light text-muted">
            Your bag is empty.
          </p>
          <Link to="/collections" onClick={close} className="btn-luxe mt-2">
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          {/* Free-shipping meter — only meaningful against priced pieces. */}
          {lines.length === 0 ? null : totals.toFreeShipping > 0 ? (
            <div className="border border-line p-4">
              <div className="flex items-center gap-2.5">
                <TruckIcon className="h-4 w-4 shrink-0 text-accent" />
                <p className="text-[0.78rem] font-light text-muted">
                  {formatPrice(totals.toFreeShipping)} more for free shipping
                </p>
              </div>
              <div className="mt-3 h-px w-full bg-line">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: freeShippingProgress }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ originX: 0 }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 border border-accent/40 bg-accent/5 p-4">
              <TruckIcon className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-[0.78rem] font-light text-ink">Shipping is on us.</p>
            </div>
          )}

          {custom.length > 0 ? (
            <ul className="space-y-6">
              {custom.map((line, index) => (
                <motion.li
                  key={line.id}
                  layout
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="border-b pb-6 last:border-b-0"
                >
                  <CustomTentLineItem
                    line={line}
                    compact
                    onNavigate={close}
                    onQuantity={(qty) => setCustomQuantity(line.id, qty)}
                    onRemove={() => removeCustom(line.id)}
                  />
                </motion.li>
              ))}
            </ul>
          ) : null}

          <ul className="space-y-6">
            {lines.map((line, index) => (
              <motion.li
                key={line.sku}
                layout
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="flex gap-4 border-b pb-6 last:border-b-0"
              >
                <Link
                  to={`/product/${line.sku}`}
                  onClick={close}
                  className="relative h-24 w-20 shrink-0 overflow-hidden"
                >
                  <ProductImage product={line.product} />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product/${line.sku}`}
                    onClick={close}
                    className="link-draw font-display text-lg leading-snug font-light"
                  >
                    {line.product.name}
                  </Link>
                  <p className="eyebrow mt-1.5">
                    {categoryById.get(line.product.category)?.name}
                  </p>

                  {line.product.channel === 'B2B' ? (
                    <p className="mt-2 text-[0.66rem] tracking-[0.14em] text-accent uppercase">
                      Quoted per project
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <QuantityStepper
                      step={line.product.moq}
                      label={line.product.name}
                      qty={line.qty}
                      size="sm"
                      onChange={(qty) => setQuantity(line.sku, qty)}
                      onFloor={() => remove(line.sku)}
                    />
                    <span className="text-sm font-light tabular-nums text-ink">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </div>

                  {line.product.moq > 1 ? (
                    <p className="mt-2 text-[0.66rem] font-light text-muted/70">
                      Sold in {line.product.moq}s
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.sku)}
                  className="-mt-1 -mr-1 h-fit p-1.5 text-muted/60 transition-colors hover:text-ink"
                  aria-label={`Remove ${line.product.name}`}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </ul>

          {onRequest ? (
            <p className="border-l-2 border-accent pl-4 text-[0.72rem] leading-relaxed font-light text-muted">
              Commissions are quoted against an approved drawing, so this bag cannot be
              paid for as it stands. Send it to us and we will come back with a figure.
            </p>
          ) : null}

          {totals.hasTradeItems ? (
            <p className="border-l-2 border-accent pl-4 text-[0.72rem] leading-relaxed font-light text-muted">
              Your bag contains trade pieces that are normally quoted against an approved
              drawing, on 50% advance / 40% before dispatch / 10% after installation. We
              will confirm those terms before anything is produced.
            </p>
          ) : null}
        </div>
      )}
    </Drawer>
  )
}
