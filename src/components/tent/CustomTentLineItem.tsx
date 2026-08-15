import { Link } from 'react-router-dom'
import { familyDef, summariseSpec } from '../../data/tent-config'
import type { CustomTentLine } from '../../lib/order'
import { ProductPlate } from '../ProductPlate'
import { QuantityStepper } from '../QuantityStepper'
import { CloseIcon } from '../icons'

interface CustomTentLineItemProps {
  line: CustomTentLine
  onQuantity: (qty: number) => void
  onRemove: () => void
  /** The drawer needs the tighter version; the bag page uses the fuller one. */
  compact?: boolean
  /** Closes whatever surface the item is sitting in, on navigation. */
  onNavigate?: () => void
}

/**
 * A commissioned tent, in the bag.
 *
 * It never shows a figure. A custom structure is quoted against its drawing,
 * so anything that looked like a price here would be a fiction — the line
 * carries its specification instead, which is the thing being priced.
 */
export function CustomTentLineItem({
  line,
  onQuantity,
  onRemove,
  compact = false,
  onNavigate,
}: CustomTentLineItemProps) {
  const def = familyDef(line.family)

  // The first few rows of the specification stand in for the whole thing.
  const highlights = summariseSpec(line.spec)
    .flatMap((section) => section.rows)
    .slice(0, compact ? 3 : 6)

  return (
    <div className={`flex gap-4 ${compact ? '' : 'gap-6'}`}>
      <Link
        to={`/create-tent/${line.id}`}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden ${compact ? 'h-24 w-20' : 'h-40 w-32'}`}
      >
        <ProductPlate plate={def.plate} seed={line.id} />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/create-tent/${line.id}`}
          onClick={onNavigate}
          className={`link-draw font-display leading-snug font-light ${
            compact ? 'text-lg' : 'text-2xl'
          }`}
        >
          {line.headline}
        </Link>

        <p className="eyebrow eyebrow-accent mt-1.5">Commission · {line.id}</p>

        <dl
          className={`mt-3 grid gap-x-6 gap-y-1 text-[0.72rem] font-light text-muted ${
            compact ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {highlights.map((row) => (
            <div key={row.label} className="flex justify-between gap-3">
              <dt className="truncate">{row.label}</dt>
              <dd className="shrink-0 text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            step={1}
            label={line.headline}
            qty={line.qty}
            size={compact ? 'sm' : 'md'}
            onChange={onQuantity}
            onFloor={onRemove}
          />
          <span className="text-[0.66rem] tracking-[0.14em] text-accent uppercase">
            Price on request
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="-mt-1 -mr-1 h-fit p-1.5 text-muted/60 transition-colors hover:text-ink"
        aria-label={`Remove ${line.headline}`}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
