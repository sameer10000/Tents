import type { ReactNode } from 'react'
import { CloseIcon, PlusIcon } from '../icons'

export const inputClass =
  'w-full border border-line bg-transparent px-3.5 py-2.5 text-sm font-light text-ink placeholder:text-muted/45 transition-colors duration-300 focus:border-accent focus:outline-none'

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? (
        <span className="mt-1.5 block text-[0.68rem] font-light text-muted/70">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function Fieldset({
  legend,
  description,
  children,
}: {
  legend: string
  description?: string
  children: ReactNode
}) {
  return (
    <fieldset className="border-t pt-8">
      <legend className="sr-only">{legend}</legend>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-light">{legend}</h2>
        {description ? (
          <p className="mt-1.5 max-w-[60ch] text-[0.78rem] font-light text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </fieldset>
  )
}

/** Editor for a list of plain strings — materials, detail bullets. */
export function ListField({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string
  hint?: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  function update(index: number, value: string) {
    onChange(values.map((entry, i) => (i === index ? value : entry)))
  }

  return (
    <div>
      <span className="eyebrow">{label}</span>
      {hint ? (
        <span className="mt-1.5 block text-[0.68rem] font-light text-muted/70">
          {hint}
        </span>
      ) : null}

      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-[0.68rem] tabular-nums text-muted/50">
              {String(index + 1).padStart(2, '0')}
            </span>
            <input
              value={value}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-muted/60 transition-colors hover:text-ink"
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="mt-3 inline-flex items-center gap-2 text-[0.66rem] tracking-[0.2em] text-accent uppercase"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add {label.toLowerCase()}
      </button>
    </div>
  )
}

export interface ColourValue {
  name: string
  hex: string
}

/** Colourway editor — a swatch picker beside a free-text name. */
export function ColourField({
  values,
  onChange,
}: {
  values: ColourValue[]
  onChange: (next: ColourValue[]) => void
}) {
  function update(index: number, patch: Partial<ColourValue>) {
    onChange(values.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  return (
    <div>
      <span className="eyebrow">Colourway</span>
      <span className="mt-1.5 block text-[0.68rem] font-light text-muted/70">
        Shown as swatches on the card and the product page.
      </span>

      <div className="mt-3 space-y-2">
        {values.map((colour, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(colour.hex) ? colour.hex : '#6b7150'}
              onChange={(event) => update(index, { hex: event.target.value })}
              className="h-10 w-12 shrink-0 cursor-pointer border border-line bg-transparent p-1"
              aria-label={`Colour ${index + 1} swatch`}
            />
            <input
              value={colour.name}
              onChange={(event) => update(index, { name: event.target.value })}
              placeholder="Olive Drab"
              className={inputClass}
            />
            <input
              value={colour.hex}
              onChange={(event) => update(index, { hex: event.target.value })}
              placeholder="#6B7150"
              className={`${inputClass} w-32 shrink-0 font-mono text-xs`}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-muted/60 transition-colors hover:text-ink"
              aria-label={`Remove colour ${index + 1}`}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...values, { name: '', hex: '#6b7150' }])}
        className="mt-3 inline-flex items-center gap-2 text-[0.66rem] tracking-[0.2em] text-accent uppercase"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add colour
      </button>
    </div>
  )
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex w-full items-center justify-between gap-4 border p-4 text-left transition-colors duration-300 ${
        checked ? 'border-accent bg-accent/5' : 'hover:border-line-strong'
      }`}
    >
      <span>
        <span className="block text-sm font-light text-ink">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[0.68rem] font-light text-muted">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? 'bg-accent' : 'bg-line-strong'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all duration-300 ${
            checked ? 'left-[1.125rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function Banner({
  tone,
  children,
}: {
  tone: 'error' | 'success'
  children: ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`border-l-2 py-3 pl-4 text-[0.8rem] font-light ${
        tone === 'error' ? 'border-rust-500 text-ink' : 'border-accent text-ink'
      }`}
      style={tone === 'error' ? { borderColor: '#8C4B32' } : undefined}
    >
      {children}
    </p>
  )
}
