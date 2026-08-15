import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProductCard } from '../components/ProductCard'
import { ProductGallery } from '../components/ProductGallery'
import { QuantityStepper } from '../components/QuantityStepper'
import { Reveal } from '../components/motion/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ArrowIcon, BagIcon, HeartIcon } from '../components/icons'
import { useCart } from '../context/cart'
import { useUI } from '../context/ui'
import { useWishlist } from '../context/wishlist'
import { useCatalogue } from '../data/catalogue'
import type { Product as ProductType } from '../data/types'
import { formatPrice, formatUnitPrice } from '../lib/format'

const CHANNEL_COPY: Record<string, string> = {
  D2C: 'Available direct',
  B2B: 'Trade & projects — quoted',
  'D2C/B2B': 'Direct and trade',
  'B2B/D2C': 'Trade and direct',
}

/**
 * Route wrapper. Resolving the product here lets the view below hold state that
 * depends on it — and the `key` remounts that state when you move between
 * pieces, so a quantity of 50 never carries over to a piece sold in ones.
 */
export function Product() {
  const { productBySku } = useCatalogue()
  const { sku = '' } = useParams()
  const product = productBySku.get(sku.toUpperCase())

  if (!product) return <Navigate to="/collections" replace />

  return <ProductView key={product.sku} product={product} />
}

function ProductView({ product }: { product: ProductType }) {
  const { relatedProducts, categoryById, familyById } = useCatalogue()
  const { openInquiry, open } = useUI()
  const { has, toggle } = useWishlist()
  const { add, has: inBag, quantityOf } = useCart()
  const [colorIndex, setColorIndex] = useState(0)
  const [qty, setQty] = useState(product.moq)

  const category = categoryById.get(product.category)
  const family = familyById.get(product.family)
  const related = relatedProducts(product, 4)
  const saved = has(product.sku)
  const isTrade = product.channel === 'B2B'

  const specs = buildSpecs(product)

  return (
    <>
      <div className="pt-[104px] lg:pt-[128px]">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2.5 py-6"
          >
            <Link to="/" className="eyebrow link-draw hover:text-ink">
              Home
            </Link>
            <span className="text-muted/35">/</span>
            {family ? (
              <>
                <Link
                  to={`/collections/${family.slug}`}
                  className="eyebrow link-draw hover:text-ink"
                >
                  {family.name}
                </Link>
                <span className="text-muted/35">/</span>
              </>
            ) : null}
            {category ? (
              <>
                <Link
                  to={`/catalogue/${category.slug}`}
                  className="eyebrow link-draw hover:text-ink"
                >
                  {category.name}
                </Link>
                <span className="text-muted/35">/</span>
              </>
            ) : null}
            <span className="eyebrow text-muted/60">{product.sku}</span>
          </nav>
        </div>

        {/* Gallery + summary */}
        <section className="mx-auto max-w-[1500px] px-5 pb-20 lg:px-10 lg:pb-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-[112px]">
                <ProductGallery product={product} />
              </div>
            </div>

            <div className="lg:col-span-5">
              <Reveal from="none" duration={0.8}>
                <p className="eyebrow eyebrow-accent">{category?.name}</p>
              </Reveal>

              <SplitHeading
                text={product.name}
                as="h1"
                delay={0.08}
                className="mt-5 font-display text-[clamp(2.4rem,4.6vw,3.6rem)] leading-[1.02] font-light"
              />

              <Reveal delay={0.2}>
                <p className="mt-5 font-display text-xl leading-relaxed font-light text-muted italic">
                  {product.tagline}
                </p>
              </Reveal>

              <Reveal delay={0.26}>
                <div className="mt-8 flex items-baseline gap-4">
                  <span className="font-display text-4xl font-light tabular-nums">
                    {formatUnitPrice(product.price, product.unit)}
                  </span>
                  {isTrade ? (
                    <span className="eyebrow">Indicative · quoted per project</span>
                  ) : null}
                </div>
                <p className="eyebrow mt-3">
                  {CHANNEL_COPY[product.channel]} · MOQ {product.moq}
                </p>
              </Reveal>

              <Reveal delay={0.32}>
                <p className="mt-8 text-sm leading-[1.9] font-light text-ink-soft">
                  {product.description}
                </p>
              </Reveal>

              {/* Colourways */}
              <Reveal delay={0.36}>
                <div className="mt-10">
                  <div className="flex items-baseline justify-between">
                    <p className="eyebrow">Colourway</p>
                    <p className="text-[0.72rem] font-light text-muted">
                      {product.colors[colorIndex]?.name}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {product.colors.map((color, index) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setColorIndex(index)}
                        aria-label={color.name}
                        aria-pressed={colorIndex === index}
                        className={`h-9 w-9 rounded-full transition-all duration-400 ${
                          colorIndex === index
                            ? 'ring-1 ring-accent ring-offset-4 ring-offset-surface'
                            : 'ring-1 ring-line ring-offset-2 ring-offset-surface hover:ring-line-strong'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Quantity */}
              <Reveal delay={0.4}>
                <div className="mt-10 flex items-center justify-between gap-6 border-y py-5">
                  <div>
                    <p className="eyebrow">Quantity</p>
                    {product.moq > 1 ? (
                      <p className="mt-1.5 text-[0.72rem] font-light text-muted">
                        Sold in {product.moq}s
                      </p>
                    ) : null}
                  </div>
                  <QuantityStepper
                    step={product.moq}
                    label={product.name}
                    qty={qty}
                    onChange={setQty}
                    onFloor={() => setQty(product.moq)}
                  />
                </div>
              </Reveal>

              {/* Actions */}
              <Reveal delay={0.44}>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      add(product.sku, qty)
                      open('cart')
                    }}
                    className="btn-luxe btn-solid w-full"
                  >
                    <BagIcon className="h-4 w-4" />
                    Add to bag · {formatPrice(product.price * qty)}
                  </button>

                  {/* Commissions can be drawn on screen before anyone writes
                      an email about them. */}
                  {product.category === 'bespoke' ? (
                    <Link to="/create-tent" className="btn-luxe w-full">
                      Design it live
                      <ArrowIcon className="h-4 w-4" />
                    </Link>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openInquiry(product.sku)}
                      className="btn-luxe w-full px-4!"
                    >
                      {isTrade ? 'Request a quote' : 'Enquire'}
                      <ArrowIcon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggle(product.sku)}
                      className="btn-luxe w-full px-4!"
                      aria-pressed={saved}
                    >
                      <HeartIcon className="h-4 w-4" filled={saved} />
                      {saved ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  {inBag(product.sku) ? (
                    <p className="text-center text-[0.72rem] font-light text-accent">
                      {quantityOf(product.sku)} already in your bag
                    </p>
                  ) : null}
                </div>
              </Reveal>

              {/* Key specification */}
              <Reveal delay={0.48}>
                <dl className="mt-12 divide-y border-t">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-8 py-4">
                      <dt className="eyebrow shrink-0">{spec.label}</dt>
                      <dd className="text-right text-[0.82rem] font-light text-ink-soft">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      {/* Materials & detail */}
      <section className="border-y bg-surface-2 py-24 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">Materials</p>
              </Reveal>
              <SplitHeading
                text="What it is made of."
                className="mt-6 font-display text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] font-light"
              />
              <Reveal delay={0.2}>
                <ul className="mt-8 space-y-4">
                  {product.materials.map((material, index) => (
                    <li key={material} className="flex gap-4 border-b pb-4">
                      <span className="font-display text-sm tabular-nums text-accent">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[0.85rem] leading-relaxed font-light text-ink-soft">
                        {material}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {product.details && product.details.length > 0 ? (
              <div className="lg:col-span-8">
                <Reveal from="none">
                  <p className="eyebrow eyebrow-accent">Detail</p>
                </Reveal>
                <div className="mt-6 grid gap-x-12 gap-y-8 sm:grid-cols-2">
                  {product.details.map((detail, index) => (
                    <Reveal key={detail} delay={(index % 2) * 0.08}>
                      <div className="flex gap-4">
                        <span className="mt-2.5 h-px w-6 shrink-0 bg-accent" />
                        <p className="text-[0.9rem] leading-[1.8] font-light text-ink-soft">
                          {detail}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <Reveal delay={0.3}>
                  <div className="mt-14 border-t pt-8">
                    <p className="eyebrow">Terms</p>
                    <p className="mt-4 max-w-[62ch] text-[0.85rem] leading-[1.85] font-light text-muted">
                      {isTrade
                        ? 'Quoted per project against an approved drawing. Fifty per cent advance, forty before dispatch, ten after installation. Freight, site work and installation are quoted as separate line items.'
                        : 'Prices exclude GST and freight. Made-to-order pieces ship in two to four weeks; stocked pieces within five working days. Manufacturing defects are repaired or replaced for twelve months.'}
                    </p>
                  </div>
                </Reveal>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 ? (
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <Reveal from="none">
                  <p className="eyebrow eyebrow-accent">Considered alongside</p>
                </Reveal>
                <SplitHeading
                  text="From the same house."
                  className="mt-5 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] leading-tight font-light"
                />
              </div>
              {category ? (
                <Reveal delay={0.15}>
                  <Link
                    to={`/catalogue/${category.slug}`}
                    className="btn-luxe hidden sm:inline-flex"
                  >
                    All {category.name}
                  </Link>
                </Reveal>
              ) : null}
            </div>

            <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item, index) => (
                <ProductCard key={item.sku} product={item} index={index} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Sticky mobile action bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t px-5 py-3.5 lg:hidden"
      >
        <div className="min-w-0">
          <p className="truncate text-[0.78rem] font-light text-ink">{product.name}</p>
          <p className="text-[0.82rem] font-light tabular-nums text-accent">
            {formatPrice(product.price)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openInquiry(product.sku)}
          className="btn-luxe btn-solid shrink-0 px-5! py-3!"
        >
          Enquire
        </button>
      </motion.div>
    </>
  )
}

function buildSpecs(product: ProductType): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: 'Capacity', value: product.capacity },
    { label: 'Weight', value: product.weight },
    { label: 'Weather rating', value: product.waterproof },
    { label: 'Temperature', value: product.temperature },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Packed', value: product.packed },
    { label: 'Reference', value: product.sku },
  ]

  return rows.filter((row): row is { label: string; value: string } => Boolean(row.value))
}
