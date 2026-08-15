import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogue } from '../../data/catalogue'
import { refreshCatalogue } from '../../data/sync'
import { ApiError, api } from '../../lib/api'
import { PLATE_ART } from '../../lib/plate'
import { Banner, Field, inputClass } from '../../components/admin/fields'
import { PlusIcon } from '../../components/icons'

const PLATES = Object.keys(PLATE_ART).sort()

/** Shared delete handler — the API asks for confirmation when it is not empty. */
async function removeWithForce(
  path: string,
  label: string,
  onError: (message: string) => void,
) {
  try {
    await api.delete(path)
    await refreshCatalogue()
    return
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 409) {
      // The 409 body explains exactly what is in the way.
      if (
        !window.confirm(`${cause.message}\n\nDelete ${label} and everything inside it?`)
      ) {
        return
      }
      try {
        await api.delete(`${path}?force=true`)
        await refreshCatalogue()
        return
      } catch (second) {
        onError(second instanceof ApiError ? second.message : 'Could not delete that.')
        return
      }
    }
    onError(cause instanceof ApiError ? cause.message : 'Could not delete that.')
  }
}

/* ── Houses ────────────────────────────────────────────────────────────── */

export function AdminHouses() {
  const { families, categoriesOf, productsInFamily } = useCatalogue()
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', kicker: '', blurb: '', slug: '' })
  const [busy, setBusy] = useState(false)

  function startNew() {
    setEditing('new')
    setDraft({ name: '', kicker: '', blurb: '', slug: '' })
  }

  function startEdit(id: string) {
    const family = families.find((f) => f.id === id)
    if (!family) return
    setEditing(id)
    setDraft({
      name: family.name,
      kicker: family.kicker,
      blurb: family.blurb,
      slug: family.slug,
    })
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (editing === 'new') await api.post('/families', draft)
      else await api.patch(`/families/${editing}`, draft)
      await refreshCatalogue()
      setEditing(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save that house.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow eyebrow-accent">Houses</p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-none font-light">
            {families.length} lineups
          </h1>
          <p className="mt-3 max-w-[54ch] text-sm font-light text-muted">
            A house is a top-level lineup — Shelter, Travel, Heritage. It holds sections,
            and sections hold pieces.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="btn-luxe btn-solid px-6! py-3!"
        >
          <PlusIcon className="h-4 w-4" />
          New house
        </button>
      </header>

      {error ? <Banner tone="error">{error}</Banner> : null}

      {editing ? (
        <form onSubmit={save} className="border p-7">
          <h2 className="font-display text-2xl font-light">
            {editing === 'new' ? 'New house' : `Editing ${draft.name}`}
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={inputClass}
                placeholder="Apparel"
                required
                autoFocus
              />
            </Field>
            <Field label="Kicker" hint="The line under the name in the menu.">
              <input
                value={draft.kicker}
                onChange={(event) => setDraft({ ...draft, kicker: event.target.value })}
                className={inputClass}
                placeholder="Clothing & Outerwear"
              />
            </Field>
            {editing !== 'new' ? (
              <Field label="Slug" hint="The URL segment: /collections/…">
                <input
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                  className={inputClass}
                />
              </Field>
            ) : null}
          </div>

          <div className="mt-6">
            <Field label="Blurb">
              <textarea
                value={draft.blurb}
                onChange={(event) => setDraft({ ...draft, blurb: event.target.value })}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <div className="mt-7 flex gap-4">
            <button
              type="submit"
              disabled={busy}
              className="btn-luxe btn-solid px-7! py-3!"
            >
              {busy ? 'Saving…' : 'Save house'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-[0.66rem] tracking-[0.2em] text-muted uppercase hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="border-t">
        {families.map((family) => (
          <div
            key={family.id}
            className="grid grid-cols-12 items-start gap-4 border-b py-5"
          >
            <div className="col-span-12 sm:col-span-4">
              <Link
                to={`/collections/${family.slug}`}
                className="link-draw font-display text-xl font-light"
              >
                {family.name}
              </Link>
              <p className="eyebrow mt-1">{family.kicker}</p>
            </div>

            <p className="col-span-8 text-[0.78rem] leading-relaxed font-light text-muted sm:col-span-5">
              {family.blurb}
            </p>

            <p className="col-span-2 text-[0.72rem] text-muted tabular-nums sm:col-span-1">
              {categoriesOf(family.id).length} / {productsInFamily(family.id).length}
            </p>

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => startEdit(family.id)}
                className="text-[0.64rem] tracking-[0.18em] text-muted uppercase hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  void removeWithForce(`/families/${family.id}`, family.name, setError)
                }
                className="text-[0.64rem] tracking-[0.18em] text-muted uppercase hover:text-ink"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sections ──────────────────────────────────────────────────────────── */

export function AdminSections() {
  const { categories, families, familyById, productsInCategory } = useCatalogue()
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Typed as plain strings: the select emits `string`, and the server is the
  // one that validates these against the real ids.
  const [draft, setDraft] = useState<{
    name: string
    family: string
    blurb: string
    plate: string
    slug: string
  }>({
    name: '',
    family: families[0]?.id ?? '',
    blurb: '',
    plate: 'project',
    slug: '',
  })

  function startNew() {
    setEditing('new')
    setDraft({
      name: '',
      family: families[0]?.id ?? '',
      blurb: '',
      plate: 'project',
      slug: '',
    })
  }

  function startEdit(id: string) {
    const category = categories.find((c) => c.id === id)
    if (!category) return
    setEditing(id)
    setDraft({
      name: category.name,
      family: category.family,
      blurb: category.blurb,
      plate: category.plate,
      slug: category.slug,
    })
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (editing === 'new') await api.post('/categories', draft)
      else await api.patch(`/categories/${editing}`, draft)
      await refreshCatalogue()
      setEditing(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save that section.')
    } finally {
      setBusy(false)
    }
  }

  if (families.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl font-light">Create a house first.</p>
        <Link to="/admin/houses" className="btn-luxe mt-8">
          Houses
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow eyebrow-accent">Sections</p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-none font-light">
            {categories.length} sections
          </h1>
          <p className="mt-3 max-w-[54ch] text-sm font-light text-muted">
            A section is what a piece is filed under — Bell Tents, Duffel Bags,
            Tarpaulins. It gets its own page at /catalogue/…
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="btn-luxe btn-solid px-6! py-3!"
        >
          <PlusIcon className="h-4 w-4" />
          New section
        </button>
      </header>

      {error ? <Banner tone="error">{error}</Banner> : null}

      {editing ? (
        <form onSubmit={save} className="border p-7">
          <h2 className="font-display text-2xl font-light">
            {editing === 'new' ? 'New section' : `Editing ${draft.name}`}
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={inputClass}
                placeholder="Waxed Jackets"
                required
                autoFocus
              />
            </Field>

            <Field label="House">
              <select
                value={draft.family}
                onChange={(event) => setDraft({ ...draft, family: event.target.value })}
                className={inputClass}
              >
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Plate" hint="Default silhouette for pieces in this section.">
              <select
                value={draft.plate}
                onChange={(event) => setDraft({ ...draft, plate: event.target.value })}
                className={inputClass}
              >
                {PLATES.map((plate) => (
                  <option key={plate} value={plate}>
                    {plate}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <Field label="Blurb">
              <textarea
                value={draft.blurb}
                onChange={(event) => setDraft({ ...draft, blurb: event.target.value })}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <div className="mt-7 flex gap-4">
            <button
              type="submit"
              disabled={busy}
              className="btn-luxe btn-solid px-7! py-3!"
            >
              {busy ? 'Saving…' : 'Save section'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-[0.66rem] tracking-[0.2em] text-muted uppercase hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="border-t">
        {categories.map((category) => (
          <div
            key={category.id}
            className="grid grid-cols-12 items-start gap-4 border-b py-5"
          >
            <div className="col-span-12 sm:col-span-4">
              <Link
                to={`/catalogue/${category.slug}`}
                className="link-draw font-display text-lg font-light"
              >
                {category.name}
              </Link>
              <p className="eyebrow mt-1">
                {familyById.get(category.family)?.name} · {category.plate}
              </p>
            </div>

            <p className="col-span-8 text-[0.78rem] leading-relaxed font-light text-muted sm:col-span-5">
              {category.blurb}
            </p>

            <p className="col-span-2 text-[0.72rem] text-muted tabular-nums sm:col-span-1">
              {productsInCategory(category.id).length}
            </p>

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => startEdit(category.id)}
                className="text-[0.64rem] tracking-[0.18em] text-muted uppercase hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  void removeWithForce(
                    `/categories/${category.id}`,
                    category.name,
                    setError,
                  )
                }
                className="text-[0.64rem] tracking-[0.18em] text-muted uppercase hover:text-ink"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
