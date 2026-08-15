import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogue } from '../../data/catalogue'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { ArrowIcon, PlusIcon } from '../../components/icons'
import { ProductImage } from '../../components/ProductImage'

export function AdminDashboard() {
  const { products, categories, families, productsInCategory } = useCatalogue()
  const [newEnquiries, setNewEnquiries] = useState<number | null>(null)

  // No mail goes out when a tent is designed, so the count has to be visible
  // the moment the portal opens.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const payload = await api.get<{ counts: Record<string, number> }>(
          '/custom-tents?status=new',
        )
        if (!cancelled) setNewEnquiries(payload.counts.new ?? 0)
      } catch {
        // The dashboard is still useful without it.
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const withoutPhotos = products.filter((p) => !p.images || p.images.length === 0)
  const emptySections = categories.filter((c) => productsInCategory(c.id).length === 0)
  const inventoryValue = products.reduce((sum, p) => sum + p.price, 0)

  const stats = [
    { figure: String(products.length), label: 'Pieces', to: '/admin/products' },
    {
      figure: newEnquiries === null ? '—' : String(newEnquiries),
      label: 'New enquiries',
      to: '/admin/enquiries',
    },
    { figure: String(categories.length), label: 'Sections', to: '/admin/sections' },
    { figure: String(families.length), label: 'Houses', to: '/admin/houses' },
    { figure: formatPrice(inventoryValue), label: 'Catalogue value', small: true },
  ]

  const recent = [...products].slice(-6).reverse()

  return (
    <div className="space-y-16">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow eyebrow-accent">Overview</p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-none font-light">
            The catalogue
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/houses" className="btn-luxe px-6! py-3!">
            New house
          </Link>
          <Link to="/admin/sections" className="btn-luxe px-6! py-3!">
            New section
          </Link>
          <Link to="/admin/products/new" className="btn-luxe btn-solid px-6! py-3!">
            <PlusIcon className="h-4 w-4" />
            New piece
          </Link>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const body = (
            <div className="border p-7 transition-colors duration-300 hover:border-accent">
              <p
                className={`font-display leading-none font-light tabular-nums text-accent ${
                  stat.small ? 'text-3xl' : 'text-5xl'
                }`}
              >
                {stat.figure}
              </p>
              <p className="eyebrow mt-4">{stat.label}</p>
            </div>
          )
          return stat.to ? (
            <Link key={stat.label} to={stat.to} className="block">
              {body}
            </Link>
          ) : (
            <div key={stat.label}>{body}</div>
          )
        })}
      </div>

      {/* Things worth attention */}
      <section>
        <h2 className="font-display text-2xl font-light">Worth a look</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="border p-6">
            <p className="eyebrow">Pieces without photography</p>
            <p className="mt-3 font-display text-3xl font-light tabular-nums">
              {withoutPhotos.length}
            </p>
            <p className="mt-2 max-w-[46ch] text-[0.78rem] leading-relaxed font-light text-muted">
              These render with their generated plate, which is a deliberate fallback
              rather than a gap — but a photograph will always sell better.
            </p>
          </div>

          <div className="border p-6">
            <p className="eyebrow">Sections with nothing in them</p>
            <p className="mt-3 font-display text-3xl font-light tabular-nums">
              {emptySections.length}
            </p>
            {emptySections.length > 0 ? (
              <p className="mt-2 text-[0.78rem] leading-relaxed font-light text-muted">
                {emptySections.map((section) => section.name).join(' · ')}
              </p>
            ) : (
              <p className="mt-2 text-[0.78rem] font-light text-muted">
                Every section holds at least one piece.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Recently added */}
      <section>
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-2xl font-light">Recently added</h2>
          <Link
            to="/admin/products"
            className="flex items-center gap-2 text-[0.66rem] tracking-[0.2em] text-muted uppercase transition-colors hover:text-accent"
          >
            All pieces
            <ArrowIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {recent.map((product) => (
            <Link
              key={product.sku}
              to={`/admin/products/${product.sku}`}
              className="group block"
            >
              <div className="relative aspect-4/5 overflow-hidden border">
                <ProductImage product={product} />
              </div>
              <p className="mt-2.5 truncate font-display text-base font-light">
                {product.name}
              </p>
              <p className="eyebrow mt-1">{product.sku}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
