import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ProductImage } from '../components/ProductImage'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ArrowIcon, CheckIcon, LockIcon, TruckIcon } from '../components/icons'
import { useCart } from '../context/cart'
import { formatPrice } from '../lib/format'
import { estimateDelivery, placeOrder, summarise } from '../lib/order'
import type { DeliveryMethod, OrderCustomer } from '../lib/order'
import { EXPRESS_SURCHARGE } from '../lib/order'

const STEPS = ['Details', 'Delivery', 'Payment'] as const
type Step = 0 | 1 | 2

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', note: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'upi', label: 'UPI', note: 'GPay, PhonePe, Paytm, any UPI app' },
  { id: 'netbanking', label: 'Net banking', note: 'All major Indian banks' },
  {
    id: 'invoice',
    label: 'Bank transfer / invoice',
    note: 'Trade accounts, NEFT or RTGS',
  },
]

const STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

const EMPTY_CUSTOMER: OrderCustomer = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'Delhi',
  pincode: '',
  gstin: '',
  notes: '',
}

const field =
  'w-full border-0 border-b border-line bg-transparent py-3.5 text-sm font-light text-ink placeholder:text-muted/50 transition-colors duration-400 focus:border-accent focus:outline-none'

export function Checkout() {
  const navigate = useNavigate()
  const { lines, clearCatalogue } = useCart()

  const [step, setStep] = useState<Step>(0)
  const [customer, setCustomer] = useState<OrderCustomer>(EMPTY_CUSTOMER)
  const [delivery, setDelivery] = useState<DeliveryMethod>('standard')
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].id)
  const [placing, setPlacing] = useState(false)

  const totals = useMemo(() => summarise(lines, delivery), [lines, delivery])

  // Nothing to check out. Bounce rather than render an empty flow.
  if (lines.length === 0 && !placing) return <Navigate to="/cart" replace />

  function update<K extends keyof OrderCustomer>(key: K, value: OrderCustomer[K]) {
    setCustomer((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (step < 2) {
      setStep((current) => (current + 1) as Step)
      return
    }

    setPlacing(true)
    const order = placeOrder({
      lines,
      customer,
      delivery,
      paymentMethod:
        PAYMENT_METHODS.find((method) => method.id === payment)?.label ?? payment,
    })
    clearCatalogue()
    navigate(`/order/${order.id}`, { replace: true })
  }

  const selectedPayment = PAYMENT_METHODS.find((method) => method.id === payment)

  return (
    <div className="pt-[104px] lg:pt-[128px]">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
        {/* Header + progress */}
        <header className="border-b py-10 lg:py-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow eyebrow-accent">Checkout</p>
              <SplitHeading
                text={STEPS[step]}
                as="h1"
                immediate
                className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-none font-light"
              />
            </div>

            <ol className="flex items-center gap-3">
              {STEPS.map((label, index) => {
                const done = index < step
                const active = index === step
                return (
                  <li key={label} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => index < step && setStep(index as Step)}
                      disabled={index >= step}
                      className={`flex items-center gap-2.5 text-[0.64rem] tracking-[0.22em] uppercase transition-colors duration-400 ${
                        active
                          ? 'text-accent'
                          : done
                            ? 'text-ink hover:text-accent'
                            : 'text-muted/45'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[0.6rem] tabular-nums ${
                          active
                            ? 'border-accent text-accent'
                            : done
                              ? 'border-accent bg-accent text-surface'
                              : 'border-line text-muted/45'
                        }`}
                      >
                        {done ? <CheckIcon className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                    {index < STEPS.length - 1 ? (
                      <span className="h-px w-6 bg-line" />
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </div>
        </header>

        <div className="grid gap-14 py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 0 ? (
                    <div className="space-y-8">
                      <div className="grid gap-8 sm:grid-cols-2">
                        <input
                          required
                          value={customer.name}
                          onChange={(e) => update('name', e.target.value)}
                          placeholder="Full name"
                          className={field}
                          autoComplete="name"
                        />
                        <input
                          required
                          type="email"
                          value={customer.email}
                          onChange={(e) => update('email', e.target.value)}
                          placeholder="Email"
                          className={field}
                          autoComplete="email"
                        />
                        <input
                          required
                          type="tel"
                          value={customer.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          placeholder="Phone"
                          className={field}
                          autoComplete="tel"
                        />
                        <input
                          value={customer.gstin}
                          onChange={(e) => update('gstin', e.target.value)}
                          placeholder="GSTIN (optional, for trade)"
                          className={field}
                        />
                      </div>

                      <textarea
                        required
                        rows={3}
                        value={customer.address}
                        onChange={(e) => update('address', e.target.value)}
                        placeholder="Delivery address"
                        className={`${field} resize-none`}
                        autoComplete="street-address"
                      />

                      <div className="grid gap-8 sm:grid-cols-3">
                        <input
                          required
                          value={customer.city}
                          onChange={(e) => update('city', e.target.value)}
                          placeholder="City"
                          className={field}
                          autoComplete="address-level2"
                        />
                        <label className="block">
                          <span className="sr-only">State</span>
                          <select
                            value={customer.state}
                            onChange={(e) => update('state', e.target.value)}
                            className={`${field} appearance-none`}
                          >
                            {STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </label>
                        <input
                          required
                          value={customer.pincode}
                          onChange={(e) => update('pincode', e.target.value)}
                          placeholder="PIN code"
                          className={field}
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          title="Six-digit PIN code"
                          autoComplete="postal-code"
                        />
                      </div>
                    </div>
                  ) : step === 1 ? (
                    <div className="space-y-4">
                      {[
                        {
                          id: 'standard' as const,
                          label: 'Standard',
                          note: 'Five to eight working days',
                          cost: totals.subtotal >= 5000 ? 'Free' : formatPrice(499),
                        },
                        {
                          id: 'express' as const,
                          label: 'Express',
                          note: 'Two to three working days, metro PIN codes',
                          cost: `+ ${formatPrice(EXPRESS_SURCHARGE)}`,
                        },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setDelivery(option.id)}
                          className={`flex w-full items-center justify-between gap-6 border p-6 text-left transition-colors duration-400 ${
                            delivery === option.id
                              ? 'border-accent bg-accent/5'
                              : 'hover:border-line-strong'
                          }`}
                        >
                          <span className="flex items-center gap-5">
                            <TruckIcon
                              className={`h-5 w-5 shrink-0 ${
                                delivery === option.id ? 'text-accent' : 'text-muted'
                              }`}
                            />
                            <span>
                              <span className="block font-display text-xl font-light">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-[0.78rem] font-light text-muted">
                                {option.note}
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-light tabular-nums">
                            {option.cost}
                          </span>
                        </button>
                      ))}

                      <div className="border-t pt-7">
                        <p className="eyebrow">Estimated arrival</p>
                        <p className="mt-3 font-display text-2xl font-light">
                          {estimateDelivery(delivery)}
                        </p>
                        <p className="mt-3 max-w-[52ch] text-[0.78rem] leading-relaxed font-light text-muted">
                          Made-to-order pieces and anything with a minimum order above ten
                          units are produced in batches and may follow separately. We
                          confirm dates by email before dispatch.
                        </p>
                      </div>

                      <textarea
                        rows={3}
                        value={customer.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        placeholder="Delivery notes — site access, gate code, preferred window"
                        className={`${field} resize-none`}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPayment(method.id)}
                          className={`flex w-full items-center justify-between gap-6 border p-6 text-left transition-colors duration-400 ${
                            payment === method.id
                              ? 'border-accent bg-accent/5'
                              : 'hover:border-line-strong'
                          }`}
                        >
                          <span>
                            <span className="block font-display text-xl font-light">
                              {method.label}
                            </span>
                            <span className="mt-1 block text-[0.78rem] font-light text-muted">
                              {method.note}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              payment === method.id
                                ? 'border-accent bg-accent text-surface'
                                : 'border-line'
                            }`}
                          >
                            {payment === method.id ? (
                              <CheckIcon className="h-3 w-3" />
                            ) : null}
                          </span>
                        </button>
                      ))}

                      <div className="mt-8 flex items-start gap-3 border border-accent/40 bg-accent/5 p-5">
                        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <p className="text-[0.76rem] leading-relaxed font-light text-ink">
                          <strong className="font-normal">
                            No payment is taken in this build.
                          </strong>{' '}
                          There is no processor connected — placing the order records it
                          locally and issues a reference so the flow can be reviewed end
                          to end. Wire{' '}
                          <code className="font-mono text-[0.72rem]">placeOrder</code> in{' '}
                          <code className="font-mono text-[0.72rem]">
                            src/lib/order.ts
                          </code>{' '}
                          to a real gateway before going live.
                        </p>
                      </div>

                      {totals.hasTradeItems ? (
                        <p className="border-l-2 border-accent pl-4 text-[0.76rem] leading-relaxed font-light text-muted">
                          This order contains trade pieces. Those are normally invoiced at
                          50% advance, 40% before dispatch and 10% after installation,
                          against an approved drawing — we will confirm before production
                          starts.
                        </p>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-12 flex flex-wrap items-center gap-6 border-t pt-8">
                <button type="submit" className="btn-luxe btn-solid" disabled={placing}>
                  {step === 2
                    ? `Place order · ${formatPrice(totals.total)}`
                    : `Continue to ${STEPS[step + 1]}`}
                  <ArrowIcon className="h-4 w-4" />
                </button>

                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => (current - 1) as Step)}
                    className="text-[0.68rem] tracking-[0.22em] text-muted uppercase transition-colors hover:text-ink"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    to="/cart"
                    className="text-[0.68rem] tracking-[0.22em] text-muted uppercase transition-colors hover:text-ink"
                  >
                    Back to bag
                  </Link>
                )}
              </div>
            </form>
          </div>

          {/* Order summary */}
          <aside className="lg:col-span-5">
            <div className="border p-7 lg:sticky lg:top-32">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow eyebrow-accent">Order</p>
                <Link
                  to="/cart"
                  className="text-[0.64rem] tracking-[0.18em] text-muted uppercase transition-colors hover:text-ink"
                >
                  Edit
                </Link>
              </div>

              <ul className="mt-7 max-h-[320px] space-y-5 overflow-y-auto pr-1">
                {lines.map((line) => (
                  <li key={line.sku} className="flex gap-4">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden">
                      <ProductImage product={line.product} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-light">
                        {line.product.name}
                      </p>
                      <p className="mt-1 text-[0.68rem] font-light text-muted tabular-nums">
                        {line.qty} × {formatPrice(line.product.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-light tabular-nums">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-7 space-y-3 border-t pt-6 text-sm font-light">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">
                    Shipping {delivery === 'express' ? '(express)' : ''}
                  </dt>
                  <dd className="tabular-nums">
                    {totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">GST (18%)</dt>
                  <dd className="tabular-nums">{formatPrice(totals.gst)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t pt-4">
                  <dt className="eyebrow">Total</dt>
                  <dd className="font-display text-3xl font-light tabular-nums">
                    {formatPrice(totals.total)}
                  </dd>
                </div>
              </dl>

              {step === 2 && selectedPayment ? (
                <p className="mt-6 border-t pt-5 text-[0.7rem] font-light text-muted">
                  Paying by {selectedPayment.label.toLowerCase()} ·{' '}
                  {delivery === 'express' ? 'Express' : 'Standard'} delivery, arriving{' '}
                  {estimateDelivery(delivery)}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
