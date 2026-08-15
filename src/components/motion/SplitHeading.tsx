import { motion, useReducedMotion } from 'framer-motion'

interface SplitHeadingProps {
  text: string
  /**
   * Text tags only. Left as the wide `ElementType` this would union with every
   * three.js element the configurator registers, and the children type would
   * collapse to `never`.
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  className?: string
  delay?: number
  stagger?: number
  /** Animate on mount instead of on scroll — for above-the-fold headings. */
  immediate?: boolean
}

/**
 * Word-by-word rise from behind a clipping mask. The mask is what makes it
 * read as typesetting rather than as a fade.
 */
export function SplitHeading({
  text,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.055,
  immediate = false,
}: SplitHeadingProps) {
  const reduced = useReducedMotion()
  const words = text.split(' ')

  if (reduced) {
    return <Tag className={className}>{text}</Tag>
  }

  const animation = immediate
    ? { animate: 'visible' as const }
    : {
        whileInView: 'visible' as const,
        viewport: { once: true, margin: '-10% 0px -10% 0px' },
      }

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        {...animation}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            // Padding gives descenders room; the negative margin takes it back
            // so the mask does not open up gaps in the line.
            className="inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]"
          >
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: '108%' },
                visible: { y: '0%' },
              }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
