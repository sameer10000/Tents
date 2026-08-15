import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Category, Product } from '../data/types'
import { PagedCarousel } from './PagedCarousel'
import { ProductCard } from './ProductCard'
import { CloseIcon, FilterIcon, GridIcon, RowsIcon } from './icons'

type Sort = 'curated' | 'price-asc' | 'price-desc' | 'name'
type Band = 'all' | 'under-5k' | '5k-25k' | '25k-1l' | 'over-1l'

const BANDS: Array<{ id: Band; label: string; test: (price: number) => boolean }> = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'under-5k', label: 'Under ₹5,000', test: (p) => p < 5000 },
  { id: '5k-25k', label: '₹5,000 – ₹25,000', test: (p) => p >= 5000 && p < 25000 },
  { id: '25k-1l', label: '₹25,000 – ₹1L', test: (p) => p >= 25000 && p < 100000 },
  { id: 'over-1l', label: 'Above ₹1L', test: (p) => p >= 100000 },
]

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: 'curated', label: 'Curated' },
  { id: 'price-asc', label: 'Price ascending' },
  { id: 'price-desc', label: 'Price descending' },
  { id: 'name', label: 'Alphabetical' },
]

interface CatalogueViewProps {
  products: Product[]
  /** Section chips. Omit to hide the section filter entirely. */
  categories?: Category[]
}

export function CatalogueView({ products, categories = [] }: CatalogueViewProps) {
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [band, setBand] = useState<Band>('all')
  const [channels, setChannels] = useState<string[]>([])
  const [sort, setSort] = useState<Sort>('curated')
  const [dense, setDense] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    const bandTest = BANDS.find((b) => b.id === band)?.test ?? (() => true)

    const result = products.filter((product) => {
      if (activeCategories.length > 0 && !activeCategories.includes(product.category)) {
        return false
      }
      if (!bandTest(product.price)) return false
      if (channels.length > 0 && !channels.some((c) => product.channel.includes(c))) {
        return false
      }
      return true
    })

    switch (sort) {
      case 'price-asc':
        return [...result].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...result].sort((a, b) => b.price - a.price)
      case 'name':
        return [...result].sort((a, b) => a.name.localeCompare(b.name))
      default:
        // Curated: promoted pieces first, then by descending price so the
        // anchor products lead each section.
        return [...result].sort((a, b) => {
          const weight = Number(Boolean(b.featured)) - Number(Boolean(a.featured))
          return weight !== 0 ? weight : b.price - a.price
        })
    }
  }, [products, activeCategories, band, channels, sort])

  const activeCount = activeCategories.length + channels.length + (band === 'all' ? 0 : 1)

  // Used as the carousel's key: any change to the result set — or to the
  // density, which changes how many fit on a page — remounts it back to page one
  // rather than leaving the track parked deep in a list that no longer exists.
  const signature = `${activeCategories.join()}|${band}|${channels.join()}|${sort}|${dense}|${products.length}`

  function toggleIn(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  function reset() {
    setActiveCategories([])
    setBand('all')
    setChannels([])
  }

  const filterPanel = (
    <div className="space-y-9">
      {categories.length > 1 ? (
        <fieldset>
          <legend className="eyebrow">Section</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = activeCategories.includes(category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    toggleIn(activeCategories, category.id, setActiveCategories)
                  }
                  className={`border px-3.5 py-2 text-[0.68rem] tracking-[0.12em] transition-colors duration-400 ${
                    active
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'text-muted hover:border-accent hover:text-ink'
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="eyebrow">Price</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {BANDS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setBand(option.id)}
              className={`border px-3.5 py-2 text-[0.68rem] tracking-[0.12em] transition-colors duration-400 ${
                band === option.id
                  ? 'border-accent bg-accent/10 text-ink'
                  : 'text-muted hover:border-accent hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Counter</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: 'D2C', label: 'Direct' },
            { id: 'B2B', label: 'Trade & projects' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleIn(channels, option.id, setChannels)}
              className={`border px-3.5 py-2 text-[0.68rem] tracking-[0.12em] transition-colors duration-400 ${
                channels.includes(option.id)
                  ? 'border-accent bg-accent/10 text-ink'
                  : 'text-muted hover:border-accent hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {activeCount > 0 ? (
        <button
          type="button"
          onClick={reset}
          className="text-[0.66rem] tracking-[0.22em] text-accent uppercase"
        >
          Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
        </button>
      ) : null}
    </div>
  )

  return (
    <div>
      {/* Control bar */}
      <div className="sticky top-[72px] z-30 -mx-5 mb-10 border-y bg-surface/85 px-5 py-4 backdrop-blur-lg lg:top-[86px] lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-2.5 text-[0.66rem] tracking-[0.24em] text-ink uppercase transition-colors hover:text-accent"
              aria-expanded={filtersOpen}
            >
              <FilterIcon className="h-4 w-4" />
              Filter
              {activeCount > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.55rem] text-surface tabular-nums">
                  {activeCount}
                </span>
              ) : null}
            </button>

            <span className="hidden text-[0.66rem] tracking-[0.2em] text-muted uppercase tabular-nums sm:inline">
              {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2.5">
              <span className="hidden text-[0.66rem] tracking-[0.24em] text-muted uppercase sm:inline">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="appearance-none border-0 bg-transparent py-1 text-[0.72rem] font-light text-ink focus:outline-none"
              >
                {SORTS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                onClick={() => setDense(false)}
                className={`p-2 transition-colors ${dense ? 'text-muted/50' : 'text-accent'}`}
                aria-label="Three columns"
              >
                <RowsIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDense(true)}
                className={`p-2 transition-colors ${dense ? 'text-accent' : 'text-muted/50'}`}
                aria-label="Four columns"
              >
                <GridIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {filtersOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="relative pt-8 pb-4">
                {filterPanel}
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="absolute top-6 right-0 p-1.5 text-muted transition-colors hover:text-ink"
                  aria-label="Close filters"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-28 text-center">
          <p className="font-display text-2xl font-light text-muted">
            No pieces match that combination.
          </p>
          <button type="button" onClick={reset} className="btn-luxe mt-8">
            Clear filters
          </button>
        </div>
      ) : (
        <PagedCarousel
          key={signature}
          label="catalogue"
          itemsPerPage={dense ? 8 : 6}
          gridClassName={`grid-cols-2 ${dense ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
          gapClassName="gap-x-6 gap-y-14"
        >
          {filtered.map((product, index) => (
            <ProductCard
              key={product.sku}
              product={product}
              index={index}
              priority={index < 4}
            />
          ))}
        </PagedCarousel>
      )}
    </div>
  )
}
