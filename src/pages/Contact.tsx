import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/motion/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ArrowIcon } from '../components/icons'
import { useWishlist } from '../context/wishlist'

const INTERESTS = [
  'Glamping & hospitality structures',
  'Event structures & marquees',
  'Travel & camping bags',
  'Sleep systems & camp furniture',
  'Outdoor living & covers',
  'Corporate gifting',
  'Architect / designer fabrication',
  'Retail or dealer partnership',
]

const CHANNELS = [
  {
    label: 'Studio',
    lines: ['New Delhi · NCR', 'Visits by appointment'],
  },
  {
    label: 'Trade & projects',
    lines: ['trade@canvasemporium.in', 'Response within one working day'],
  },
  {
    label: 'General',
    lines: ['studio@canvasemporium.in', 'Mon–Sat, 10:00–18:30 IST'],
  },
]

const PROCESS = [
  ['01', 'Enquiry', 'Tell us the site, the dimensions, the unit count and the date.'],
  ['02', 'Specification', 'We advise on cloth, frame and hardware, and send swatches.'],
  ['03', 'Drawing', 'A measured drawing is issued and approved before anything is cut.'],
  [
    '04',
    'Quotation',
    'Three tiers — Essential, Signature, Luxury — valid fifteen to thirty days.',
  ],
  [
    '05',
    'Production',
    'Fifty per cent advance starts the run. Eight to ten weeks for bespoke.',
  ],
  [
    '06',
    'Installation',
    'Freight and site work quoted separately. Ten per cent settles after.',
  ],
]

const FAQ = [
  {
    q: 'What is your minimum order?',
    a: 'It varies by piece and is printed on every product page. Small canvas goods start at ten to twenty-five units; tents and structures are frequently one, and the Swiss cottage range is two.',
  },
  {
    q: 'Do you ship outside India?',
    a: 'Yes, on a quoted basis. Freight, duties and packing are quoted as separate line items so there is nothing hidden inside the unit price.',
  },
  {
    q: 'Can you match a drawing we already have?',
    a: 'That is the Architect & Designer commission. You supply the intent; we advise on cloth weight, seam strategy and hardware, prototype once, then produce. Trade terms apply on repeat runs.',
  },
  {
    q: 'How long does a resort package take?',
    a: 'Eight to ten weeks from approved drawing for bespoke structures, delivered as consolidated freight with a single installation visit for five keys and two shipments for ten.',
  },
  {
    q: 'Is fire-retardant cloth available?',
    a: 'Yes, with certification, where a venue or local authority requires it. It is specified at the RFQ stage because it changes both the cloth and the price.',
  },
]

const field =
  'w-full border-0 border-b border-line bg-transparent py-3.5 text-sm font-light text-ink placeholder:text-muted/50 transition-colors duration-400 focus:border-accent focus:outline-none'

export function Contact() {
  const { items } = useWishlist()
  const [interest, setInterest] = useState<string[]>([])
  const [reference, setReference] = useState<string | null>(null)

  function toggleInterest(value: string) {
    setInterest((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())

    // No backend is wired up in this catalogue build — the payload is logged so
    // it can be picked up by whatever the site is eventually connected to.
    console.info('[Canvas Emporium] dealer enquiry', {
      ...data,
      interest,
      saved: items.map((product) => product.sku),
      submittedAt: new Date().toISOString(),
    })

    setReference(`CE-${Date.now().toString(36).toUpperCase().slice(-6)}`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us about"
        subtitle="the site."
        blurb="For project work we will want dimensions, location, unit count, intended use, target date and budget. The more of that arrives in the first message, the sooner a real number comes back."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
      />

      {/* Channels */}
      <section className="border-b py-14">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-3">
            {CHANNELS.map((channel, index) => (
              <Reveal key={channel.label} delay={index * 0.08}>
                <p className="eyebrow eyebrow-accent">{channel.label}</p>
                <div className="mt-4 space-y-1">
                  {channel.lines.map((line) => (
                    <p key={line} className="text-sm font-light text-muted">
                      {line.includes('@') ? (
                        <a href={`mailto:${line}`} className="link-draw text-ink">
                          {line}
                        </a>
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="border-b py-24 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <SplitHeading
                  text="Dealer & project enquiry"
                  className="font-display text-[clamp(2rem,3.8vw,3rem)] leading-[1.08] font-light"
                />
                <Reveal delay={0.18}>
                  <p className="mt-7 text-sm leading-[1.85] font-light text-muted">
                    Sample kits, fabric swatches and a six-page technical deck are sent to
                    qualified trade enquiries at no cost. For custom work, production
                    starts only after an approved drawing.
                  </p>
                </Reveal>

                {items.length > 0 ? (
                  <Reveal delay={0.26}>
                    <div className="mt-8 border-l-2 border-accent pl-4">
                      <p className="eyebrow">Attached from your saved list</p>
                      <p className="mt-2 text-sm font-light text-muted">
                        {items.map((product) => product.sku).join(' · ')}
                      </p>
                    </div>
                  </Reveal>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-8">
              {reference ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="border py-20 text-center"
                >
                  <p className="eyebrow eyebrow-accent">Reference {reference}</p>
                  <h2 className="mx-auto mt-6 max-w-[24ch] font-display text-3xl leading-tight font-light">
                    Thank you. A member of the studio will be in touch within one working
                    day.
                  </h2>
                  <button
                    type="button"
                    onClick={() => setReference(null)}
                    className="btn-luxe mt-10"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <input
                      required
                      name="name"
                      placeholder="Name"
                      className={field}
                      autoComplete="name"
                    />
                    <input
                      name="organisation"
                      placeholder="Organisation"
                      className={field}
                      autoComplete="organization"
                    />
                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="Email"
                      className={field}
                      autoComplete="email"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone or WhatsApp"
                      className={field}
                      autoComplete="tel"
                    />
                    <input
                      name="location"
                      placeholder="City or site location"
                      className={field}
                      autoComplete="address-level2"
                    />
                    <input
                      name="units"
                      placeholder="Units required"
                      className={field}
                      inputMode="numeric"
                    />
                  </div>

                  <fieldset>
                    <legend className="eyebrow">Interested in</legend>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {INTERESTS.map((option) => {
                        const active = interest.includes(option)
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleInterest(option)}
                            aria-pressed={active}
                            className={`border px-4 py-2.5 text-[0.7rem] tracking-[0.1em] transition-colors duration-400 ${
                              active
                                ? 'border-accent bg-accent/10 text-ink'
                                : 'text-muted hover:border-accent hover:text-ink'
                            }`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>

                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Site, dimensions, intended use, target date, budget"
                    className={`${field} resize-none`}
                  />

                  <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-[42ch] text-[0.7rem] leading-relaxed font-light text-muted">
                      By sending this you agree to be contacted about your enquiry. We do
                      not add trade enquiries to a mailing list.
                    </p>
                    <button type="submit" className="btn-luxe btn-solid shrink-0">
                      Send enquiry
                      <ArrowIcon className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-b bg-surface-2 py-24 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <Reveal from="none">
            <p className="eyebrow eyebrow-accent">How a project runs</p>
          </Reveal>
          <SplitHeading
            text="Six steps, in this order, every time."
            className="mt-6 max-w-[18ch] font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] font-light"
          />

          <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map(([n, title, body], index) => (
              <Reveal key={n} delay={(index % 3) * 0.08}>
                <div className="border-t pt-6">
                  <span className="font-display text-xl font-light tabular-nums text-accent">
                    {n}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-light">{title}</h3>
                  <p className="mt-3 text-[0.84rem] leading-[1.8] font-light text-muted">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">Questions</p>
              </Reveal>
              <SplitHeading
                text="Asked often enough to answer here."
                className="mt-6 font-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.08] font-light"
              />
            </div>

            <div className="lg:col-span-8">
              <div className="border-t">
                {FAQ.map((item, index) => (
                  <Reveal key={item.q} delay={index * 0.06}>
                    <details className="group border-b py-6">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-8 font-display text-xl leading-snug font-light lg:text-2xl [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <span className="mt-2 h-px w-5 shrink-0 bg-accent transition-transform duration-500 group-open:rotate-90" />
                      </summary>
                      <p className="mt-4 max-w-[62ch] text-sm leading-[1.85] font-light text-muted">
                        {item.a}
                      </p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
