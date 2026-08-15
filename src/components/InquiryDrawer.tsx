import { useState } from 'react'
import { useCatalogue } from '../data/catalogue'
import { motion } from 'framer-motion'
import { useUI } from '../context/ui'
import { useWishlist } from '../context/wishlist'
import type { Product } from '../data/types'
import { ApiError, api } from '../lib/api'
import { Drawer } from './Drawer'

const ROLES = [
  'Resort or glamping operator',
  'Architect or interior designer',
  'Wedding or event planner',
  'Restaurant or café',
  'Retailer or dealer',
  'Private client',
]

const TIMELINES = ['Within a month', 'One to three months', 'This season', 'Exploring']

interface FormState {
  name: string
  organisation: string
  role: string
  email: string
  phone: string
  city: string
  units: string
  timeline: string
  message: string
  /** Honeypot — always empty for a real person. */
  website: string
}

const EMPTY: FormState = {
  name: '',
  organisation: '',
  role: ROLES[0],
  email: '',
  phone: '',
  city: '',
  units: '',
  timeline: TIMELINES[1],
  message: '',
  website: '',
}

const field =
  'w-full border-0 border-b border-line bg-transparent py-3 text-sm font-light text-ink placeholder:text-muted/50 transition-colors duration-400 focus:border-accent focus:outline-none'

export function InquiryDrawer() {
  const { productBySku } = useCatalogue()
  const { panel, inquirySubject, close } = useUI()
  const isOpen = panel === 'inquiry'
  const subject = inquirySubject ? productBySku.get(inquirySubject) : undefined

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      eyebrow={subject ? `Regarding ${subject.sku}` : 'Trade & projects'}
      title={subject ? subject.name : 'Enquiry'}
    >
      {/* Mounted only while the drawer is open, so the form resets on close
          without an effect having to clear it. */}
      <InquiryForm subject={subject} onDone={close} />
    </Drawer>
  )
}

function InquiryForm({ subject, onDone }: { subject?: Product; onDone: () => void }) {
  const { items } = useWishlist()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [reference, setReference] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (sending) return

    setSending(true)
    setError(null)

    try {
      // The reference comes back from the server, which is what makes it
      // quotable — it is the primary key of the row that was just written.
      const { reference: issued } = await api.post<{ reference: string }>('/enquiries', {
        kind: subject ? 'product' : 'contact',
        name: form.name,
        organisation: form.organisation,
        role: form.role,
        email: form.email,
        phone: form.phone,
        city: form.city,
        units: form.units,
        timeline: form.timeline,
        message: form.message,
        subjectSku: subject?.sku ?? null,
        savedSkus: items.map((product) => product.sku),
        website: form.website,
      })

      setReference(issued)
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'That did not send. Please try again.',
      )
    } finally {
      setSending(false)
    }
  }

  if (reference) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-full flex-col justify-center gap-6 text-center"
      >
        <p className="eyebrow eyebrow-accent">Reference {reference}</p>
        <p className="font-display text-2xl leading-relaxed font-light">
          Thank you. A member of the studio will respond within one working day.
        </p>
        <p className="text-sm leading-relaxed font-light text-muted">
          For project work we will ask for dimensions, location, unit count, intended use
          and target date before quoting.
        </p>
        <button type="button" onClick={onDone} className="btn-luxe mt-2 self-center">
          Close
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      {subject ? (
        <div className="border-l-2 border-accent pl-4">
          <p className="eyebrow">Enquiring about</p>
          <p className="mt-1.5 font-display text-lg font-light">{subject.name}</p>
          <p className="mt-0.5 text-xs font-light text-muted">
            {subject.sku} · MOQ {subject.moq}
          </p>
        </div>
      ) : items.length > 0 ? (
        <div className="border-l-2 border-accent pl-4">
          <p className="eyebrow">Attached from your saved list</p>
          <p className="mt-1.5 text-sm font-light text-muted">
            {items.map((product) => product.sku).join(' · ')}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <input
          required
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Name"
          className={field}
          autoComplete="name"
        />
        <input
          value={form.organisation}
          onChange={(event) => update('organisation', event.target.value)}
          placeholder="Organisation"
          className={field}
          autoComplete="organization"
        />
      </div>

      <label className="block">
        <span className="eyebrow">You are</span>
        <select
          value={form.role}
          onChange={(event) => update('role', event.target.value)}
          className={`${field} mt-1 appearance-none`}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          placeholder="Email"
          className={field}
          autoComplete="email"
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          placeholder="Phone or WhatsApp"
          className={field}
          autoComplete="tel"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <input
          value={form.city}
          onChange={(event) => update('city', event.target.value)}
          placeholder="City or site location"
          className={field}
          autoComplete="address-level2"
        />
        <input
          value={form.units}
          onChange={(event) => update('units', event.target.value)}
          placeholder="Units required"
          className={field}
          inputMode="numeric"
        />
      </div>

      <label className="block">
        <span className="eyebrow">Timeline</span>
        <select
          value={form.timeline}
          onChange={(event) => update('timeline', event.target.value)}
          className={`${field} mt-1 appearance-none`}
        >
          {TIMELINES.map((timeline) => (
            <option key={timeline} value={timeline}>
              {timeline}
            </option>
          ))}
        </select>
      </label>

      <textarea
        value={form.message}
        onChange={(event) => update('message', event.target.value)}
        placeholder="Tell us about the site, the dimensions and the intended use"
        rows={4}
        className={`${field} resize-none`}
      />

      {/* Honeypot. Hidden from people, irresistible to form bots — anything
          that fills it in is answered as though it succeeded. */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(event) => update('website', event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />

      <button type="submit" disabled={sending} className="btn-luxe btn-solid w-full disabled:opacity-50">
        {sending ? 'Sending…' : 'Send enquiry'}
      </button>

      {error ? (
        <p role="alert" className="border-l-2 border-accent pl-4 text-sm font-light text-accent">
          {error}
        </p>
      ) : null}

      <p className="text-[0.68rem] leading-relaxed font-light text-muted">
        Custom work begins only after an approved drawing. Terms are 50% advance, 40%
        before dispatch, 10% after installation.
      </p>
    </form>
  )
}
