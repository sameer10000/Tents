import type { ColorVariant } from './types'

/**
 * The house colourway. Every product draws its variants from here so the
 * swatch row reads as one palette across the whole catalogue.
 */
export const C = {
  natural: { name: 'Natural Canvas', hex: '#D9CDB4' },
  ecru: { name: 'Ecru', hex: '#E5DCC8' },
  bone: { name: 'Bone', hex: '#EFE9DC' },
  sand: { name: 'Desert Sand', hex: '#C8B48E' },
  khaki: { name: 'Khaki', hex: '#B3A47C' },
  olive: { name: 'Olive Drab', hex: '#6B7150' },
  moss: { name: 'Moss', hex: '#5A6B45' },
  forest: { name: 'Deep Forest', hex: '#2C3A26' },
  slate: { name: 'Slate Blue', hex: '#4A5A66' },
  stone: { name: 'Stone Grey', hex: '#9A9A93' },
  charcoal: { name: 'Charcoal', hex: '#2B2C2E' },
  ink: { name: 'Ink Black', hex: '#17181A' },
  rust: { name: 'Oxide Rust', hex: '#8C4B32' },
  clay: { name: 'Terracotta', hex: '#A9634A' },
  brass: { name: 'Antique Brass', hex: '#B08D4F' },
} satisfies Record<string, ColorVariant>

/**
 * The dyed cloth the medieval pavilions are cut from.
 *
 * These are the eight the mill actually runs for historic tentage — saturated
 * in a way the catalogue's natural range is not, and the reason a striped
 * pavilion reads as a pavilion. Sampled from the house colour sheet, so the
 * values are what the cloth is, not what the names suggest.
 */
export const MEDIEVAL = {
  black: { name: 'Black', hex: '#272728' },
  brown: { name: 'Brown', hex: '#3F2E27' },
  seaGreen: { name: 'Sea Green', hex: '#13654F' },
  forestGreen: { name: 'Forest Green', hex: '#1E4137' },
  goldenYellow: { name: 'Golden Yellow', hex: '#F0C00A' },
  red: { name: 'Red', hex: '#A51425' },
  royalBlue: { name: 'Royal Blue', hex: '#093998' },
  navyBlue: { name: 'Navy Blue', hex: '#282C39' },
} satisfies Record<string, ColorVariant>
