import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogue } from '../../data/catalogue'
import { refreshCatalogue } from '../../data/sync'
import { ApiError, api } from '../../lib/api'
import { formatUnitPrice } from '../../lib/format'
import { ProductImage } from '../../components/ProductImage'
import { Banner, inputClass } from '../../components/admin/fields'
import { PlusIcon, SearchIcon } from '../../components/icons'

export function AdminProducts() {
  const { products, categories, categoryById } = useCatalogue()
  const [query, setQuery] = useState('')
  const [section, setSection] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [pendingSku, setPendingSku] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      if (section !== 'all' && product.category !== section) return false
      if (!needle) return true
      return (
        product.name.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle) ||
        product.tagline.toLowerCase().includes(needle)
      )
    })
  }, [products, query, section])

  async function remove(sku: string, name: string) {
    if (!window.confirm(`Delete ${name} (${sku})? This cannot be undone.`)) return

    setPendingSku(sku)
    setError(null)
    try {
      await api.delete(`/products/${sku}`)
      await refreshCatalogue()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not delete that piece.')
    } finally {
      setPendingSku(null)
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow eyebrow-accent">Pieces</p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-none font-light">
            {products.length} in the catalogue
          </h1>
        </div>
        <Link to="/admin/products/new" className="btn-luxe btn-solid px-6! py-3!">
          <PlusIcon className="h-4 w-4" />
          New piece
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-4 border-y py-4">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SKU or tagline"
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={section}
          onChange={(event) => setSection(event.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="all">All sections</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <span className="text-[0.68rem] tracking-[0.18em] text-muted uppercase tabular-nums">
          {filtered.length} shown
        </span>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="border-t">
        {filtered.map((product) => (
          <div
            key={product.sku}
            className="grid grid-cols-12 items-center gap-4 border-b py-4"
          >
            <Link
              to={`/admin/products/${product.sku}`}
              className="relative col-span-2 aspect-4/5 max-w-[64px] overflow-hidden border sm:col-span-1"
            >
              <ProductImage product={product} />
            </Link>

            <div className="col-span-10 min-w-0 sm:col-span-4">
              <Link
                to={`/admin/products/${product.sku}`}
                className="link-draw font-display text-lg leading-tight font-light"
              >
                {product.name}
              </Link>
              <p className="eyebrow mt-1">
                {product.sku}
                {product.images && product.images.length > 0 ? (
                  <span className="ml-2 text-accent">{product.images.length} photo</span>
                ) : (
                  <span className="ml-2 text-muted/45">plate only</span>
                )}
              </p>
            </div>

            <p className="col-span-6 text-[0.78rem] font-light text-muted sm:col-span-3">
              {categoryById.get(product.category)?.name ?? product.category}
            </p>

            <p className="col-span-3 text-[0.82rem] font-light tabular-nums sm:col-span-2">
              {formatUnitPrice(product.price, product.unit)}
            </p>

            <div className="col-span-3 flex justify-end gap-3 sm:col-span-2">
              <Link
                to={`/admin/products/${product.sku}`}
                className="text-[0.64rem] tracking-[0.18em] text-muted uppercase transition-colors hover:text-accent"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => void remove(product.sku, product.name)}
                disabled={pendingSku === product.sku}
                className="text-[0.64rem] tracking-[0.18em] text-muted uppercase transition-colors hover:text-ink disabled:opacity-40"
              >
                {pendingSku === product.sku ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <p className="py-16 text-center font-display text-xl font-light text-muted">
            Nothing matches that.
          </p>
        ) : null}
      </div>
    </div>
  )
}
