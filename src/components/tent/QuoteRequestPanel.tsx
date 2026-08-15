import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/cart'
import { ApiError, api } from '../../lib/api'
import { ArrowIcon } from '../icons'

const field =
  'w-full border-0 border-b border-line bg-transparent py-3 text-sm font-light text-ink placeholder:text-muted/50 transition-colors duration-400 focus:border-accent focus:outline-none'

/**
 * Turns a bag holding commissions into an enquiry.
 *
 * No price is computed and nothing is charged — the specifications go to the
 * studio and a figure comes back. On success the commissions leave the bag,
 * because they now exist on our side rather than the visitor's.
 */
export function QuoteRequestPanel() {
  const { custom, raw, removeCustom } = useCart()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<string[]>([])

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (state === 'sending') return

    setState('sending')
    setError(null)

    const ids = custom.map((line) => line.id)

    try {
      await api.post('/custom-tents/enquiry', {
        ids,
        ...form,
        // The catalogue lines ride along so the studio sees the whole ask.
        basket: raw.map((line) => ({ sku: line.sku, qty: line.qty })),
      })

      setSentIds(ids)
      setState('sent')
      for (const id of ids) removeCustom(id)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Something went wrong sending that. Please try again.',
      )
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border border-accent/40 bg-accent/5 p-7"
      >
        <p className="eyebrow eyebrow-accent">Enquiry received</p>
        <p className="mt-4 font-display text-2xl leading-relaxed font-light">
          Thank you. We will come back with a quotation within one working day.
        </p>
        <p className="mt-4 text-[0.78rem] leading-relaxed font-light text-muted">
          Your {sentIds.length === 1 ? 'design is' : 'designs are'} saved — open{' '}
          {sentIds.length === 1 ? 'it' : 'them'} any time, and send the link to anyone
          else who needs to see it.
        </p>
        <ul className="mt-4 space-y-1.5">
          {sentIds.map((id) => (
            <li key={id}>
              <Link
                to={`/create-tent/${id}`}
                className="link-draw text-[0.72rem] tracking-[0.16em] text-accent uppercase"
              >
                {id}
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border p-7">
      <p className="eyebrow eyebrow-accent">Request a quote</p>
      <p className="mt-4 text-[0.78rem] leading-relaxed font-light text-muted">
        {custom.length === 1 ? 'This commission is' : 'These commissions are'} priced
        against a drawing rather than a shelf, so the bag cannot be paid for as it
        stands. Leave us three lines and we will quote it.
      </p>

      <div className="mt-6 space-y-5">
        <input
          required
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Name"
          className={field}
          autoComplete="name"
        />
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
          required
          type="tel"
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          placeholder="Phone or WhatsApp"
          className={field}
          autoComplete="tel"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-5 text-[0.76rem] font-light text-accent">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="btn-luxe btn-solid mt-7 w-full disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending' : 'Send for quotation'}
        <ArrowIcon className="h-4 w-4" />
      </button>

      <p className="mt-5 text-[0.68rem] leading-relaxed font-light text-muted">
        Nothing is charged and no payment details are taken. Typical lead time on a
        commission is eight to ten weeks from an approved drawing.
      </p>
    </form>
  )
}
