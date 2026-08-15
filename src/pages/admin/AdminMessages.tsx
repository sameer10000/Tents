import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogue } from '../../data/catalogue'
import { ApiError, api } from '../../lib/api'

type Status = 'new' | 'pending' | 'talked' | 'closed'

const STATUSES: Array<{ id: Status; label: string; hint: string }> = [
  { id: 'new', label: 'New', hint: 'Just arrived, nobody has looked yet' },
  { id: 'pending', label: 'Pending', hint: 'Waiting on us or on them' },
  { id: 'talked', label: 'Talked', hint: 'Spoken to the customer' },
  { id: 'closed', label: 'Closed', hint: 'Done, won or lost' },
]

interface Enquiry {
  id: string
  kind: 'contact' | 'product'
  name: string
  email: string
  phone: string
  organisation: string
  role: string
  city: string
  units: string
  timeline: string
  message: string
  interest: string[]
  subjectSku: string | null
  savedSkus: string[]
  status: Status
  notes: string
  createdAt: string
}

interface Payload {
  enquiries: Enquiry[]
  counts: Record<Status, number>
  total: number
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
 * General enquiries — the contact page and the product enquiry drawer.
 *
 * No mail is dispatched when one arrives, so this list is the delivery
 * mechanism. It opens on everything, newest first, and each row keeps the
 * state of that conversation.
 */
export function AdminMessages() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setPayload(await api.get<Payload>('/enquiries'))
      setError(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not load enquiries.')
    }
  }, [])

  // Loaded through its own async function with a cancellation flag rather than
  // by calling load() directly: the state update then happens in a promise
  // continuation, not synchronously in the effect body, and a component that
  // unmounts mid-flight does not set state afterwards.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const next = await api.get<Payload>('/enquiries')
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
      await api.patch(`/enquiries/${id}/status`, { status, notes })
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
          <p className="eyebrow eyebrow-accent">Inbox</p>
          <h1 className="mt-3 font-display text-4xl font-light">Enquiries</h1>
          <p className="mt-3 max-w-[60ch] text-sm font-light text-muted">
            Everything sent from the contact page and the enquiry drawer. No mail is
            dispatched — this list is where they land.
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

      <div className="mt-8 flex flex-wrap gap-px border-b pb-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`eyebrow px-4 py-2 transition-colors ${
            filter === 'all' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
          }`}
        >
          All · {payload?.total ?? 0}
        </button>
        {STATUSES.map((status) => (
          <button
            key={status.id}
            type="button"
            title={status.hint}
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
          <MessageRow
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

function MessageRow({
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
  const subject = enquiry.subjectSku ? productBySku.get(enquiry.subjectSku) : undefined

  const details: Array<[string, string | undefined]> = [
    ['Organisation', enquiry.organisation],
    ['Role', enquiry.role],
    ['Location', enquiry.city],
    ['Units', enquiry.units],
    ['Timeline', enquiry.timeline],
    ['Phone', enquiry.phone],
  ]

  return (
    <li className="border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-5 p-5 text-left transition-colors hover:bg-surface-2"
      >
        <span className="eyebrow shrink-0 border border-line px-2.5 py-1 text-muted">
          {enquiry.kind === 'product' ? 'Piece' : 'Contact'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-light">
            {enquiry.name}
            {enquiry.organisation ? (
              <span className="text-muted"> · {enquiry.organisation}</span>
            ) : null}
          </span>
          <span className="mt-1 block truncate text-[0.74rem] font-light text-muted">
            {enquiry.id} · {enquiry.email}
            {subject ? ` · about ${subject.name}` : ''}
          </span>
        </span>

        <span className="text-right">
          <span className="block text-[0.68rem] font-light text-muted">
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
          <div className="lg:col-span-2">
            <dl className="grid gap-x-8 gap-y-3 text-[0.78rem] font-light sm:grid-cols-2">
              {details
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b pb-2">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right text-ink">{value}</dd>
                  </div>
                ))}
            </dl>

            {enquiry.interest.length > 0 ? (
              <div className="mt-6">
                <p className="eyebrow">Interested in</p>
                <p className="mt-2 text-[0.78rem] font-light text-muted">
                  {enquiry.interest.join(' · ')}
                </p>
              </div>
            ) : null}

            {enquiry.message ? (
              <div className="mt-6">
                <p className="eyebrow">Message</p>
                <p className="mt-2 text-sm leading-relaxed font-light whitespace-pre-wrap text-ink">
                  {enquiry.message}
                </p>
              </div>
            ) : null}

            {enquiry.savedSkus.length > 0 ? (
              <div className="mt-6 border-l-2 border-accent pl-4">
                <p className="eyebrow">Saved pieces attached</p>
                <p className="mt-2 text-[0.78rem] font-light text-muted">
                  {enquiry.savedSkus
                    .map((sku) => productBySku.get(sku)?.name ?? sku)
                    .join(' · ')}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            {subject ? (
              <div>
                <p className="eyebrow">The piece</p>
                <Link
                  to={`/product/${subject.sku}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link-draw mt-2 inline-block text-sm font-light text-accent"
                >
                  {subject.name}
                </Link>
              </div>
            ) : null}

            <div>
              <p className="eyebrow">Status</p>
              <div className="mt-3 grid grid-cols-2 gap-px">
                {STATUSES.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    disabled={saving}
                    title={status.hint}
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
                placeholder="Called 14 Aug · wants 12 units for a resort in Rishikesh"
                className="mt-2 w-full border border-line bg-transparent p-3 text-sm font-light text-ink placeholder:text-muted/50 focus:border-accent focus:outline-none"
              />
            </label>

            <a
              href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
                `Your enquiry · ${enquiry.id}`,
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
