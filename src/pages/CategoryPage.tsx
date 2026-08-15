import { Link, Navigate, useParams } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { CatalogueView } from '../components/CatalogueView'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/motion/Reveal'
import { ArrowIcon } from '../components/icons'
import type { CategoryId } from '../data/types'

export function CategoryPage() {
  const { productsInCategory, categoriesOf, categoryById, familyById } = useCatalogue()
  const { slug = '' } = useParams()
  const category = categoryById.get(slug as CategoryId)

  if (!category) return <Navigate to="/collections" replace />

  const family = familyById.get(category.family)
  const items = productsInCategory(category.id)
  const siblings = categoriesOf(category.family).filter((c) => c.id !== category.id)

  return (
    <>
      <PageHeader
        eyebrow={family?.kicker ?? 'Catalogue'}
        title={category.name}
        blurb={category.blurb}
        meta={`${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          ...(family ? [{ label: family.name, to: `/collections/${family.slug}` }] : []),
          { label: category.name },
        ]}
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <CatalogueView products={items} />
        </div>
      </section>

      {siblings.length > 0 && family ? (
        <section className="border-t py-20 lg:py-28">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
            <Reveal from="none">
              <p className="eyebrow eyebrow-accent">Also in {family.name}</p>
            </Reveal>

            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {siblings.map((sibling, index) => (
                <Reveal key={sibling.id} delay={index * 0.05}>
                  <Link
                    to={`/catalogue/${sibling.slug}`}
                    className="group flex items-center gap-3 font-display text-2xl font-light lg:text-3xl"
                  >
                    <span className="link-draw">{sibling.name}</span>
                    <ArrowIcon className="h-4 w-4 text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
