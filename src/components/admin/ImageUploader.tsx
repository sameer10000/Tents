import { useRef, useState } from 'react'
import { ApiError, api } from '../../lib/api'
import { CloseIcon, PlusIcon } from '../icons'

interface ImageUploaderProps {
  values: string[]
  onChange: (next: string[]) => void
}

/**
 * Uploads to `/api/uploads` and stores the returned URLs on the product.
 *
 * Order is meaningful: the first image is the primary view, the rest fill the
 * gallery. Anything not supplied falls back to the generated plate.
 */
export function ImageUploader({ values, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setBusy(true)
    setError(null)

    try {
      const form = new FormData()
      for (const file of Array.from(files).slice(0, 8)) form.append('images', file)

      const result = await api.upload<{ urls: string[] }>('/uploads', form)
      onChange([...values, ...result.urls].slice(0, 8))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Upload failed.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= values.length) return
    const next = [...values]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <span className="eyebrow">Photography</span>
      <span className="mt-1.5 block text-[0.68rem] font-light text-muted/70">
        First image is the primary view. Up to eight, 8 MB each — JPEG, PNG, WebP or AVIF.
        Any view without a photograph falls back to the generated plate.
      </span>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {values.map((url, index) => (
          <div key={url} className="group relative aspect-4/5 overflow-hidden border">
            <img src={url} alt="" className="h-full w-full object-cover" />

            <span className="absolute top-1.5 left-1.5 bg-ink-950/70 px-2 py-0.5 text-[0.55rem] tracking-[0.2em] text-ivory-100 uppercase">
              {index === 0 ? 'Primary' : `View ${index + 1}`}
            </span>

            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="absolute top-1.5 right-1.5 bg-ink-950/70 p-1.5 text-ivory-100 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Remove image ${index + 1}`}
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink-950/70 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="px-3 py-1.5 text-[0.6rem] tracking-[0.18em] text-ivory-100 uppercase disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === values.length - 1}
                className="px-3 py-1.5 text-[0.6rem] tracking-[0.18em] text-ivory-100 uppercase disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        ))}

        {values.length < 8 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-4/5 flex-col items-center justify-center gap-2 border border-dashed text-muted transition-colors duration-300 hover:border-accent hover:text-accent disabled:opacity-40"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="text-[0.62rem] tracking-[0.2em] uppercase">
              {busy ? 'Uploading' : 'Add image'}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(event) => void handleFiles(event.target.files)}
        className="hidden"
      />

      {error ? (
        <p role="alert" className="mt-3 text-[0.75rem] font-light text-ink">
          {error}
        </p>
      ) : null}
    </div>
  )
}
