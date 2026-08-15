import { Children, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ChevronIcon } from './icons'

interface PagedCarouselProps {
  children: ReactNode
  /** Items per page. The same count at every breakpoint — only the grid changes. */
  itemsPerPage: number
  /** Grid columns for a single page, e.g. "grid-cols-2 lg:grid-cols-4". */
  gridClassName: string
  /** Announced to screen readers and used on the arrow labels. */
  label: string
  /** Row gap inside a page. */
  gapClassName?: string
}

/**
 * Horizontal pager.
 *
 * Pages sit side by side in a scroll-snapping track, so touch and trackpad
 * swipe natively and the arrows just scroll by one viewport. Only the current
 * page and its immediate neighbours mount — with 175 product cards, each
 * carrying its own SVG plate, rendering every page at once is what made the
 * grid heavy in the first place.
 */
export function PagedCarousel({
  children,
  itemsPerPage,
  gridClassName,
  label,
  gapClassName = 'gap-x-6 gap-y-14',
}: PagedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const reduced = useReducedMotion()

  const items = Children.toArray(children)
  const pageCount = Math.max(1, Math.ceil(items.length / itemsPerPage))

  const pages = Array.from({ length: pageCount }, (_, i) =>
    items.slice(i * itemsPerPage, (i + 1) * itemsPerPage),
  )

  // Derive the current page from scroll position rather than tracking it
  // separately, so a swipe and an arrow click stay in agreement.
  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const next = Math.round(track.scrollLeft / track.clientWidth)
    setPage((current) => (current === next ? current : next))
  }, [])

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current
      if (!track) return
      const clamped = Math.max(0, Math.min(pageCount - 1, index))
      track.scrollTo({
        left: clamped * track.clientWidth,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    [pageCount, reduced],
  )

  // A resize changes page width, which would otherwise leave the track parked
  // between two pages.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const observer = new ResizeObserver(() => {
      track.scrollTo({ left: track.scrollLeft, behavior: 'auto' })
      handleScroll()
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [handleScroll])

  const atStart = page <= 0
  const atEnd = page >= pageCount - 1

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          goTo(page - 1)
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          goTo(page + 1)
        }
      }}
    >
      {/* No horizontal padding on the track: each page is exactly 100% of the
          content box, so `clientWidth` is the page width and arrow scrolling
          lands on a snap point rather than drifting by the padding each time. */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        tabIndex={0}
      >
        {pages.map((pageItems, index) => {
          // Neighbours stay mounted so a swipe never reveals an empty panel.
          const near = Math.abs(index - page) <= 1

          return (
            <div
              key={index}
              className="w-full shrink-0 snap-start"
              aria-hidden={index !== page}
              role="group"
              aria-roledescription="slide"
              aria-label={`${label}, page ${index + 1} of ${pageCount}`}
            >
              {near ? (
                <div className={`grid ${gridClassName} ${gapClassName}`}>{pageItems}</div>
              ) : (
                // Keeps the track's scroll width honest without the cost.
                <div aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>

      {pageCount > 1 ? (
        <div className="mt-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={atStart}
              aria-label={`Previous page of ${label}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border text-ink transition-all duration-400 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronIcon className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={atEnd}
              aria-label={`Next page of ${label}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border text-ink transition-all duration-400 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Progress rule — reads as a page indicator without dots. */}
          <div className="mx-6 hidden h-px flex-1 bg-line sm:block">
            <div
              className="h-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: `scaleX(${(page + 1) / pageCount})`,
                transformOrigin: 'left',
              }}
            />
          </div>

          <p className="eyebrow tabular-nums" aria-live="polite">
            {String(page + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
