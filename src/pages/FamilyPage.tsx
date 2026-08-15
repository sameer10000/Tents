import { Link, Navigate, useParams } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { CatalogueView } from '../components/CatalogueView'
import { PageHeader } from '../components/PageHeader'
import { ProductImage } from '../components/ProductImage'
import { Parallax } from '../components/motion/Parallax'
import { Reveal } from '../components/motion/Reveal'
import { ArrowIcon } from '../components/icons'
import type { FamilyId } from '../data/types'

/**
 * A few routes present more than one house.
 *
 * `/collections/sleeping` is the "Sleeping Bags & Accessories" page: sleep
 * systems plus the camp furniture, light and organisation that go with them.
 */
const COMPOSITE: Record<string, { also: FamilyId[]; title: string; subtitle: string }> = {
  sleeping: {
    also: ['field'],
    title: 'Sleeping bags',
    subtitle: '& accessories.',
  },
}

/** The plate used behind each house header. */
const BANNER: Record<string, string> = {
  shelter: 'T05',
  travel: 'DF03',
  sleep: 'SB04',
  field: 'LA05',
  living: 'O09',
  home: 'H02',
  companion: 'P02',
  atelier: 'X04',
}

export function FamilyPage() {
  const { productBySku, products, categoriesOf, familyBySlug } = useCatalogue()
  const { slug = '' } = useParams()
  const family = familyBySlug.get(slug)

  if (!family) return <Navigate to="/collections" replace />

  const composite = COMPOSITE[slug]
  const familyIds: FamilyId[] = [family.id, ...(composite?.also ?? [])]

  const scoped = products.filter((product) => familyIds.includes(product.family))
  const scopedCategories = familyIds.flatMap((id) => categoriesOf(id))
  const banner = productBySku.get(BANNER[family.id] ?? '')

  const title = composite?.title ?? family.name
  const subtitle = composite?.subtitle ?? family.kicker.toLowerCase() + '.'

  return (
    <>
      <PageHeader
        eyebrow={family.kicker}
        title={title}
        subtitle={subtitle}
        blurb={family.blurb}
        meta={`${scoped.length} pieces · ${scopedCategories.length} sections`}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: family.name },
        ]}
      />

      {/* The Atelier is the one house whose pieces can be drawn before they
          are quoted, so it carries the configurator. */}
      {family.id === 'atelier' ? (
        <section className="border-b bg-surface-2 py-14 lg:py-16">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-8 px-5 lg:px-10">
            <div>
              <p className="eyebrow eyebrow-accent">Draw it yourself</p>
              <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(1.9rem,3.4vw,2.8rem)] leading-tight font-light">
                Design your own tent, live.
              </h2>
              <p className="mt-4 max-w-[54ch] text-sm leading-relaxed font-light text-muted">
                Bell tents, medieval pavilions and safari structures — set the dimensions,
                the cloth, the openings and the colourway, and watch it build in front of
                you. Send us the result and we will quote it.
              </p>
            </div>

            <Link to="/create-tent" className="btn-luxe btn-solid shrink-0">
              Create your tent
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* Banner */}
      {banner ? (
        <section className="relative h-[42vh] min-h-[280px] overflow-hidden lg:h-[58vh]">
          <Parallax distance={110} zoom={1.16} className="absolute -inset-y-24 inset-x-0">
            <ProductImage product={banner} priority />
          </Parallax>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </section>
      ) : null}

      {/* Section index */}
      <section className="border-b py-16 lg:py-20">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <Reveal from="none">
            <p className="eyebrow eyebrow-accent">Sections</p>
          </Reveal>

          <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {scopedCategories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 3) * 0.07}>
                <Link
                  to={`/catalogue/${category.slug}`}
                  className="group flex items-start justify-between gap-6 border-b py-5 transition-colors duration-500 hover:border-accent"
                >
                  <div>
                    <h2 className="font-display text-xl leading-tight font-light">
                      {category.name}
                    </h2>
                    <p className="mt-2 max-w-[38ch] text-[0.78rem] leading-relaxed font-light text-muted">
                      {category.blurb}
                    </p>
                  </div>
                  <ArrowIcon className="mt-1 h-4 w-4 shrink-0 text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <CatalogueView products={scoped} categories={scopedCategories} />
        </div>
      </section>
    </>
  )
}
