import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductPlate } from '../../components/ProductPlate'
import { useCatalogue } from '../../data/catalogue'
import type { TentFamilyId, TentSpec } from '../../data/tent-config'
import { familyDef, summariseSpec, swatchName } from '../../data/tent-config'
import { ApiError, api } from '../../lib/api'

type Status = 'new' | 'contacted' | 'quoted' | 'closed'

const STATUSES: Array<{ id: Status; label: string }> = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'closed', label: 'Closed' },
]

interface Enquiry {
  id: string
  family: TentFamilyId
  headline: string
  spec: TentSpec
  quantity: number
  name: string
  email: string
  phone: string
  basket: Array<{ sku: string; qty: number }>
  status: Status
  notes: string
  submitted: boolean
  createdAt: string
}

interface Payload {
  enquiries: Enquiry[]
  counts: Record<Status, number>
}

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Custom tent enquiries.
 *
 * No email is sent when one arrives — this page is the delivery mechanism, so
 * it opens on everything unanswered and keeps the state of each conversation.
 */
export function AdminEnquiries() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const next = await api.get<Payload>('/custom-tents')
      setPayload(next)
      setError(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not load enquiries.')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const next = await api.get<Payload>('/custom-tents')
        if (!cancelled) setPayload(next)
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : 'Could not load enquiries.')
        }
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  async function setStatus(id: string, status: Status, notes?: string) {
    setSaving(id)
    try {
      await api.patch(`/custom-tents/${id}/status`, { status, notes })
      await load()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save that.')
    } finally {
      setSaving(null)
    }
  }

  const enquiries = (payload?.enquiries ?? []).filter(
    (entry) => filter === 'all' || entry.status === filter,
  )

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow eyebrow-accent">Atelier</p>
          <h1 className="mt-3 font-display text-4xl font-light">Custom tent enquiries</h1>
          <p className="mt-3 max-w-[60ch] text-sm font-light text-muted">
            Every tent designed in the configurator and sent to us. No mail is dispatched
            — this list is where they land.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="eyebrow border border-line px-4 py-2.5 transition-colors hover:border-accent hover:text-accent"
        >
          Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="mt-8 flex flex-wrap gap-px border-b pb-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`eyebrow px-4 py-2 transition-colors ${
            filter === 'all' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
          }`}
        >
          All · {payload?.enquiries.length ?? 0}
        </button>
        {STATUSES.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => setFilter(status.id)}
            aria-pressed={filter === status.id}
            className={`eyebrow px-4 py-2 transition-colors ${
              filter === status.id ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
            }`}
          >
            {status.label} · {payload?.counts[status.id] ?? 0}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-accent pl-4 text-sm text-accent">
          {error}
        </p>
      ) : null}

      {payload && enquiries.length === 0 ? (
        <p className="mt-16 text-center font-display text-2xl font-light text-muted">
          {filter === 'all' ? 'No enquiries yet.' : `Nothing ${filter}.`}
        </p>
      ) : null}

      <ul className="mt-8 space-y-px">
        {enquiries.map((enquiry) => (
          <EnquiryRow
            key={enquiry.id}
            enquiry={enquiry}
            open={openId === enquiry.id}
            saving={saving === enquiry.id}
            onToggle={() => setOpenId(openId === enquiry.id ? null : enquiry.id)}
            onStatus={(status, notes) => void setStatus(enquiry.id, status, notes)}
          />
        ))}
      </ul>
    </div>
  )
}

function EnquiryRow({
  enquiry,
  open,
  saving,
  onToggle,
  onStatus,
}: {
  enquiry: Enquiry
  open: boolean
  saving: boolean
  onToggle: () => void
  onStatus: (status: Status, notes?: string) => void
}) {
  const { productBySku } = useCatalogue()
  const [notes, setNotes] = useState(enquiry.notes)
  const def = familyDef(enquiry.family)
  const sheet = summariseSpec(enquiry.spec)

  return (
    <li className="border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-5 p-5 text-left transition-colors hover:bg-surface-2"
      >
        <span className="relative h-16 w-14 shrink-0 overflow-hidden">
          <ProductPlate plate={def.plate} seed={enquiry.id} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-light">{enquiry.headline}</span>
          <span className="mt-1 block text-[0.74rem] font-light text-muted">
            {enquiry.name} · {enquiry.email} · {enquiry.phone}
          </span>
        </span>

        <span className="text-right">
          <span className="eyebrow block">
            {enquiry.quantity} {enquiry.quantity === 1 ? 'unit' : 'units'}
          </span>
          <span className="mt-1 block text-[0.68rem] font-light text-muted">
            {stamp(enquiry.createdAt)}
          </span>
        </span>

        <span
          className={`eyebrow border px-3 py-1.5 ${
            enquiry.status === 'new'
              ? 'border-accent text-accent'
              : enquiry.status === 'closed'
                ? 'border-line text-muted'
                : 'border-line-strong text-ink'
          }`}
        >
          {enquiry.status}
        </span>
      </button>

      {open ? (
        <div className="grid gap-10 border-t p-6 lg:grid-cols-3">
          {/* Specification */}
          <div className="lg:col-span-2">
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {sheet.map((section) => (
                <div key={section.section}>
                  <p className="eyebrow border-b pb-2">{section.section}</p>
                  <dl className="mt-3 space-y-2 text-[0.76rem] font-light">
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
                <p className="eyebrow border-b pb-2">Colourway</p>
                <dl className="mt-3 space-y-2 text-[0.76rem] font-light">
                  {def.colorParts.map((part) => {
                    const hex = enquiry.spec.colors[part.key]
                    if (!hex) return null
                    return (
                      <div key={part.key} className="flex items-center justify-between gap-4">
                        <dt className="text-muted">{part.label}</dt>
                        <dd className="flex items-center gap-2 text-ink">
                          <span
                            className="h-3.5 w-3.5 border border-line"
                            style={{ backgroundColor: hex }}
                          />
                          {swatchName(hex)}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>

            {enquiry.basket.length > 0 ? (
              <div className="mt-8 border-l-2 border-accent pl-4">
                <p className="eyebrow">Catalogue pieces in the same bag</p>
                <p className="mt-2 text-[0.78rem] font-light text-muted">
                  {enquiry.basket
                    .map(
                      (line) =>
                        `${productBySku.get(line.sku)?.name ?? line.sku} × ${line.qty}`,
                    )
                    .join(' · ')}
                </p>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <div>
              <p className="eyebrow">Open the design</p>
              <Link
                to={`/create-tent/${enquiry.id}`}
                target="_blank"
                rel="noreferrer"
                className="link-draw mt-2 inline-block text-sm font-light text-accent"
              >
                /create-tent/{enquiry.id}
              </Link>
            </div>

            <div>
              <p className="eyebrow">Status</p>
              <div className="mt-3 grid grid-cols-2 gap-px">
                {STATUSES.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    disabled={saving}
                    onClick={() => onStatus(status.id, notes)}
                    className={`border px-3 py-2 text-[0.68rem] tracking-[0.12em] uppercase transition-colors disabled:opacity-40 ${
                      enquiry.status === status.id
                        ? 'border-accent bg-accent/10 text-ink'
                        : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="eyebrow">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => {
                  if (notes !== enquiry.notes) onStatus(enquiry.status, notes)
                }}
                rows={5}
                placeholder="Quoted ₹… on … · awaiting drawing approval"
                className="mt-2 w-full border border-line bg-transparent p-3 text-sm font-light text-ink placeholder:text-muted/50 focus:border-accent focus:outline-none"
              />
            </label>

            <a
              href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
                `Your ${def.name.toLowerCase()} commission · ${enquiry.id}`,
              )}`}
              className="btn-luxe w-full"
            >
              Reply by email
            </a>
          </div>
        </div>
      ) : null}
    </li>
  )
}
