/**
 * The catalogue's data contract.
 *
 * Every product in the house — whether it came from the founding business plan
 * or was drawn later for a new category — is described by exactly this shape.
 * Pages, filters, search and the plate renderer all read from it, so adding a
 * product is a data edit and never a code edit.
 */

/** Which route/counter a product is sold through. */
export type Channel = 'D2C' | 'B2B' | 'D2C/B2B' | 'B2B/D2C'

/** Top-level houses. Drives the primary navigation. */
export type FamilyId =
  | 'shelter'
  | 'heritage'
  | 'utility'
  | 'travel'
  | 'sleep'
  | 'living'
  | 'field'
  | 'materials'
  | 'home'
  | 'companion'
  | 'atelier'

/** The catalogue sections a product can belong to. */
export type CategoryId =
  | 'family-tents'
  | 'glamping-tents'
  | 'dome-tents'
  | 'expedition-tents'
  | 'trekking-tents'
  | 'rooftop-tents'
  | 'event-structures'
  | 'medieval-tents'
  | 'traditional-indian-tents'
  | 'military-tents'
  | 'relief-tents'
  | 'exhibition-tents'
  | 'play-tents'
  | 'tarpaulins'
  | 'tent-fabrics'
  | 'camouflage-fabrics'
  | 'artist-canvas'
  | 'parasols'
  | 'duffel-bags'
  | 'waterproof-travel'
  | 'hiking-backpacks'
  | 'tactical-backpacks'
  | 'everyday-canvas'
  | 'camping-organizers'
  | 'sleeping-bags'
  | 'foldable-chairs'
  | 'camping-tables'
  | 'lanterns-accessories'
  | 'outdoor-living'
  | 'canvas-home'
  | 'companion'
  | 'bespoke'

/** Line-art silhouette used by the generated product plate. */
export type PlateId =
  | 'bell'
  | 'safari'
  | 'cabin'
  | 'tipi'
  | 'yurt'
  | 'canopy'
  | 'marquee'
  | 'cabana'
  | 'dome'
  | 'ridge'
  | 'tunnel'
  | 'rooftop'
  | 'pavilion'
  | 'wedge'
  | 'viking'
  | 'shamiana'
  | 'military'
  | 'relief'
  | 'pagoda'
  | 'play'
  | 'tarp'
  | 'roll'
  | 'easel'
  | 'parasol'
  | 'swatch'
  | 'duffel'
  | 'drybag'
  | 'tote'
  | 'backpack'
  | 'tactical'
  | 'pouch'
  | 'sleeping-bag'
  | 'bedroll'
  | 'chair'
  | 'table'
  | 'lantern'
  | 'cushion'
  | 'cover'
  | 'shade'
  | 'hammock'
  | 'basket'
  | 'mat'
  | 'apron'
  | 'pet-bed'
  | 'project'

export interface ColorVariant {
  name: string
  hex: string
}

export interface Product {
  /** Catalogue code. Stable, human-quotable, used as the URL slug. */
  sku: string
  name: string
  family: FamilyId
  category: CategoryId

  /** One line of editorial, shown on the card. */
  tagline: string
  /** Two or three sentences, shown on the product page. */
  description: string

  /** Retail, in whole rupees. */
  price: number
  /**
   * What the price buys, when it is not one item — "m" for cloth sold by the
   * running metre, "set", "pair". Rendered after the price as "₹340 / m".
   */
  unit?: string
  /** Landed cost, in whole rupees. Internal — never rendered publicly. */
  cogs: number
  channel: Channel
  /** Minimum order quantity. */
  moq: number

  /** Sleeping capacity ("4P") or volume ("55 L"). Absent for soft goods. */
  capacity?: string
  weight?: string
  /** Hydrostatic head, or a plain-language rating for non-technical goods. */
  waterproof?: string
  dimensions?: string
  /** Packed size, for anything that travels. */
  packed?: string
  /** Comfort/limit rating for sleep systems. */
  temperature?: string

  materials: string[]
  colors: ColorVariant[]
  /**
   * Uploaded photography, in view order. Supplied by the admin portal; when
   * absent the generated plate is used.
   */
  images?: string[]
  /** Bullet specifications for the product page. */
  details?: string[]

  plate: PlateId
  /** Promoted on the home page. */
  featured?: boolean
  /** Reserved for the hero rotation. */
  hero?: boolean
  /** Badge copy: "New", "Archive", "Made to order". */
  badge?: string
}

export interface Category {
  id: CategoryId
  name: string
  family: FamilyId
  /** Route segment, e.g. /collections/dome-tents */
  slug: CategoryId
  blurb: string
  plate: PlateId
}

export interface Family {
  id: FamilyId
  name: string
  /** Route segment for the family index page. */
  slug: string
  /** Menu subtitle. */
  kicker: string
  blurb: string
  categories: CategoryId[]
}
