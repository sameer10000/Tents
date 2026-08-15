import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { PageHeader } from '../components/PageHeader'
import { ProductImage } from '../components/ProductImage'
import { Parallax } from '../components/motion/Parallax'
import { Reveal } from '../components/motion/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ArrowIcon } from '../components/icons'
import { useUI } from '../context/ui'

const PRINCIPLES = [
  {
    n: '01',
    title: 'Design-led, not price-led',
    body: 'There is no shortage of people in India who will sell a tent for less. There is a shortage of people who will draw one properly, specify the cloth honestly and stand behind it in year four. We compete on the second thing.',
  },
  {
    n: '02',
    title: 'One material, many rooms',
    body: 'A bell tent, a weekender and a laundry hamper share a bolt, a stitch and a set of hardware conventions. That discipline is why the range holds together and why a tent customer becomes a bag customer.',
  },
  {
    n: '03',
    title: 'Made where it is sold',
    body: 'Cut and sewn in Indian manufacturing clusters with people who have been doing it for a generation. Local production is not a marketing line here; it is the reason a bespoke commission takes eight weeks and not eight months.',
  },
  {
    n: '04',
    title: 'Made to order before made to stock',
    body: 'Low minimums and batch production instead of speculative inventory. It keeps the catalogue broad and the warehouse narrow — and it means the pieces you see are the pieces we can actually deliver.',
  },
]

const CHAPTERS = [
  {
    period: 'The inheritance',
    title: 'A generation of knowing how cloth behaves',
    body: 'The house begins inside a family business ecosystem that has worked with fabric, fabrication and trade supply for decades. That is not a founding myth — it is a supply chain, a set of relationships and an ability to tell a good seam from a fast one at a glance.',
  },
  {
    period: 'The observation',
    title: 'India already makes the tents. Nobody brands them.',
    body: 'Jaipur, Jodhpur and Delhi hold real manufacturing clusters producing bell tents and safari structures at serious quality. The gap was never production. It was design, specification, service and someone to call in year three.',
  },
  {
    period: 'The decision',
    title: 'Build the brand before building the factory',
    body: 'Outsourced production, our own drawings, our own quality gate, our own customer. Owned manufacturing comes when volume justifies it and not one season earlier — a factory built on hope is the fastest way to lose a good idea.',
  },
  {
    period: 'The catalogue',
    title: 'One hundred and twenty-two pieces, eight houses',
    body: 'From a ₹499 peg bag to a ten-tent resort package. Hospitality and project work is the profit engine; the direct range builds the audience, the repeat purchase and the reason anyone knows the name.',
  },
]

export function About() {
  const { productBySku, products, categories, families } = useCatalogue()
  const { openInquiry } = useUI()
  const opening = productBySku.get('T04')
  const closing = productBySku.get('X04')

  const skuLow = Math.min(...products.map((p) => p.price))
  const skuHigh = Math.max(...products.map((p) => p.price))

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A canvas house,"
        subtitle="not a tent shop."
        blurb="Canvas Emporium designs and manufactures shelter, carry and outdoor living from a single material discipline — for resorts, architects, event firms and people who sleep outside on purpose."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
      />

      {/* Opening */}
      <section className="border-b py-24 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <Reveal delay={0.1}>
                <div className="relative aspect-4/5 overflow-hidden">
                  <Parallax
                    distance={80}
                    zoom={1.14}
                    className="absolute -inset-y-16 inset-x-0"
                  >
                    {opening ? <ProductImage product={opening} priority /> : null}
                  </Parallax>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-32">
                <SplitHeading
                  text="Tents are the hero. Canvas is the platform."
                  className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.1] font-light"
                />

                <Reveal delay={0.2}>
                  <p className="mt-9 text-sm leading-[1.9] font-light text-muted lg:text-base">
                    Position a business as a tent manufacturer and you compete on price
                    with every workshop in the country. Position it as a canvas design and
                    manufacturing house — for outdoors, hospitality and everyday living —
                    and a single enquiry about a bell tent can become a resort package, a
                    restaurant canopy, a corporate gifting run and a customer who buys a
                    weekender for themselves.
                  </p>
                </Reveal>

                <Reveal delay={0.28}>
                  <p className="mt-6 text-sm leading-[1.9] font-light text-muted lg:text-base">
                    That is the whole strategy. The catalogue is broad on purpose so the
                    ladder exists, and operationally narrow on purpose so nothing sits in
                    a warehouse waiting to be discounted.
                  </p>
                </Reveal>

                <Reveal delay={0.36}>
                  <div className="mt-12 grid grid-cols-2 gap-8 border-t pt-8">
                    {[
                      { figure: String(products.length), label: 'Pieces' },
                      { figure: String(categories.length), label: 'Sections' },
                      { figure: String(families.length), label: 'Houses' },
                      { figure: '₹499 – ₹12.5L', label: 'Catalogue range', small: true },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p
                          className={`font-display font-light tabular-nums text-accent ${
                            stat.small ? 'text-2xl' : 'text-5xl'
                          } leading-none`}
                        >
                          {stat.figure}
                        </p>
                        <p className="eyebrow mt-3">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="sr-only">
                    Prices range from {skuLow} to {skuHigh} rupees.
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <section className="border-b py-24 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <Reveal from="none">
            <p className="eyebrow eyebrow-accent">How it came about</p>
          </Reveal>

          <div className="mt-14 border-t">
            {CHAPTERS.map((chapter, index) => (
              <Reveal key={chapter.period} delay={(index % 2) * 0.08}>
                <article className="grid gap-6 border-b py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
                  <p className="eyebrow lg:col-span-3">{chapter.period}</p>
                  <h2 className="font-display text-2xl leading-tight font-light lg:col-span-4 lg:text-3xl">
                    {chapter.title}
                  </h2>
                  <p className="text-sm leading-[1.9] font-light text-muted lg:col-span-5">
                    {chapter.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-b bg-surface-2 py-24 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="max-w-[20ch]">
            <Reveal from="none">
              <p className="eyebrow eyebrow-accent">Principles</p>
            </Reveal>
            <SplitHeading
              text="Four rules we do not trade against."
              className="mt-6 font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[1.04] font-light"
            />
          </div>

          <div className="mt-16 grid gap-x-14 gap-y-14 lg:grid-cols-2">
            {PRINCIPLES.map((item, index) => (
              <Reveal key={item.n} delay={(index % 2) * 0.1}>
                <div className="flex gap-7 border-t pt-8">
                  <span className="font-display text-2xl leading-none font-light tabular-nums text-accent">
                    {item.n}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl leading-tight font-light">
                      {item.title}
                    </h3>
                    <p className="mt-4 max-w-[50ch] text-sm leading-[1.85] font-light text-muted">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who we work with */}
      <section className="grain relative overflow-hidden bg-ink-950 py-28 lg:py-40">
        <div className="absolute inset-0 opacity-35">
          <Parallax distance={90} zoom={1.16} className="absolute -inset-y-20 inset-x-0">
            {closing ? <ProductImage product={closing} /> : null}
          </Parallax>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/70 to-ink-950/95" />
        <div className="grain-layer" />

        <div className="relative mx-auto max-w-[1500px] px-5 lg:px-10">
          <Reveal from="none">
            <p className="eyebrow text-brass-300">Who we work with</p>
          </Reveal>
          <SplitHeading
            text="Properties, practices and people who camp properly."
            className="mt-6 max-w-[20ch] font-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.02] font-light text-ivory-100"
          />

          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                'Resorts & glamping operators',
                'Keys, back-of-house, seasonal replacement',
              ],
              [
                'Architects & interior designers',
                'Specification support, fabrication to drawing',
              ],
              ['Wedding & event firms', 'Marquees, lounge canopies, tipis, hire stock'],
              [
                'Restaurants & cafés',
                'Terrace canopies, covers, aprons, fire-retardant cloth',
              ],
              ['Corporate buyers', 'Gifting runs from one hundred sets, marked to brand'],
              ['Private clients', 'Garden canopies, cabanas, and the whole direct range'],
            ].map(([title, body], index) => (
              <Reveal key={title} delay={(index % 3) * 0.08}>
                <div className="border-t border-ivory-100/15 pt-6">
                  <h3 className="font-display text-xl font-light text-ivory-100">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-[0.82rem] leading-relaxed font-light text-ivory-200/60">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-16 flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="btn-luxe border-ivory-100/30 text-ivory-100 hover:border-ivory-100"
              >
                Contact the studio
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => openInquiry()}
                className="text-[0.68rem] tracking-[0.26em] text-ivory-200/70 uppercase transition-colors duration-500 hover:text-brass-300"
              >
                Trade programme
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
