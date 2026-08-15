import { Link } from 'react-router-dom'
import { CinematicHero } from '../components/CinematicHero'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { Parallax } from '../components/motion/Parallax'
import { Reveal } from '../components/motion/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ArrowIcon } from '../components/icons'
import { useCatalogue } from '../data/catalogue'
import { useUI } from '../context/ui'

/** Houses given editorial tiles on the home page, with the plate used for each. */
const SHOWCASE = [
  { slug: 'tents', sku: 'T04', span: 'lg:col-span-7', ratio: 'aspect-4/3' },
  { slug: 'bags', sku: 'B06', span: 'lg:col-span-5', ratio: 'aspect-4/3' },
  { slug: 'sleeping', sku: 'SB03', span: 'lg:col-span-5', ratio: 'aspect-4/3' },
  { slug: 'field', sku: 'LA01', span: 'lg:col-span-7', ratio: 'aspect-4/3' },
]

const CRAFT = [
  {
    n: '01',
    title: 'Cloth first',
    body: 'Every structure begins with a bolt specification — weight, weave, coating and treatment — before a single panel is cut. Cloth decides what a tent can survive.',
  },
  {
    n: '02',
    title: 'Seams that outlive the fabric',
    body: 'Load-bearing seams are double bar-tacked and, where water is the enemy, welded rather than stitched. A needle hole is a hole.',
  },
  {
    n: '03',
    title: 'Hardware you can replace',
    body: 'Solid brass, hot-dip galvanised steel, stainless where salt is involved. Nothing riveted shut that a person might reasonably want to open.',
  },
  {
    n: '04',
    title: 'Tested where it is sold',
    body: 'Water column, colour fastness and load are verified against the conditions of an Indian season — thirty days of monsoon, then eight months of sun.',
  },
]

export function Home() {
  const { featured, productBySku, products, categories, families } = useCatalogue()
  const { openInquiry } = useUI()
  const signature = featured.slice(0, 8)

  return (
    <>
      <CinematicHero />

      {/* ── Manifesto ─────────────────────────────────────────────────── */}
      <section className="border-b py-28 lg:py-40">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">The House</p>
              </Reveal>
            </div>

            <div className="lg:col-span-9">
              <SplitHeading
                text="We are not a tent seller. We are a canvas company that happens to make the best rooms in the field."
                className="font-display text-[clamp(1.9rem,3.6vw,3.4rem)] leading-[1.18] font-light"
              />

              <Reveal delay={0.2}>
                <p className="mt-10 max-w-[62ch] text-sm leading-[1.85] font-light text-muted lg:text-base">
                  Canvas Emporium designs and manufactures shelter, carry and outdoor
                  living from a single material discipline. A four-metre bell tent and a
                  waxed weekender come off the same understanding of cloth, thread and
                  hardware — which is why the tent has a bag that fits it and the bag has
                  a stitch that survives it. Tents are the hero. Canvas is the platform.
                </p>
              </Reveal>

              <div className="mt-16 grid gap-10 sm:grid-cols-3">
                {[
                  { figure: String(products.length), label: 'Pieces in catalogue' },
                  { figure: String(categories.length), label: 'Catalogue sections' },
                  { figure: String(families.length), label: 'Houses' },
                ].map((stat, index) => (
                  <Reveal key={stat.label} delay={0.1 + index * 0.1}>
                    <p className="font-display text-6xl leading-none font-light tabular-nums text-accent">
                      {stat.figure}
                    </p>
                    <p className="eyebrow mt-4">{stat.label}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The houses ────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">Collections</p>
              </Reveal>
              <SplitHeading
                text="Eight houses,"
                className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.6rem)] leading-[0.98] font-light"
              />
              <SplitHeading
                text="one material."
                delay={0.1}
                className="font-display text-[clamp(2.4rem,5.5vw,4.6rem)] leading-[0.98] font-light text-muted/50 italic"
              />
            </div>
            <Reveal delay={0.2}>
              <Link to="/collections" className="btn-luxe">
                View all {products.length}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <div className="mt-20 grid gap-6 lg:grid-cols-12">
            {SHOWCASE.map((tile, index) => {
              const family = families.find((f) => f.slug === tile.slug)
              const product = productBySku.get(tile.sku)
              if (!family || !product) return null

              return (
                <Reveal key={tile.slug} delay={(index % 2) * 0.12} className={tile.span}>
                  <Link
                    to={`/collections/${family.slug}`}
                    className="group relative block overflow-hidden"
                  >
                    <div className={`relative ${tile.ratio} overflow-hidden`}>
                      <Parallax
                        distance={54}
                        zoom={1.1}
                        className="absolute -inset-y-12 inset-x-0"
                      >
                        <ProductImage product={product} />
                      </Parallax>
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/15 to-transparent" />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 lg:p-10">
                      <div>
                        <p className="eyebrow text-brass-300">{family.kicker}</p>
                        <h3 className="mt-3 font-display text-4xl leading-none font-light text-ivory-100 lg:text-5xl">
                          {family.name}
                        </h3>
                        <p className="mt-4 max-w-[42ch] text-[0.82rem] leading-relaxed font-light text-ivory-200/65">
                          {family.blurb}
                        </p>
                      </div>
                      <span className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory-100/25 text-ivory-100 transition-all duration-600 group-hover:border-brass-300 group-hover:bg-brass-400/15">
                        <ArrowIcon className="h-4 w-4 transition-transform duration-600 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Signature pieces ──────────────────────────────────────────── */}
      <section className="border-y bg-surface-2 py-28 lg:py-40">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">Signature</p>
              </Reveal>
              <SplitHeading
                text="The pieces we would show first."
                className="mt-6 max-w-[16ch] font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[1.02] font-light"
              />
            </div>
            <Reveal delay={0.2}>
              <p className="max-w-[34ch] text-sm leading-relaxed font-light text-muted">
                Not the cheapest, and not always the most expensive — the pieces that best
                explain what the house is for.
              </p>
            </Reveal>
          </div>

          <div className="mt-20 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {signature.map((product, index) => (
              <ProductCard
                key={product.sku}
                product={product}
                index={index}
                priority={index < 4}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Craftsmanship ─────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                <Reveal from="none">
                  <p className="eyebrow eyebrow-accent">Craftsmanship</p>
                </Reveal>
                <SplitHeading
                  text="Four decisions"
                  className="mt-6 font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[1] font-light"
                />
                <SplitHeading
                  text="made before cutting."
                  delay={0.1}
                  className="font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[1] font-light text-muted/50 italic"
                />

                <Reveal delay={0.25}>
                  <div className="relative mt-12 aspect-3/2 overflow-hidden">
                    <Parallax
                      distance={60}
                      zoom={1.12}
                      className="absolute -inset-y-14 inset-x-0"
                    >
                      {productBySku.get('T11') ? (
                        <ProductImage product={productBySku.get('T11')!} />
                      ) : null}
                    </Parallax>
                  </div>
                </Reveal>

                <Reveal delay={0.3}>
                  <Link to="/craftsmanship" className="btn-luxe mt-10">
                    How it is made
                    <ArrowIcon className="h-4 w-4" />
                  </Link>
                </Reveal>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ul className="divide-y">
                {CRAFT.map((item, index) => (
                  <Reveal key={item.n} delay={index * 0.08} as="li">
                    <div className="flex gap-8 py-10 lg:gap-14 lg:py-14">
                      <span className="font-display text-2xl leading-none font-light tabular-nums text-accent">
                        {item.n}
                      </span>
                      <div>
                        <h3 className="font-display text-3xl leading-tight font-light lg:text-[2.5rem]">
                          {item.title}
                        </h3>
                        <p className="mt-4 max-w-[52ch] text-sm leading-[1.85] font-light text-muted">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hospitality band ──────────────────────────────────────────── */}
      <section className="grain relative overflow-hidden bg-ink-950 py-32 lg:py-48">
        <div className="absolute inset-0 opacity-45">
          <Parallax distance={90} zoom={1.15} className="absolute -inset-y-20 inset-x-0">
            {productBySku.get('X03') ? (
              <ProductImage product={productBySku.get('X03')!} />
            ) : null}
          </Parallax>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/65 to-ink-950/95" />
        <div className="grain-layer" />

        <div className="relative mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="max-w-[26ch]">
            <Reveal from="none">
              <p className="eyebrow text-brass-300">The Atelier</p>
            </Reveal>
            <SplitHeading
              text="A property, delivered."
              className="mt-7 font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.98] font-light text-ivory-100"
            />
          </div>

          <div className="mt-14 flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
            <Reveal delay={0.15}>
              <p className="max-w-[54ch] text-sm leading-[1.9] font-light text-ivory-200/70 lg:text-base">
                Five keys or ten, with matched interiors, deck detailing, back-of-house
                structures and one drawing set covering the lot. We survey, draw,
                prototype the junctions that matter, then build. Terms are fifty per cent
                in advance, forty before dispatch, ten after installation — and nothing is
                cut until a drawing is approved.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/collections/atelier"
                  className="btn-luxe border-ivory-100/30 text-ivory-100 hover:border-ivory-100"
                >
                  Atelier commissions
                </Link>
                <button
                  type="button"
                  onClick={() => openInquiry()}
                  className="text-[0.68rem] tracking-[0.26em] text-ivory-200/70 uppercase transition-colors duration-500 hover:text-brass-300"
                >
                  Start a project
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
