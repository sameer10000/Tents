import { Link } from 'react-router-dom'
import { Reveal } from './motion/Reveal'
import { SplitHeading } from './motion/SplitHeading'

interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  eyebrow: string
  title: string
  /** Italic continuation set on the line beneath the title. */
  subtitle?: string
  blurb?: string
  crumbs?: Crumb[]
  /** Right-hand figure, e.g. the piece count. */
  meta?: string
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  blurb,
  crumbs,
  meta,
}: PageHeaderProps) {
  return (
    <header className="border-b pt-[128px] pb-16 lg:pt-[184px] lg:pb-24">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
        {crumbs && crumbs.length > 0 ? (
          <Reveal from="none" duration={0.8}>
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex flex-wrap items-center gap-2.5"
            >
              {crumbs.map((crumb, index) => (
                <span
                  key={`${crumb.label}-${index}`}
                  className="flex items-center gap-2.5"
                >
                  {crumb.to ? (
                    <Link to={crumb.to} className="eyebrow link-draw hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="eyebrow text-muted/60">{crumb.label}</span>
                  )}
                  {index < crumbs.length - 1 ? (
                    <span className="text-muted/35">/</span>
                  ) : null}
                </span>
              ))}
            </nav>
          </Reveal>
        ) : null}

        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div className="max-w-[22ch]">
            <Reveal from="none" duration={0.7}>
              <p className="eyebrow eyebrow-accent">{eyebrow}</p>
            </Reveal>

            <SplitHeading
              text={title}
              as="h1"
              delay={0.1}
              className="mt-6 font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-light"
            />

            {subtitle ? (
              <SplitHeading
                text={subtitle}
                as="p"
                delay={0.22}
                className="font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-light text-muted/55 italic"
              />
            ) : null}
          </div>

          <div className="flex max-w-[46ch] flex-col gap-6 lg:items-end lg:text-right">
            {blurb ? (
              <Reveal delay={0.2}>
                <p className="text-sm leading-relaxed font-light text-muted lg:text-[0.95rem]">
                  {blurb}
                </p>
              </Reveal>
            ) : null}
            {meta ? (
              <Reveal delay={0.3}>
                <p className="eyebrow tabular-nums">{meta}</p>
              </Reveal>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
