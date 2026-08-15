import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useCatalogue } from '../../data/catalogue'
import { refreshCatalogue } from '../../data/sync'
import { ApiError, api } from '../../lib/api'
import { PLATE_ART } from '../../lib/plate'
import { formatPrice } from '../../lib/format'
import type { ColorVariant, Product } from '../../data/types'
import { ProductCard } from '../../components/ProductCard'
import { ImageUploader } from '../../components/admin/ImageUploader'
import {
  Banner,
  ColourField,
  Field,
  Fieldset,
  ListField,
  Toggle,
  inputClass,
} from '../../components/admin/fields'
import { ArrowIcon } from '../../components/icons'

const CHANNELS = ['D2C', 'B2B', 'D2C/B2B', 'B2B/D2C'] as const
const PLATES = Object.keys(PLATE_ART).sort()

interface Draft {
  sku: string
  name: string
  category: string
  tagline: string
  description: string
  price: string
  unit: string
  cogs: string
  channel: string
  moq: string
  capacity: string
  weight: string
  waterproof: string
  dimensions: string
  packed: string
  temperature: string
  materials: string[]
  details: string[]
  colors: ColorVariant[]
  images: string[]
  plate: string
  badge: string
  featured: boolean
  hero: boolean
}

function draftFrom(product: Product | undefined, fallbackCategory: string): Draft {
  return {
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    category: product?.category ?? fallbackCategory,
    tagline: product?.tagline ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    unit: product?.unit ?? '',
    cogs: product ? String(product.cogs) : '',
    channel: product?.channel ?? 'D2C',
    moq: product ? String(product.moq) : '1',
    capacity: product?.capacity ?? '',
    weight: product?.weight ?? '',
    waterproof: product?.waterproof ?? '',
    dimensions: product?.dimensions ?? '',
    packed: product?.packed ?? '',
    temperature: product?.temperature ?? '',
    materials: product?.materials ?? [],
    details: product?.details ?? [],
    colors: product?.colors ?? [],
    images: product?.images ?? [],
    plate: product?.plate ?? 'project',
    badge: product?.badge ?? '',
    featured: Boolean(product?.featured),
    hero: Boolean(product?.hero),
  }
}

export function AdminProductEditor() {
  const { sku } = useParams()
  const navigate = useNavigate()
  const { productBySku, categories, categoryById, familyById } = useCatalogue()

  const isNew = !sku
  const existing = sku ? productBySku.get(sku.toUpperCase()) : undefined

  const [draft, setDraft] = useState<Draft>(() =>
    draftFrom(existing, categories[0]?.id ?? ''),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (sku && !existing) return <Navigate to="/admin/products" replace />
  if (categories.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl font-light">Create a section first.</p>
        <p className="mt-3 text-sm font-light text-muted">
          Every piece belongs to a section, and every section belongs to a house.
        </p>
        <Link to="/admin/houses" className="btn-luxe mt-8">
          Set up the taxonomy
        </Link>
      </div>
    )
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const category = categoryById.get(draft.category as Product['category'])
  const family = category ? familyById.get(category.family) : undefined

  /** Live preview — exactly the card the storefront will render. */
  const preview: Product = {
    sku: draft.sku || 'NEW',
    name: draft.name || 'Untitled piece',
    family: (category?.family ?? 'shelter') as Product['family'],
    category: draft.category as Product['category'],
    tagline: draft.tagline,
    description: draft.description,
    price: Number(draft.price) || 0,
    unit: draft.unit || undefined,
    cogs: Number(draft.cogs) || 0,
    channel: draft.channel as Product['channel'],
    moq: Number(draft.moq) || 1,
    capacity: draft.capacity || undefined,
    weight: draft.weight || undefined,
    waterproof: draft.waterproof || undefined,
    materials: draft.materials,
    colors: draft.colors,
    images: draft.images,
    plate: draft.plate as Product['plate'],
    badge: draft.badge || undefined,
  }

  const margin =
    Number(draft.price) > 0
      ? Math.round(
          ((Number(draft.price) - Number(draft.cogs)) / Number(draft.price)) * 100,
        )
      : null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...draft,
      price: Number(draft.price) || 0,
      cogs: Number(draft.cogs) || 0,
      moq: Number(draft.moq) || 1,
      // Blank optional strings are sent as null so the server clears them
      // rather than storing an empty string.
      unit: draft.unit || null,
      capacity: draft.capacity || null,
      weight: draft.weight || null,
      waterproof: draft.waterproof || null,
      dimensions: draft.dimensions || null,
      packed: draft.packed || null,
      temperature: draft.temperature || null,
      badge: draft.badge || null,
      materials: draft.materials.filter(Boolean),
      details: draft.details.filter(Boolean),
      colors: draft.colors.filter((colour) => colour.name.trim()),
    }

    try {
      if (isNew) {
        await api.post('/products', payload)
      } else {
        await api.patch(`/products/${existing?.sku}`, payload)
      }
      await refreshCatalogue()
      navigate('/admin/products')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save that piece.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b pb-8">
        <div>
          <Link
            to="/admin/products"
            className="eyebrow inline-flex items-center gap-2 hover:text-accent"
          >
            <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
            Pieces
          </Link>
          <h1 className="mt-4 font-display text-[clamp(2rem,3.6vw,2.8rem)] leading-none font-light">
            {isNew ? 'New piece' : draft.name || existing?.name}
          </h1>
          {family && category ? (
            <p className="eyebrow mt-3">
              {family.name} · {category.name}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          {margin !== null ? (
            <span className="text-[0.68rem] tracking-[0.18em] text-muted uppercase tabular-nums">
              Margin {margin}%
            </span>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="btn-luxe btn-solid px-8! py-3.5!"
          >
            {saving ? 'Saving…' : isNew ? 'Create piece' : 'Save changes'}
          </button>
        </div>
      </header>

      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-12 lg:col-span-8">
          <Fieldset legend="Identity" description="How the piece is named and filed.">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="SKU"
                hint={isNew ? 'Uppercase. Used as the URL.' : 'Fixed once created.'}
              >
                <input
                  value={draft.sku}
                  onChange={(event) => set('sku', event.target.value.toUpperCase())}
                  className={inputClass}
                  placeholder="T19"
                  required
                  disabled={!isNew}
                />
              </Field>

              <Field label="Section" hint="The house follows the section automatically.">
                <select
                  value={draft.category}
                  onChange={(event) => set('category', event.target.value)}
                  className={inputClass}
                  required
                >
                  {categories.map((option) => (
                    <option key={option.id} value={option.id}>
                      {familyById.get(option.family)?.name} — {option.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 space-y-6">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(event) => set('name', event.target.value)}
                  className={inputClass}
                  placeholder="5M Bell Tent"
                  required
                />
              </Field>

              <Field label="Tagline" hint="One line. Shown on the card.">
                <input
                  value={draft.tagline}
                  onChange={(event) => set('tagline', event.target.value)}
                  className={inputClass}
                  placeholder="The glamping standard. A double bed, two chairs, and air to spare."
                />
              </Field>

              <Field
                label="Description"
                hint="Two or three sentences for the product page."
              >
                <textarea
                  value={draft.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </Fieldset>

          <Fieldset legend="Commercials" description="Retail, cost and how it is sold.">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Retail price (₹)">
                <input
                  value={draft.price}
                  onChange={(event) => set('price', event.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="34900"
                  required
                />
              </Field>

              <Field
                label="Unit"
                hint="Blank for a single item. 'm' for cloth by the metre."
              >
                <input
                  value={draft.unit}
                  onChange={(event) => set('unit', event.target.value)}
                  className={inputClass}
                  placeholder="m"
                />
              </Field>

              <Field label="Cost (₹)" hint="Internal. Never shown publicly.">
                <input
                  value={draft.cogs}
                  onChange={(event) => set('cogs', event.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="16000"
                />
              </Field>

              <Field label="Counter">
                <select
                  value={draft.channel}
                  onChange={(event) => set('channel', event.target.value)}
                  className={inputClass}
                >
                  {CHANNELS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Minimum order" hint="Quantities step in multiples of this.">
                <input
                  value={draft.moq}
                  onChange={(event) => set('moq', event.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                />
              </Field>

              <Field label="Badge" hint="New, Signature, Made to order…">
                <input
                  value={draft.badge}
                  onChange={(event) => set('badge', event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </Fieldset>

          <Fieldset
            legend="Specification"
            description="Anything left blank is simply omitted from the page."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Capacity">
                <input
                  value={draft.capacity}
                  onChange={(event) => set('capacity', event.target.value)}
                  className={inputClass}
                  placeholder="4–6P or 55 L"
                />
              </Field>
              <Field label="Weight">
                <input
                  value={draft.weight}
                  onChange={(event) => set('weight', event.target.value)}
                  className={inputClass}
                  placeholder="45 kg"
                />
              </Field>
              <Field label="Weather rating">
                <input
                  value={draft.waterproof}
                  onChange={(event) => set('waterproof', event.target.value)}
                  className={inputClass}
                  placeholder="1,500 mm water column"
                />
              </Field>
              <Field label="Dimensions">
                <input
                  value={draft.dimensions}
                  onChange={(event) => set('dimensions', event.target.value)}
                  className={inputClass}
                  placeholder="5.0 m Ø · 3.0 m centre height"
                />
              </Field>
              <Field label="Packed size">
                <input
                  value={draft.packed}
                  onChange={(event) => set('packed', event.target.value)}
                  className={inputClass}
                  placeholder="85 × 45 × 45 cm"
                />
              </Field>
              <Field label="Temperature">
                <input
                  value={draft.temperature}
                  onChange={(event) => set('temperature', event.target.value)}
                  className={inputClass}
                  placeholder="Comfort −5 °C"
                />
              </Field>
            </div>

            <div className="mt-10 space-y-10">
              <ListField
                label="Materials"
                hint="One per line, in the order they should read."
                values={draft.materials}
                onChange={(next) => set('materials', next)}
                placeholder="360 gsm treated cotton canvas"
              />
              <ListField
                label="Details"
                hint="Bullet points for the product page."
                values={draft.details}
                onChange={(next) => set('details', next)}
                placeholder="Walls roll up on all four quarters"
              />
              <ColourField
                values={draft.colors}
                onChange={(next) => set('colors', next)}
              />
            </div>
          </Fieldset>

          <Fieldset
            legend="Imagery"
            description="Upload photography, or leave it to the generated plate."
          >
            <ImageUploader
              values={draft.images}
              onChange={(next) => set('images', next)}
            />

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Field
                label="Plate silhouette"
                hint="Used wherever a photograph is missing."
              >
                <select
                  value={draft.plate}
                  onChange={(event) => set('plate', event.target.value)}
                  className={inputClass}
                >
                  {PLATES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Toggle
                label="Featured"
                hint="Promoted on the home page and sorted first."
                checked={draft.featured}
                onChange={(next) => set('featured', next)}
              />
              <Toggle
                label="Hero"
                hint="Eligible for the hero rotation."
                checked={draft.hero}
                onChange={(next) => set('hero', next)}
              />
            </div>
          </Fieldset>
        </div>

        {/* Live preview */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow eyebrow-accent">Preview</p>
            <p className="mt-2 text-[0.72rem] font-light text-muted">
              The card exactly as the storefront will draw it.
            </p>

            <div className="mt-6 border p-6">
              <ProductCard product={preview} />
            </div>

            <dl className="mt-6 space-y-2 border-t pt-5 text-[0.78rem] font-light">
              <div className="flex justify-between">
                <dt className="text-muted">Retail</dt>
                <dd className="tabular-nums">{formatPrice(Number(draft.price) || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Cost</dt>
                <dd className="tabular-nums">{formatPrice(Number(draft.cogs) || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Gross contribution</dt>
                <dd className="tabular-nums text-accent">
                  {formatPrice((Number(draft.price) || 0) - (Number(draft.cogs) || 0))}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </form>
  )
}
