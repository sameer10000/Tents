interface BrandMarkProps {
  className?: string
}

/**
 * The monogram: a pitched ridge over a taut base line, inside a diamond.
 * Reads as a tent at 20 px and as an abstract mark at 200 px.
 */
export function Monogram({ className = '' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 3 L37 20 L20 37 L3 20 Z" opacity="0.45" />
      <path d="M20 11 L29 27 L11 27 Z" />
      <path d="M20 11 L20 27" opacity="0.45" />
    </svg>
  )
}

/** The full lock-up. Letter-spacing is doing most of the work here. */
export function Wordmark({ className = '' }: BrandMarkProps) {
  return (
    <span className={`flex items-baseline gap-[0.42em] leading-none ${className}`}>
      <span className="font-display text-[1.32em] font-light tracking-[0.2em]">
        CANVAS
      </span>
      <span className="font-sans text-[0.58em] font-light tracking-[0.46em] text-muted">
        EMPORIUM
      </span>
    </span>
  )
}
