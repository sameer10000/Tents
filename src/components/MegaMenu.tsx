import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { PagedCarousel } from './PagedCarousel'
import { ProductImage } from './ProductImage'
import { ArrowIcon } from './icons'

interface MegaMenuProps {
  onNavigate: () => void
}

/** The one product promoted inside the menu. Kept stable on purpose. */
const SPOTLIGHT_SKU = 'T02'

/**
 * Full-width collections panel. Four columns of houses, then a spotlight plate.
 * Every category in the catalogue is reachable from here in one click.
 */
export function MegaMenu({ onNavigate }: MegaMenuProps) {
  const { categoriesOf, families, productsInCategory, productBySku } = useCatalogue()
  const spotlight = productBySku.get(SPOTLIGHT_SKU)

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-full hidden border-t border-b bg-surface shadow-[0_50px_90px_-45px_rgba(0,0,0,0.55)] lg:block"
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-10 px-10 py-12">
        {/* One row of houses at a time, paged sideways. Eleven houses stacked
            three rows deep ran off the bottom of the viewport. */}
        <div className="col-span-9">
          <PagedCarousel
            label="houses"
            itemsPerPage={4}
            gridClassName="grid-cols-4 content-start min-h-[286px]"
            gapClassName="gap-x-8 gap-y-10"
          >
            {families.map((family, familyIndex) => {
              const cats = categoriesOf(family.id)
              return (
                <motion.div
                  key={family.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.05 + familyIndex * 0.035,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    to={`/collections/${family.slug}`}
                    onClick={onNavigate}
                    className="link-draw font-display text-xl font-light text-ink"
                  >
                    {family.name}
                  </Link>
                  <p className="eyebrow mt-2">{family.kicker}</p>

                  <ul className="mt-5 space-y-2.5">
                    {cats.map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/catalogue/${category.slug}`}
                          onClick={onNavigate}
                          className="group flex items-baseline gap-2 text-[0.82rem] font-light text-muted transition-colors duration-300 hover:text-ink"
                        >
                          <span className="link-draw">{category.name}</span>
                          <span className="text-[0.62rem] tabular-nums text-muted/45">
                            {productsInCategory(category.id).length}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </PagedCarousel>
        </div>

        {spotlight ? (
          <motion.div
            className="col-span-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={`/product/${spotlight.sku}`}
              onClick={onNavigate}
              className="group block"
            >
              {/* Square rather than 4:5 — the taller crop pushed the panel past
                  the bottom of the viewport on laptop screens. */}
              <div className="relative aspect-square overflow-hidden">
                <ProductImage product={spotlight} caption={spotlight.sku} />
                <div className="absolute inset-0 bg-ink-950/0 transition-colors duration-700 group-hover:bg-ink-950/20" />
              </div>
              <p className="eyebrow eyebrow-accent mt-5">The Signature</p>
              <h3 className="mt-2 font-display text-2xl font-light">{spotlight.name}</h3>
              <p className="mt-2 text-[0.82rem] leading-relaxed font-light text-muted">
                {spotlight.tagline}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[0.68rem] tracking-[0.24em] uppercase text-accent">
                Explore
                <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1.5" />
              </span>
            </Link>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
}
