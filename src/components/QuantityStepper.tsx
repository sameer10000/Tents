import { MinusIcon, PlusIcon } from './icons'

interface QuantityStepperProps {
  /** How much one press moves the quantity — a catalogue piece's MOQ, or 1. */
  step: number
  /** What is being counted, for the screen-reader labels. */
  label: string
  qty: number
  onChange: (qty: number) => void
  /** Stepping below the floor removes the line rather than clamping. */
  onFloor?: () => void
  size?: 'sm' | 'md'
}

/**
 * Quantities move in MOQ steps.
 *
 * A tote with an MOQ of 25 goes 25 → 50 → 75; there is no such thing as an
 * order of 26, so the control should not offer one. A custom tent steps by one.
 */
export function QuantityStepper({
  step,
  label,
  qty,
  onChange,
  onFloor,
  size = 'md',
}: QuantityStepperProps) {
  const atFloor = qty <= step

  const button =
    size === 'sm'
      ? 'flex h-8 w-8 items-center justify-center'
      : 'flex h-11 w-11 items-center justify-center'
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  return (
    <div className="inline-flex items-center border border-line">
      <button
        type="button"
        onClick={() => (atFloor ? onFloor?.() : onChange(qty - step))}
        disabled={atFloor && !onFloor}
        className={`${button} text-muted transition-colors duration-300 hover:text-ink disabled:opacity-30 disabled:hover:text-muted`}
        aria-label={atFloor ? `Remove ${label}` : `Decrease by ${step}`}
      >
        <MinusIcon className={icon} />
      </button>

      <span
        className={`min-w-10 text-center tabular-nums ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        } font-light text-ink`}
        aria-live="polite"
      >
        {qty}
      </span>

      <button
        type="button"
        onClick={() => onChange(qty + step)}
        className={`${button} text-muted transition-colors duration-300 hover:text-ink`}
        aria-label={`Increase by ${step}`}
      >
        <PlusIcon className={icon} />
      </button>
    </div>
  )
}
