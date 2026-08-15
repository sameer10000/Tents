import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { CatalogueView } from '../components/CatalogueView'
import { PageHeader } from '../components/PageHeader'
import { PagedCarousel } from '../components/PagedCarousel'
import { ProductImage } from '../components/ProductImage'
import { Reveal } from '../components/motion/Reveal'
import { ArrowIcon } from '../components/icons'

/** One representative piece per house, for the index strip. */
const FACE: Record<string, string> = {
  shelter: 'T02',
  travel: 'DF01',
  sleep: 'SB03',
  field: 'FC01',
  living: 'O07',
  home: 'H01',
  companion: 'P02',
  atelier: 'X03',
}

export function Collections() {
  const { productBySku, products, productsInFamily, categories, families } =
    useCatalogue()
  return (
    <>
      <PageHeader
        eyebrow="The Catalogue"
        title="Everything"
        subtitle="in one place."
        blurb="One hundred and twenty-two pieces across eight houses and twenty-one sections. Filter by section, price or counter — or read it end to end, which is how it was written."
        meta={`${products.length} pieces`}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections' }]}
      />

      {/* House index */}
      <section className="border-b py-16 lg:py-20">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <PagedCarousel
            label="houses"
            itemsPerPage={4}
            gridClassName="grid-cols-2 lg:grid-cols-4"
            gapClassName="gap-x-6 gap-y-10"
          >
            {families.map((family, index) => {
              const face = productBySku.get(FACE[family.id] ?? '')
              const count = productsInFamily(family.id).length

              return (
                <Reveal key={family.id} delay={(index % 4) * 0.07}>
                  <Link to={`/collections/${family.slug}`} className="group block">
                    <div className="relative aspect-3/2 overflow-hidden">
                      {face ? (
                        <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
                          <ProductImage product={face} />
                        </div>
                      ) : null}
                      <div className="absolute inset-0 bg-ink-950/25 transition-colors duration-700 group-hover:bg-ink-950/5" />
                    </div>

                    <div className="mt-5 flex items-baseline justify-between gap-4">
                      <h2 className="font-display text-2xl font-light">
                        <span className="link-draw">{family.name}</span>
                      </h2>
                      <span className="text-[0.62rem] tracking-[0.2em] text-muted/60 tabular-nums">
                        {count}
                      </span>
                    </div>
                    <p className="eyebrow mt-2">{family.kicker}</p>
                  </Link>
                </Reveal>
              )
            })}
          </PagedCarousel>
        </div>
      </section>

      {/* Full catalogue */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <CatalogueView products={products} categories={categories} />
        </div>
      </section>

      <section className="border-t py-20">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center gap-6 px-5 text-center lg:px-10">
          <p className="eyebrow eyebrow-accent">Not listed</p>
          <h2 className="max-w-[20ch] font-display text-4xl leading-tight font-light">
            If it can be cut from canvas, it can be made.
          </h2>
          <Link to="/collections/atelier" className="btn-luxe mt-4">
            The Atelier
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
