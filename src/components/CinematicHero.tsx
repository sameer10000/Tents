import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useUI } from '../context/ui'
import { HeroScene } from './HeroScene'
import { ArrowIcon } from './icons'
import { SplitHeading } from './motion/SplitHeading'

const MARQUEE = [
  'Bell Tents',
  'Safari Suites',
  'Expedition Shelter',
  'Waxed Canvas Carry',
  'Down Sleep Systems',
  'Camp Furniture',
  'Bespoke Projects',
]

/**
 * Full-viewport opening frame.
 *
 * The drawn scene is the baseline. If a file exists at `/media/hero.mp4` it
 * fades in over the top — so the page is cinematic on first load with no
 * assets, and more cinematic once footage is supplied.
 */
export function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { openInquiry } = useUI()
  // `absent` is the normal case: no footage has been supplied. The element is
  // unmounted on the first error so the browser stops retrying the request.
  const [video, setVideo] = useState<'idle' | 'ready' | 'absent'>('idle')

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const backdropY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '46%'])
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return (
    <section
      ref={ref}
      className="grain relative flex h-[100svh] min-h-[640px] items-end overflow-hidden bg-ink-950"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { y: backdropY }}
      >
        <div className={`absolute inset-0 ${reduced ? '' : 'animate-drift'}`}>
          <HeroScene className="h-full w-full" />
        </div>

        {video === 'absent' ? null : (
          <video
            src="/media/hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideo('ready')}
            onError={() => setVideo('absent')}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2s] ${
              video === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </motion.div>

      {/* Legibility scrims */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-ink-950/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/70 via-transparent to-transparent" />
      <div className="grain-layer" />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full"
        style={reduced ? undefined : { y: contentY, opacity: fade }}
      >
        <div className="mx-auto max-w-[1500px] px-5 pb-16 lg:px-10 lg:pb-24">
          <motion.p
            className="eyebrow text-brass-300"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Est. India · Canvas, Shelter & Expedition Goods
          </motion.p>

          <SplitHeading
            text="Shelter, drawn"
            as="h1"
            immediate
            delay={0.28}
            className="mt-7 font-display text-[clamp(3.2rem,10vw,9rem)] leading-[0.92] font-light text-ivory-100"
          />
          <SplitHeading
            text="before it is sewn."
            as="p"
            immediate
            delay={0.42}
            className="font-display text-[clamp(3.2rem,10vw,9rem)] leading-[0.92] font-light text-ivory-100/45 italic"
          />

          <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <motion.p
              className="max-w-[46ch] text-sm leading-relaxed font-light text-ivory-200/70 lg:text-base"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              One hundred and twenty-two pieces across eight houses — from a four-metre
              bell tent to a brass camp lantern. Made in India, specified by resorts,
              architects and people who sleep outside on purpose.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to="/collections"
                className="btn-luxe border-ivory-100/30 text-ivory-100 hover:border-ivory-100"
              >
                The Catalogue
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => openInquiry()}
                className="text-[0.68rem] tracking-[0.26em] text-ivory-200/70 uppercase transition-colors duration-500 hover:text-brass-300"
              >
                Trade enquiry
              </button>
            </motion.div>
          </div>
        </div>

        {/* Ticker */}
        <div className="relative overflow-hidden border-t border-ivory-100/10 py-4">
          <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-14">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex items-center gap-14 text-[0.6rem] tracking-[0.34em] whitespace-nowrap text-ivory-200/45 uppercase"
              >
                {item}
                <span className="h-1 w-1 rounded-full bg-brass-400/50" />
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute right-5 bottom-24 z-10 hidden lg:right-10 lg:block"
        style={reduced ? undefined : { opacity: fade }}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-[0.58rem] tracking-[0.3em] text-ivory-200/45 uppercase [writing-mode:vertical-rl]">
            Scroll
          </span>
          <div className="h-16 w-px overflow-hidden bg-ivory-100/15">
            <motion.div
              className="h-1/2 w-full bg-brass-400"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
