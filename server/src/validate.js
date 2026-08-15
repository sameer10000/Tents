export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const bad = (message) => new HttpError(400, message)

export function str(value, field, { required = false, max = 4000 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw bad(`${field} is required.`)
    return null
  }
  if (typeof value !== 'string') throw bad(`${field} must be text.`)
  const trimmed = value.trim()
  if (required && !trimmed) throw bad(`${field} is required.`)
  if (trimmed.length > max) throw bad(`${field} is too long (max ${max}).`)
  return trimmed
}

export function int(value, field, { min = 0, max = 1_000_000_000, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback
    throw bad(`${field} is required.`)
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw bad(`${field} must be a number.`)
  const rounded = Math.round(parsed)
  if (rounded < min) throw bad(`${field} must be at least ${min}.`)
  if (rounded > max) throw bad(`${field} is too large.`)
  return rounded
}

export function strList(value, field, { max = 40 } = {}) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw bad(`${field} must be a list.`)
  const cleaned = value
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (cleaned.length > max) throw bad(`${field} has too many entries (max ${max}).`)
  return cleaned
}

const HEX = /^#[0-9a-fA-F]{6}$/

export function colourList(value, field) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw bad(`${field} must be a list.`)

  return value.slice(0, 12).map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw bad(`${field}[${index}] must have a name and a hex value.`)
    }
    const name = str(entry.name, `${field}[${index}].name`, { required: true, max: 60 })
    const hex = String(entry.hex ?? '').trim()
    if (!HEX.test(hex)) {
      throw bad(`${field}[${index}].hex must be a six-digit hex colour, e.g. #6B7150.`)
    }
    return { name, hex: hex.toLowerCase() }
  })
}

const CHANNELS = new Set(['D2C', 'B2B', 'D2C/B2B', 'B2B/D2C'])

export function channel(value) {
  const parsed = str(value, 'Channel', { required: true, max: 20 })
  if (!CHANNELS.has(parsed)) {
    throw bad(`Channel must be one of ${[...CHANNELS].join(', ')}.`)
  }
  return parsed
}

/** URL-safe identifier. Used for SKUs, and for family and category ids. */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function skuOf(value) {
  const parsed = str(value, 'SKU', { required: true, max: 16 })
  const cleaned = parsed.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  if (!cleaned) throw bad('SKU must contain letters or numbers.')
  return cleaned
}
