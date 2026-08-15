import { Link } from 'react-router-dom'
import { useCatalogue } from '../data/catalogue'
import { useUI } from '../context/ui'
import { Monogram, Wordmark } from './BrandMark'
import { ArrowIcon } from './icons'

const HOUSE = [
  { label: 'Craftsmanship', to: '/craftsmanship' },
  { label: 'About', to: '/about' },
  { label: 'Contact & Dealer Enquiry', to: '/contact' },
  { label: 'All Collections', to: '/collections' },
]

export function Footer() {
  const { categoriesOf, families } = useCatalogue()
  const { openInquiry } = useUI()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-surface-2">
      {/* Trade call-out */}
      <div className="border-b">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 px-5 py-20 lg:flex-row lg:items-end lg:px-10">
          <div className="max-w-[52ch]">
            <p className="eyebrow eyebrow-accent">Trade & Projects</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.1] font-light lg:text-5xl">
              Specifying for a property, a practice or a season.
            </h2>
            <p className="mt-5 text-sm leading-relaxed font-light text-muted">
              Resorts, architects, event firms and restaurants work with us directly.
              Sample kits, fabric swatches and a technical deck are sent on request.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openInquiry()}
            className="btn-luxe btn-solid shrink-0"
          >
            Open an enquiry
            <ArrowIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Directory */}
      <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 text-ink">
              <Monogram className="h-8 w-8 text-accent" />
              <Wordmark className="text-[1rem]" />
            </div>
            <p className="mt-6 max-w-[38ch] text-sm leading-relaxed font-light text-muted">
              A design-led canvas house making tents, expedition equipment, travel goods
              and outdoor living for India and beyond. Cut, stitched and finished with
              people who have done it for a generation.
            </p>

            <div className="mt-8 space-y-1.5">
              <p className="eyebrow">Studio</p>
              <p className="text-sm font-light text-muted">New Delhi · NCR</p>
              <a
                href="mailto:studio@canvasemporium.in"
                className="link-draw block text-sm font-light text-ink"
              >
                studio@canvasemporium.in
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-4">
            {families.slice(0, 3).map((family) => (
              <div key={family.id}>
                <Link
                  to={`/collections/${family.slug}`}
                  className="eyebrow eyebrow-accent link-draw"
                >
                  {family.name}
                </Link>
                <ul className="mt-5 space-y-2.5">
                  {categoriesOf(family.id).map((category) => (
                    <li key={category.id}>
                      <Link
                        to={`/catalogue/${category.slug}`}
                        className="link-draw text-[0.8rem] font-light text-muted transition-colors hover:text-ink"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="eyebrow eyebrow-accent">The House</p>
              <ul className="mt-5 space-y-2.5">
                {families.slice(3).map((family) => (
                  <li key={family.id}>
                    <Link
                      to={`/collections/${family.slug}`}
                      className="link-draw text-[0.8rem] font-light text-muted transition-colors hover:text-ink"
                    >
                      {family.name}
                    </Link>
                  </li>
                ))}
                {HOUSE.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="link-draw text-[0.8rem] font-light text-muted transition-colors hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rule mt-16" />

        <div className="mt-8 flex flex-col justify-between gap-4 text-[0.66rem] tracking-[0.18em] text-muted/70 uppercase sm:flex-row">
          <p>© {year} Canvas Emporium. All rights reserved.</p>
          <p>
            Prices in Indian Rupees, exclusive of GST, freight and installation.
            Indicative until quoted.
          </p>
        </div>
      </div>
    </footer>
  )
}
