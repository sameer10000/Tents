import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useUI } from '../context/ui'
import { useCatalogue } from '../data/catalogue'
import { formatPrice } from '../lib/format'
import { ProductImage } from './ProductImage'
import { CloseIcon, SearchIcon } from './icons'

const SUGGESTIONS = [
  'Bell tent',
  'Waxed duffel',
  'Expedition',
  'Down sleeping bag',
  'Rooftop',
  'Shade sail',
  'Brass lantern',
]

export function SearchOverlay() {
  const { panel } = useUI()
  return <AnimatePresence>{panel === 'search' ? <SearchPanel /> : null}</AnimatePresence>
}

/**
 * Split out so the query lives and dies with the panel — closing the overlay
 * unmounts this, which clears the field without an effect resetting state.
 */
function SearchPanel() {
  const { searchProducts, categoryById } = useCatalogue()
  const { close } = useUI()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => searchProducts(query), [query, searchProducts])

  useEffect(() => {
    // A frame's delay lets the overlay mount before focus moves, otherwise
    // iOS Safari refuses to raise the keyboard.
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[80]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-ink-950/70 backdrop-blur-md"
        onClick={close}
        aria-label="Close search"
      />

      <motion.div
        className="glass relative mx-auto max-h-[88dvh] w-full max-w-[900px] overflow-y-auto border-b shadow-2xl"
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -28, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-4 border-b px-6 py-6 lg:px-10">
          <SearchIcon className="h-5 w-5 shrink-0 text-accent" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the catalogue"
            className="w-full bg-transparent font-display text-2xl font-light text-ink placeholder:text-muted/50 focus:outline-none lg:text-3xl"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={close}
            className="shrink-0 p-1.5 text-muted transition-colors hover:text-ink"
            aria-label="Close search"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-7 lg:px-10">
          {query.trim().length < 2 ? (
            <div>
              <p className="eyebrow">Suggested</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="border px-4 py-2 text-[0.72rem] font-light tracking-wide text-muted transition-colors duration-400 hover:border-accent hover:text-ink"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center font-display text-xl font-light text-muted">
              Nothing in the catalogue matches “{query}”.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((product, index) => (
                <motion.li
                  key={product.sku}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                >
                  <Link
                    to={`/product/${product.sku}`}
                    onClick={close}
                    className="group flex items-center gap-5 border-b py-4 transition-colors duration-400 last:border-b-0 hover:border-accent"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                      <ProductImage product={product} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-light text-ink">
                        {product.name}
                      </p>
                      <p className="eyebrow mt-1">
                        {categoryById.get(product.category)?.name} · {product.sku}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-light tabular-nums text-muted transition-colors group-hover:text-accent">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
