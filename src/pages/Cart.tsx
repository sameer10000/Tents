import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/PageHeader'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { QuantityStepper } from '../components/QuantityStepper'
import { Reveal } from '../components/motion/Reveal'
import { CustomTentLineItem } from '../components/tent/CustomTentLineItem'
import { QuoteRequestPanel } from '../components/tent/QuoteRequestPanel'
import { ArrowIcon, BagIcon, CloseIcon, HeartIcon, TruckIcon } from '../components/icons'
import { useCart } from '../context/cart'
import { useWishlist } from '../context/wishlist'
import { useCatalogue } from '../data/catalogue'
import { formatPrice } from '../lib/format'
import { FREE_SHIPPING_THRESHOLD } from '../lib/order'

export function Cart() {
  const { featured, categoryById } = useCatalogue()
  const {
    lines,
    custom,
    totals,
    setQuantity,
    remove,
    clear,
    setCustomQuantity,
    removeCustom,
    hasOnRequest,
  } = useCart()
  const { has: savedHas, toggle: toggleSaved } = useWishlist()

  const suggestions = featured
    .filter((product) => !lines.some((line) => line.sku === product.sku))
    .slice(0, 4)

  const empty = lines.length === 0 && custom.length === 0

  return (
    <>
      <PageHeader
        eyebrow="Your bag"
        title={empty ? 'Nothing here' : 'Ready when'}
        subtitle={empty ? 'yet.' : 'you are.'}
        blurb={
          empty
            ? 'Add pieces from the catalogue and they will collect here. Quantities follow each piece’s minimum order.'
            : 'Quantities move in minimum-order steps. Prices exclude GST until the summary below, and freight is quoted at cost on trade orders.'
        }
        meta={
          totals.units > 0 ? `${totals.units} units · ${totals.lines} pieces` : undefined
        }
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Bag' }]}
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          {empty ? (
            <div className="flex flex-col items-center gap-7 py-24 text-center">
              <BagIcon className="h-10 w-10 text-muted/35" />
              <p className="max-w-[30ch] font-display text-2xl leading-relaxed font-light text-muted">
                One hundred and twenty-two pieces are waiting.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Link to="/collections" className="btn-luxe btn-solid">
                  The catalogue
                  <ArrowIcon className="h-4 w-4" />
                </Link>
                <Link to="/create-tent" className="btn-luxe">
                  Design your own
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
              {/* Lines */}
              <div className="lg:col-span-8">
                <div className="flex items-baseline justify-between border-b pb-4">
                  <p className="eyebrow">
                    {totals.lines + custom.length}{' '}
                    {totals.lines + custom.length === 1 ? 'piece' : 'pieces'}
                  </p>
                  <button
                    type="button"
                    onClick={clear}
                    className="text-[0.66rem] tracking-[0.22em] text-muted uppercase transition-colors hover:text-ink"
                  >
                    Empty bag
                  </button>
                </div>

                {/* Commissions sit above the catalogue lines: they are the
                    reason the bag cannot simply be paid for. */}
                {custom.length > 0 ? (
                  <ul>
                    {custom.map((line, index) => (
                      <motion.li
                        key={line.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="border-b py-8"
                      >
                        <CustomTentLineItem
                          line={line}
                          onQuantity={(qty) => setCustomQuantity(line.id, qty)}
                          onRemove={() => removeCustom(line.id)}
                        />
                      </motion.li>
                    ))}
                  </ul>
                ) : null}

                <ul>
                  {lines.map((line, index) => (
                    <motion.li
                      key={line.sku}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="grid grid-cols-12 gap-5 border-b py-8"
                    >
                      <Link
                        to={`/product/${line.sku}`}
                        className="relative col-span-4 aspect-4/5 overflow-hidden sm:col-span-3 lg:col-span-2"
                      >
                        <ProductImage product={line.product} caption={line.sku} />
                      </Link>

                      <div className="col-span-8 flex flex-col sm:col-span-9 lg:col-span-10">
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <p className="eyebrow">
                              {categoryById.get(line.product.category)?.name}
                            </p>
                            <h2 className="mt-2 font-display text-2xl leading-tight font-light">
                              <Link to={`/product/${line.sku}`} className="link-draw">
                                {line.product.name}
                              </Link>
                            </h2>
                            <p className="mt-2 max-w-[46ch] text-[0.82rem] leading-relaxed font-light text-muted">
                              {line.product.tagline}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(line.sku)}
                            className="-mt-1 shrink-0 p-1.5 text-muted/60 transition-colors hover:text-ink"
                            aria-label={`Remove ${line.product.name}`}
                          >
                            <CloseIcon className="h-4 w-4" />
                          </button>
                        </div>

                        {line.product.channel === 'B2B' ? (
                          <p className="mt-3 text-[0.66rem] tracking-[0.14em] text-accent uppercase">
                            Quoted per project · terms confirmed before production
                          </p>
                        ) : null}

                        <div className="mt-auto flex flex-wrap items-end justify-between gap-5 pt-6">
                          <div>
                            <QuantityStepper
                              step={line.product.moq}
                              label={line.product.name}
                              qty={line.qty}
                              onChange={(qty) => setQuantity(line.sku, qty)}
                              onFloor={() => remove(line.sku)}
                            />
                            <p className="mt-2.5 text-[0.68rem] font-light text-muted/70">
                              {formatPrice(line.product.price)} each
                              {line.product.moq > 1
                                ? ` · sold in ${line.product.moq}s`
                                : ''}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-display text-2xl font-light tabular-nums">
                              {formatPrice(line.lineTotal)}
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleSaved(line.sku)}
                              className="mt-2 inline-flex items-center gap-2 text-[0.64rem] tracking-[0.18em] text-muted uppercase transition-colors hover:text-accent"
                            >
                              <HeartIcon
                                className="h-3.5 w-3.5"
                                filled={savedHas(line.sku)}
                              />
                              {savedHas(line.sku) ? 'Saved' : 'Save for later'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>

                <Link
                  to="/collections"
                  className="mt-8 inline-flex items-center gap-3 text-[0.68rem] tracking-[0.22em] text-muted uppercase transition-colors hover:text-accent"
                >
                  <ArrowIcon className="h-4 w-4 rotate-180" />
                  Continue browsing
                </Link>
              </div>

              {/* Summary */}
              <div className="space-y-8 lg:col-span-4">
                {hasOnRequest ? <QuoteRequestPanel /> : null}

                {lines.length === 0 ? null : (
                <div className="border p-7 lg:sticky lg:top-32">
                  <p className="eyebrow eyebrow-accent">
                    {hasOnRequest ? 'Catalogue summary' : 'Summary'}
                  </p>

                  <dl className="mt-7 space-y-3.5 text-sm font-light">
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
                    <div className="flex items-baseline justify-between border-t pt-4">
                      <dt className="eyebrow">Total</dt>
                      <dd className="font-display text-3xl font-light tabular-nums">
                        {formatPrice(totals.total)}
                      </dd>
                    </div>
                  </dl>

                  {totals.toFreeShipping > 0 ? (
                    <div className="mt-6 flex items-start gap-2.5 border-t pt-6">
                      <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <p className="text-[0.76rem] leading-relaxed font-light text-muted">
                        Add {formatPrice(totals.toFreeShipping)} to reach free shipping
                        (orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}).
                      </p>
                    </div>
                  ) : null}

                  {/* Priced pieces can still be paid for on their own; only
                      the commissions have to wait for a quotation. */}
                  <Link to="/checkout" className="btn-luxe btn-solid mt-7 w-full">
                    {hasOnRequest ? 'Checkout catalogue pieces' : 'Proceed to checkout'}
                    <ArrowIcon className="h-4 w-4" />
                  </Link>

                  <p className="mt-5 text-[0.68rem] leading-relaxed font-light text-muted">
                    Made-to-order pieces ship in two to four weeks; stocked pieces within
                    five working days. Manufacturing defects are repaired or replaced for
                    twelve months.
                  </p>
                </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {suggestions.length > 0 ? (
        <section className="border-t py-20 lg:py-28">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
            <Reveal from="none">
              <p className="eyebrow eyebrow-accent">You may also consider</p>
            </Reveal>
            <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((product, index) => (
                <ProductCard key={product.sku} product={product} index={index} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
