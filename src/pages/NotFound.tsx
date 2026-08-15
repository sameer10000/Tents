import { Link } from 'react-router-dom'
import { Reveal } from '../components/motion/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { HeroScene } from '../components/HeroScene'
import { ArrowIcon } from '../components/icons'

export function NotFound() {
  return (
    <section className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-ink-950">
      <div className="absolute inset-0 opacity-55">
        <HeroScene className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/70" />
      <div className="grain-layer" />

      <div className="relative mx-auto w-full max-w-[1500px] px-5 lg:px-10">
        <Reveal from="none">
          <p className="eyebrow text-brass-300">404</p>
        </Reveal>
        <SplitHeading
          text="Nothing pitched here."
          as="h1"
          immediate
          delay={0.15}
          className="mt-6 max-w-[16ch] font-display text-[clamp(2.6rem,7vw,6rem)] leading-[0.98] font-light text-ivory-100"
        />
        <Reveal delay={0.35}>
          <p className="mt-8 max-w-[46ch] text-sm leading-relaxed font-light text-ivory-200/65">
            The page you were looking for has moved, or was never here. The catalogue is
            where everything lives.
          </p>
        </Reveal>
        <Reveal delay={0.45}>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/collections"
              className="btn-luxe border-ivory-100/30 text-ivory-100 hover:border-ivory-100"
            >
              The catalogue
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="text-[0.68rem] tracking-[0.26em] text-ivory-200/70 uppercase transition-colors duration-500 hover:text-brass-300"
            >
              Return home
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
