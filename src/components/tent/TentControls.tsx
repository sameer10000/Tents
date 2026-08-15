import type {
  ColorPart,
  LengthUnit,
  SpecValue,
  TentField,
  TentSpec,
} from '../../data/tent-config'
import type { ColorVariant } from '../../data/types'
import { scallopPath } from '../../data/scallops'
import {
  asRecord,
  familyDef,
  formatLength,
  isVisible,
  swatchName,
} from '../../data/tent-config'
import { MinusIcon, PlusIcon } from '../icons'

/** The cut edge, drawn from the same profile the cloth is cut to. */
function ScallopPreview({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 96 30"
      className="h-6 w-24 shrink-0"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={`${scallopPath(id, 96, 22, 3)} L 96 0 L 0 0 Z`} className="fill-ink/12" />
      <path
        d={scallopPath(id, 96, 22, 3)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-accent"
      />
    </svg>
  )
}

interface TentControlsProps {
  spec: TentSpec
  unit: LengthUnit
  onChange: (key: string, value: SpecValue) => void
  onColor: (part: ColorPart, hex: string) => void
}

/**
 * Every control on the page, rendered from `tent-config.ts`.
 *
 * Nothing here knows what a bell tent is. Adding a parameter, changing a range
 * or retiring an option is a data edit in that file; this component only knows
 * how to draw the five kinds of control.
 */
export function TentControls({ spec, unit, onChange, onColor }: TentControlsProps) {
  const def = familyDef(spec.family)
  const values = asRecord(spec)

  return (
    <div className="divide-y divide-line">
      {def.sections.map((section) => {
        const fields = section.fields.filter((field) => isVisible(field, spec))
        if (!fields.length) return null

        return (
          <section key={section.title} className="py-8 first:pt-0">
            <p className="eyebrow eyebrow-accent">{section.title}</p>
            <div className="mt-6 space-y-7">
              {fields.map((field) => (
                <Field
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  unit={unit}
                  onChange={(value) => onChange(field.key, value)}
                />
              ))}

            </div>
          </section>
        )
      })}

      <section className="py-8">
        <p className="eyebrow eyebrow-accent">Colourway</p>
        <div className="mt-6 space-y-7">
          {def.colorParts.map((part) => (
            <div key={part.key}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[0.82rem] font-light text-ink">{part.label}</span>
                <span className="text-[0.68rem] font-light text-muted">
                  {swatchName(spec.colors[part.key] ?? '')}
                </span>
              </div>
              {part.hint ? (
                <p className="mt-1 text-[0.68rem] font-light text-muted/70">{part.hint}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {def.swatches.map((swatch: ColorVariant) => {
                  const active =
                    (spec.colors[part.key] ?? '').toLowerCase() === swatch.hex.toLowerCase()
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.name}
                      aria-label={`${part.label}: ${swatch.name}`}
                      aria-pressed={active}
                      onClick={() => onColor(part.key, swatch.hex)}
                      style={{ backgroundColor: swatch.hex }}
                      className={`h-7 w-7 border transition-transform duration-300 ${
                        active
                          ? 'scale-110 border-accent ring-1 ring-accent'
                          : 'border-line hover:scale-110'
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ── One control ────────────────────────────────────────────────────────── */

function Field({
  field,
  value,
  unit,
  onChange,
}: {
  field: TentField
  value: SpecValue
  unit: LengthUnit
  onChange: (value: SpecValue) => void
}) {
  switch (field.kind) {
    case 'range':
      return (
        <label className="block">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-[0.82rem] font-light text-ink">{field.label}</span>
            <span className="text-[0.82rem] font-light tabular-nums text-accent">
              {field.unit === 'm'
                ? formatLength(Number(value), unit)
                : `${Number(value)}${field.unit}`}
            </span>
          </span>
          {field.hint ? (
            <span className="mt-1 block text-[0.68rem] font-light text-muted/70">
              {field.hint}
            </span>
          ) : null}
          {/* The slider always works in metres; only its readout converts. */}
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={Number(value)}
            onChange={(event) => onChange(Number(event.target.value))}
            className="accent-accent mt-3 w-full"
          />
        </label>
      )

    case 'stepper':
      return (
        <div className="flex items-center justify-between gap-4">
          <span className="text-[0.82rem] font-light text-ink">{field.label}</span>
          <div className="inline-flex items-center border border-line">
            <button
              type="button"
              onClick={() => onChange(Math.max(field.min, Number(value) - 1))}
              disabled={Number(value) <= field.min}
              aria-label={`Fewer ${field.label.toLowerCase()}`}
              className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              <MinusIcon className="h-3 w-3" />
            </button>
            <span className="min-w-8 text-center text-xs font-light tabular-nums text-ink">
              {Number(value)}
            </span>
            <button
              type="button"
              onClick={() => onChange(Math.min(field.max, Number(value) + 1))}
              disabled={Number(value) >= field.max}
              aria-label={`More ${field.label.toLowerCase()}`}
              className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      )

    case 'toggle':
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          aria-pressed={Boolean(value)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="block text-[0.82rem] font-light text-ink">{field.label}</span>
            {field.hint ? (
              <span className="mt-0.5 block text-[0.68rem] font-light text-muted/70">
                {field.hint}
              </span>
            ) : null}
          </span>
          <span
            className={`relative h-5 w-9 shrink-0 border transition-colors duration-400 ${
              value ? 'border-accent bg-accent/20' : 'border-line'
            }`}
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 transition-all duration-400 ${
                value ? 'left-[1.15rem] bg-accent' : 'left-0.5 bg-muted/50'
              }`}
            />
          </span>
        </button>
      )

    case 'chips': {
      const selected = Array.isArray(value) ? value : []
      return (
        <div>
          <span className="text-[0.82rem] font-light text-ink">{field.label}</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {field.options.map((option) => {
              const active = selected.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange(
                      active
                        ? selected.filter((entry) => entry !== option.value)
                        : [...selected, option.value],
                    )
                  }
                  className={`border px-3 py-1.5 text-[0.68rem] tracking-[0.12em] uppercase transition-colors duration-400 ${
                    active
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    case 'select': {
      const current = String(value)
      // A number in the spec must stay a number coming back out of the DOM.
      const emit = (next: string) =>
        onChange(typeof value === 'number' ? Number(next) : next)
      const hinted = field.options.some((option) => option.hint)

      if (hinted) {
        return (
          <fieldset>
            <legend className="text-[0.82rem] font-light text-ink">{field.label}</legend>
            <div className="mt-3 space-y-px">
              {field.options.map((option) => {
                const active = current === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => emit(option.value)}
                    className={`flex w-full items-center gap-4 border px-4 py-3 text-left transition-colors duration-400 ${
                      active
                        ? 'border-accent bg-accent/5'
                        : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8rem] font-light text-ink">
                        {option.label}
                      </span>
                      {option.hint ? (
                        <span className="mt-0.5 block text-[0.68rem] font-light text-muted">
                          {option.hint}
                        </span>
                      ) : null}
                    </span>
                    {option.scallop ? <ScallopPreview id={option.scallop} /> : null}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      }

      return (
        <fieldset>
          <legend className="text-[0.82rem] font-light text-ink">{field.label}</legend>
          <div className="mt-3 flex flex-wrap gap-px border border-line">
            {field.options.map((option) => {
              const active = current === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => emit(option.value)}
                  className={`flex-1 px-3 py-2 text-[0.68rem] tracking-[0.1em] whitespace-nowrap uppercase transition-colors duration-400 ${
                    active ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      )
    }
  }
}
