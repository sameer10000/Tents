import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { QuantityStepper } from '../components/QuantityStepper'
import { ArrowIcon } from '../components/icons'
import { Reveal } from '../components/motion/Reveal'
import { TentControls } from '../components/tent/TentControls'
import { TentViewport } from '../components/tent/TentViewport'
import { useCart } from '../context/cart'
import { useUI } from '../context/ui'
import type { ColorPart, LengthUnit, SpecValue, TentFamilyId, TentSpec } from '../data/tent-config'
import {
  TENT_FAMILIES,
  defaultSpec,
  familyDef,
  specHeadline,
  summariseSpec,
} from '../data/tent-config'
import { ApiError, api } from '../lib/api'

interface SavedDesign {
  id: string
  family: TentFamilyId
  spec: TentSpec
  quantity: number
  submitted: boolean
}

/**
 * The configurator.
 *
 * Three families, drawn live. Nothing here computes a price — a commission is
 * quoted against its drawing — so the two things a visitor can do are put it
 * in the bag and send it to us, or take a link away and think about it.
 */
export function CreateTent() {
  const { id } = useParams<{ id: string }>()
  // Keyed on the design id so moving between saved designs starts the
  // configurator cleanly rather than mutating one into the other.
  return <Configurator key={id ?? 'new'} id={id} />
}

function Configurator({ id }: { id?: string }) {
  const { addCustom } = useCart()
  const { open } = useUI()

  const [spec, setSpec] = useState<TentSpec>(() => defaultSpec('bell'))
  const [unit, setUnit] = useState<LengthUnit>('m')
  const [loading, setLoading] = useState(Boolean(id))
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<'bag' | 'share' | null>(null)

  // The server record behind this design, once there is one. `dirty` tracks
  // whether the specification has moved on since it was last written.
  const saved = useRef<{ id: string; dirty: boolean; frozen: boolean } | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  /* ── Reopening a saved design ─────────────────────────────────────────── */

  useEffect(() => {
    if (!id) return

    let cancelled = false

    api
      .get<SavedDesign>(`/custom-tents/${id}`)
      .then((design) => {
        if (cancelled) return
        setSpec(design.spec)
        // A design that has already been sent to us must not be overwritten;
        // editing it forks a new record instead.
        saved.current = { id: design.id, dirty: false, frozen: design.submitted }
        setShareUrl(`${window.location.origin}/create-tent/${design.id}`)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setNotice(
          cause instanceof ApiError && cause.status === 404
            ? 'That design could not be found — here is a fresh one.'
            : 'Could not load that design. Starting from a fresh one.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  /* ── Editing ──────────────────────────────────────────────────────────── */

  const touch = () => {
    if (saved.current) saved.current.dirty = true
    setNotice(null)
  }

  const setField = useCallback((key: string, value: SpecValue) => {
    setSpec((current) => ({ ...current, [key]: value }) as TentSpec)
    touch()
  }, [])

  const setColor = useCallback((part: ColorPart, hex: string) => {
    setSpec((current) => ({ ...current, colors: { ...current.colors, [part]: hex } }))
    touch()
  }, [])

  const chooseFamily = (family: TentFamilyId) => {
    if (family === spec.family) return
    setSpec(defaultSpec(family))
    // A different structure is a different design, not an edit of this one.
    saved.current = null
    setShareUrl(null)
    setNotice(null)
  }

  const setQuantity = (quantity: number) => {
    setSpec((current) => ({ ...current, quantity: Math.max(1, quantity) }))
    touch()
  }

  /* ── Persistence ──────────────────────────────────────────────────────── */

  /** Writes the design to the server and returns its id. */
  const persist = useCallback(async (): Promise<string> => {
    const payload = {
      family: spec.family,
      spec,
      quantity: spec.quantity,
      headline: specHeadline(spec),
    }

    const record = saved.current
    if (record && !record.dirty) return record.id

    if (record && !record.frozen) {
      try {
        const updated = await api.patch<SavedDesign>(`/custom-tents/${record.id}`, payload)
        saved.current = { id: updated.id, dirty: false, frozen: false }
        return updated.id
      } catch (cause) {
        // 409 means it has been sent to us since; fall through and fork.
        if (!(cause instanceof ApiError) || cause.status !== 409) throw cause
      }
    }

    const created = await api.post<SavedDesign>('/custom-tents', payload)
    saved.current = { id: created.id, dirty: false, frozen: false }
    return created.id
  }, [spec])

  const failure = (cause: unknown) =>
    setNotice(
      cause instanceof ApiError && cause.status === 0
        ? 'Could not reach the studio. Your design is still on screen — try again in a moment.'
        : cause instanceof ApiError
          ? cause.message
          : 'Something went wrong. Please try again.',
    )

  async function addToBag() {
    if (busy) return
    setBusy('bag')
    setNotice(null)

    try {
      const designId = await persist()
      addCustom({
        id: designId,
        qty: spec.quantity,
        family: spec.family,
        headline: specHeadline(spec),
        spec,
      })
      setShareUrl(`${window.location.origin}/create-tent/${designId}`)
      open('cart')
    } catch (cause) {
      failure(cause)
    } finally {
      setBusy(null)
    }
  }

  async function copyLink() {
    if (busy) return
    setBusy('share')
    setNotice(null)

    try {
      const designId = await persist()
      const url = `${window.location.origin}/create-tent/${designId}`
      setShareUrl(url)
      await navigator.clipboard?.writeText(url)
      setNotice('Link copied. Anyone with it can open this design exactly as it stands.')
    } catch (cause) {
      failure(cause)
    } finally {
      setBusy(null)
    }
  }

  const def = familyDef(spec.family)
  const sheet = summariseSpec(spec, unit)

  return (
    <>
      <PageHeader
        eyebrow="The Atelier"
        title="Create your"
        subtitle="own tent."
        blurb="Choose a structure, then work it to your site — dimensions, cloth, openings, hardware and colourway. It is drawn live as you go. Nothing is priced here; a commission is quoted against its drawing."
        meta={def.name}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Atelier', to: '/collections/atelier' },
          { label: 'Create' },
        ]}
      />

      {/* Family picker */}
      <section className="border-b py-10">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-px sm:grid-cols-3">
            {TENT_FAMILIES.map((family) => {
              const active = family.id === spec.family
              return (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => chooseFamily(family.id)}
                  aria-pressed={active}
                  className={`border p-6 text-left transition-colors duration-500 ${
                    active ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <p className={`eyebrow ${active ? 'eyebrow-accent' : ''}`}>
                    {family.kicker}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-light">{family.name}</h2>
                  <p className="mt-2 max-w-[42ch] text-[0.78rem] leading-relaxed font-light text-muted">
                    {family.blurb}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Live view */}
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-28">
                <TentViewport
                  spec={spec}
                  unit={unit}
                  className="aspect-4/3 w-full border lg:aspect-16/11"
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex border border-line">
                    {(['m', 'ft'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setUnit(option)}
                        aria-pressed={unit === option}
                        className={`eyebrow px-3 py-2 transition-colors duration-500 ${
                          unit === option ? 'bg-ink text-surface' : 'hover:text-ink'
                        }`}
                      >
                        {option === 'm' ? 'Metres' : 'Feet'}
                      </button>
                    ))}
                  </div>

                  {shareUrl ? (
                    <p className="text-[0.68rem] font-light text-muted">
                      Saved as{' '}
                      <Link to={shareUrl.replace(window.location.origin, '')} className="link-draw text-accent">
                        {shareUrl.split('/').pop()}
                      </Link>
                    </p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="mt-6 border p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="eyebrow">Quantity</p>
                      <p className="mt-1.5 text-[0.72rem] font-light text-muted">
                        {spec.quantity > 4
                          ? 'A trade order — tell us the site and the date when we come back to you.'
                          : 'One-off commission'}
                      </p>
                    </div>
                    <QuantityStepper
                      step={1}
                      label={def.name}
                      qty={spec.quantity}
                      onChange={setQuantity}
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={addToBag}
                      disabled={busy !== null || loading}
                      className="btn-luxe btn-solid flex-1 disabled:opacity-50"
                    >
                      {busy === 'bag' ? 'Adding' : 'Add to bag'}
                      <ArrowIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={busy !== null || loading}
                      className="btn-luxe flex-1 disabled:opacity-50"
                    >
                      {busy === 'share' ? 'Saving' : 'Save & copy link'}
                    </button>
                  </div>

                  {notice ? (
                    <p role="status" className="mt-4 text-[0.74rem] font-light text-accent">
                      {notice}
                    </p>
                  ) : null}

                  <p className="mt-4 text-[0.68rem] leading-relaxed font-light text-muted">
                    Adding to the bag records the specification with us and marks it{' '}
                    <span className="text-accent">price on request</span>. You will be asked
                    for three lines of contact detail at the bag, and we come back with a
                    quotation.
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="lg:col-span-5">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-px w-32 overflow-hidden bg-line-strong">
                    <div className="animate-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent bg-[length:300%_100%]" />
                  </div>
                </div>
              ) : (
                <TentControls
                  spec={spec}
                  unit={unit}
                  onChange={setField}
                  onColor={setColor}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Specification */}
      <section className="border-t py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <Reveal from="none">
            <p className="eyebrow eyebrow-accent">Specification</p>
            <h2 className="mt-4 font-display text-3xl font-light">
              {specHeadline(spec, unit)}
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {sheet.map((section) => (
              <div key={section.section}>
                <p className="eyebrow border-b pb-3">{section.section}</p>
                <dl className="mt-4 space-y-2.5 text-[0.78rem] font-light">
                  {section.rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-4">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="text-right text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}

            <div>
              <p className="eyebrow border-b pb-3">Colourway</p>
              <dl className="mt-4 space-y-2.5 text-[0.78rem] font-light">
                {def.colorParts.map((part) => (
                  <div key={part.key} className="flex items-center justify-between gap-4">
                    <dt className="text-muted">{part.label}</dt>
                    <dd className="flex items-center gap-2 text-ink">
                      <span
                        className="h-3.5 w-3.5 border border-line"
                        style={{ backgroundColor: spec.colors[part.key] }}
                      />
                      {spec.colors[part.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <p className="mt-14 max-w-[70ch] text-[0.78rem] leading-relaxed font-light text-muted">
            Every commission is prototyped at its critical junctions before cutting, and
            nothing is produced without an approved technical drawing. Terms are 50% in
            advance, 40% before dispatch and 10% after installation. Lead time is
            typically eight to ten weeks from drawing approval.
          </p>
        </div>
      </section>
    </>
  )
}
