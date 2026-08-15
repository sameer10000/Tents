import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { PageHeader } from '../components/PageHeader'
import { ProductImage } from '../components/ProductImage'
import { Parallax } from '../components/motion/Parallax'
import { Reveal } from '../components/motion/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ArrowIcon } from '../components/icons'
import { useUI } from '../context/ui'

const CLOTHS = [
  {
    name: 'Cotton duck, 12–14 oz',
    use: 'Totes, organisers, home storage',
    note: 'Soft enough to fold, structured enough to stand. Washes and softens rather than wearing through.',
  },
  {
    name: 'Cotton duck, 18–20 oz',
    use: 'Duffels, bedrolls, firewood carry',
    note: 'The weight at which canvas stops behaving like fabric and starts behaving like a panel.',
  },
  {
    name: 'Treated cotton canvas, 360–520 gsm',
    use: 'Bell tents, tipis, yurts, canopies',
    note: 'Mill-treated for rot, mould and UV — not sprayed after cutting, which wears off at the folds first.',
  },
  {
    name: 'Ripstop poly-cotton, 440–480 gsm',
    use: 'Safari suites, Swiss cottages, marquees',
    note: 'The strength of a synthetic with the hand and breathability of a natural cloth.',
  },
  {
    name: 'Silicone-PU ripstop nylon, 20–70 D',
    use: 'Trekking and expedition shelter',
    note: 'Coated on both faces. Silicone on the outside for tear strength, PU inside so seam tape will hold.',
  },
  {
    name: 'TPU-laminated tarpaulin, 500–900 D',
    use: 'Dry bags, cargo duffels, groundsheets',
    note: 'Welded rather than sewn wherever it matters. A stitch is a row of holes.',
  },
  {
    name: 'Solution-dyed acrylic',
    use: 'Outdoor cushions, shade, marine canvas',
    note: 'Pigment added before the fibre is spun, so colour goes through rather than onto the cloth.',
  },
]

const WATER = [
  {
    figure: '1,500',
    unit: 'mm',
    title: 'Treated cotton canvas',
    body: 'A cotton bell tent does not repel water so much as swell to exclude it. The fibres close under the first soaking and stay closed. It is why a canvas tent must be weathered once before it is trusted.',
  },
  {
    figure: '3,000',
    unit: 'mm',
    title: 'Coated polyester and nylon',
    body: 'The three-season standard. Enough for sustained rain on a pitched fly, provided the seams are taped and the floor is a bathtub rather than a flat sheet.',
  },
  {
    figure: '5,000',
    unit: 'mm+',
    title: 'Expedition coating',
    body: 'Where wind drives water into the cloth rather than letting it run off. Paired with sleeved poles so the fly cannot separate from the frame under load.',
  },
  {
    figure: 'IPX6',
    unit: '',
    title: 'Welded construction',
    body: 'No stitching in the water path at all. Radio-frequency welding fuses the laminate to itself; the join is stronger than the panel either side of it.',
  },
]

const ENGINEERING = [
  {
    n: '01',
    title: 'The frame decides the tent',
    body: 'A sleeved pole cannot part company with its fly. A clip frame can. Every four-season shelter we make is sleeved for that reason alone, and accepts the extra two minutes of pitching that costs.',
  },
  {
    n: '02',
    title: 'Load goes to the ground, not the seam',
    body: 'Guy points are anchored to webbing that runs into a structural seam, never to the cloth face. Sixteen of them on an expedition shell — because the failure mode of a tent is one guy point, not the whole tent.',
  },
  {
    n: '03',
    title: 'Water is a shape problem first',
    body: 'Pooling destroys more canopies than rain does. Every pergola cover and marquee roof has a fall cut into the pattern rather than tensioned in afterwards, so the water has somewhere to be.',
  },
  {
    n: '04',
    title: 'Hardware you can undo',
    body: 'Solid brass, hot-dip galvanised steel, stainless where salt or chlorine is involved. Slings, covers and liners are replaceable — the frame is meant to outlive them, several times.',
  },
]

const TESTS = [
  ['Water column', 'Hydrostatic head to ISO 811', 'Per fabric lot'],
  ['Colour fastness', 'Xenon-arc UV exposure', '1,200–1,500 h'],
  ['Seam strength', 'Tensile pull to failure', 'Per construction'],
  ['Frame load', 'Static and wind loading', 'Per structure'],
  ['Zip cycling', 'Open-close to 10,000 cycles', 'Per hardware batch'],
  ['Dimensional check', 'Cut panel against pattern', 'Every unit'],
]

export function Craftsmanship() {
  const { productBySku } = useCatalogue()
  const { openInquiry } = useUI()
  const cloth = productBySku.get('T05')
  const water = productBySku.get('WT01')
  const frame = productBySku.get('ET03')

  return (
    <>
      <PageHeader
        eyebrow="Craftsmanship"
        title="Cloth, water,"
        subtitle="load and time."
        blurb="Four things decide whether a canvas structure is still standing in its fifth season. None of them is the colour. This is what we specify, why, and how it is checked."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Craftsmanship' }]}
      />

      {/* Opening statement */}
      <section className="border-b py-24 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <SplitHeading
                text="Anyone can sell a tent. The question is what happens to it in the third monsoon."
                className="font-display text-[clamp(1.9rem,3.8vw,3.4rem)] leading-[1.15] font-light"
              />
              <Reveal delay={0.2}>
                <p className="mt-10 max-w-[60ch] text-sm leading-[1.9] font-light text-muted lg:text-base">
                  India is a difficult climate to sell shelter into. Thirty days of
                  standing water, then eight months of ultraviolet at an intensity most
                  European specifications never contemplate. A tent that performs
                  beautifully in a showroom and fails in year three is not a cheaper tent
                  — it is the same tent bought twice. Everything in this catalogue is
                  specified against the second purchase not happening.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.15}>
                <div className="relative aspect-3/4 overflow-hidden">
                  <Parallax
                    distance={70}
                    zoom={1.14}
                    className="absolute -inset-y-16 inset-x-0"
                  >
                    {cloth ? <ProductImage product={cloth} priority /> : null}
                  </Parallax>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter — cloth */}
      <section className="border-b py-24 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <Reveal from="none">
                  <p className="eyebrow eyebrow-accent">Chapter One</p>
                </Reveal>
                <SplitHeading
                  text="The cloth"
                  className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] leading-none font-light"
                />
                <SplitHeading
                  text="comes first."
                  delay={0.1}
                  className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-none font-light text-muted/50 italic"
                />
                <Reveal delay={0.2}>
                  <p className="mt-8 max-w-[38ch] text-sm leading-[1.85] font-light text-muted">
                    Seven cloths cover the entire catalogue. Choosing between them is the
                    first decision on every piece, and the one that cannot be corrected
                    later by better sewing.
                  </p>
                </Reveal>
              </div>
            </div>

            <div className="lg:col-span-8">
              <ul className="divide-y border-t">
                {CLOTHS.map((item, index) => (
                  <Reveal key={item.name} delay={(index % 3) * 0.07} as="li">
                    <div className="grid gap-3 py-7 sm:grid-cols-12 sm:gap-8">
                      <div className="sm:col-span-5">
                        <h3 className="font-display text-xl leading-snug font-light">
                          {item.name}
                        </h3>
                        <p className="eyebrow mt-2">{item.use}</p>
                      </div>
                      <p className="text-[0.85rem] leading-[1.8] font-light text-muted sm:col-span-7">
                        {item.note}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter — water */}
      <section className="grain relative overflow-hidden border-b bg-ink-950 py-28 lg:py-40">
        <div className="absolute inset-0 opacity-30">
          <Parallax distance={100} zoom={1.18} className="absolute -inset-y-24 inset-x-0">
            {water ? <ProductImage product={water} /> : null}
          </Parallax>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/90 via-ink-950/70 to-ink-950/95" />
        <div className="grain-layer" />

        <div className="relative mx-auto max-w-[1500px] px-5 lg:px-10">
          <Reveal from="none">
            <p className="eyebrow text-brass-300">Chapter Two</p>
          </Reveal>
          <SplitHeading
            text="Waterproof is a number, not a word."
            className="mt-6 max-w-[18ch] font-display text-[clamp(2.4rem,5.5vw,4.6rem)] leading-[1] font-light text-ivory-100"
          />

          <Reveal delay={0.2}>
            <p className="mt-8 max-w-[62ch] text-sm leading-[1.9] font-light text-ivory-200/70 lg:text-base">
              A hydrostatic head figure is the height of a water column a fabric holds
              before it lets one drop through. Anyone who says “fully waterproof” without
              one is describing a hope. Here is what each figure in this catalogue
              actually means.
            </p>
          </Reveal>

          <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {WATER.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.08}>
                <div className="border-t border-ivory-100/15 pt-6">
                  <p className="font-display text-5xl leading-none font-light tabular-nums text-brass-300">
                    {item.figure}
                    <span className="ml-1 text-xl text-brass-300/60">{item.unit}</span>
                  </p>
                  <h3 className="mt-5 font-display text-xl font-light text-ivory-100">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[0.82rem] leading-[1.8] font-light text-ivory-200/60">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter — engineering */}
      <section className="border-b py-24 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-32">
                <Reveal from="none">
                  <p className="eyebrow eyebrow-accent">Chapter Three</p>
                </Reveal>
                <SplitHeading
                  text="Engineering"
                  className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] leading-none font-light"
                />
                <SplitHeading
                  text="before ornament."
                  delay={0.1}
                  className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-none font-light text-muted/50 italic"
                />

                <Reveal delay={0.22}>
                  <div className="relative mt-12 aspect-4/3 overflow-hidden">
                    <Parallax
                      distance={60}
                      zoom={1.12}
                      className="absolute -inset-y-14 inset-x-0"
                    >
                      {frame ? <ProductImage product={frame} /> : null}
                    </Parallax>
                  </div>
                </Reveal>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ul className="divide-y">
                {ENGINEERING.map((item, index) => (
                  <Reveal key={item.n} delay={index * 0.07} as="li">
                    <div className="flex gap-8 py-10 lg:gap-12">
                      <span className="font-display text-2xl leading-none font-light tabular-nums text-accent">
                        {item.n}
                      </span>
                      <div>
                        <h3 className="font-display text-2xl leading-tight font-light lg:text-3xl">
                          {item.title}
                        </h3>
                        <p className="mt-4 max-w-[54ch] text-sm leading-[1.85] font-light text-muted">
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

      {/* Testing */}
      <section className="border-b bg-surface-2 py-24 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">Verification</p>
              </Reveal>
              <SplitHeading
                text="What gets checked, and how often."
                className="mt-6 max-w-[18ch] font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] font-light"
              />
            </div>
            <Reveal delay={0.2}>
              <p className="max-w-[36ch] text-sm leading-relaxed font-light text-muted">
                Suppliers are asked for the same technical RFQ so quotes are comparable,
                and the same evidence before a purchase order is raised.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 border-t">
            {TESTS.map((row, index) => (
              <Reveal key={row[0]} delay={index * 0.05}>
                <div className="grid grid-cols-12 gap-4 border-b py-5">
                  <span className="col-span-12 text-[0.85rem] font-light text-ink sm:col-span-4">
                    {row[0]}
                  </span>
                  <span className="col-span-8 text-[0.82rem] font-light text-muted sm:col-span-5">
                    {row[1]}
                  </span>
                  <span className="col-span-4 text-right text-[0.72rem] tracking-[0.14em] text-accent uppercase sm:col-span-3">
                    {row[2]}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Care */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <Reveal from="none">
                <p className="eyebrow eyebrow-accent">Afterwards</p>
              </Reveal>
              <SplitHeading
                text="Nothing here is meant to be thrown away."
                className="mt-6 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] font-light"
              />
            </div>

            <div className="lg:col-span-7">
              <Reveal delay={0.15}>
                <p className="text-sm leading-[1.9] font-light text-muted lg:text-base">
                  Canvas is a repairable material, which is most of its argument. A torn
                  panel is patched, a worn sling is replaced, a waxed shell is re-waxed
                  and the bag continues. Slings, covers, liners, groundsheets, pole
                  sections and peg sets are all available individually — a structure
                  should never be retired because one component reached the end of its
                  life.
                </p>
              </Reveal>

              <Reveal delay={0.22}>
                <p className="mt-8 text-sm leading-[1.9] font-light text-muted lg:text-base">
                  Store canvas dry. That is the whole of the care instruction that
                  actually matters — everything else is preference. A tent packed damp
                  will grow something within a week regardless of how well it was treated
                  at the mill.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="mt-12 flex flex-wrap gap-4">
                  <Link to="/collections" className="btn-luxe">
                    The catalogue
                    <ArrowIcon className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openInquiry()}
                    className="btn-luxe btn-solid"
                  >
                    Request a sample kit
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
