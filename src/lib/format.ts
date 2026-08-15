/** Indian-grouped currency, no decimals. ₹1,29,000 rather than ₹129,000. */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatPrice(value: number): string {
  return inr.format(value)
}

/** "₹340 / m" for cloth sold by the metre; plain price for everything else. */
export function formatUnitPrice(value: number, unit?: string): string {
  return unit ? `${inr.format(value)} / ${unit}` : inr.format(value)
}

/** Lakh/crore shorthand for axis labels and filter chips. */
export function formatCompact(value: number): string {
  if (value >= 10000000)
    return `₹${(value / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2).replace(/\.00$/, '')} L`
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`
  return `₹${value}`
}

/** "Price on application" for anything that only ships against a drawing. */
export function priceLabel(price: number, channel: string): string {
  return channel === 'B2B' && price >= 75000
    ? 'From ' + formatPrice(price)
    : formatPrice(price)
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
