import type { Category, CategoryId, Family, FamilyId } from './types'

/**
 * Houses. Each one owns a set of catalogue sections and gets its own index
 * page at /collections/:slug. Order here is the order in the mega menu.
 */
export const families: Family[] = [
  {
    id: 'shelter',
    name: 'Shelter',
    slug: 'tents',
    kicker: 'Tents & Structures',
    blurb:
      'Canvas architecture for the field, the resort and the season-long camp. Cut, welded and finished to stand through weather that most shelter is only photographed in.',
    categories: [
      'glamping-tents',
      'family-tents',
      'expedition-tents',
      'trekking-tents',
      'dome-tents',
      'rooftop-tents',
      'event-structures',
    ],
  },
  {
    id: 'heritage',
    name: 'Heritage',
    slug: 'heritage',
    kicker: 'Historical & Ceremonial',
    blurb:
      'Medieval pavilions and traditional Indian canopies, cut to the historical pattern rather than to an approximation of it. Re-enactment societies, film production, palace hotels and weddings.',
    categories: ['medieval-tents', 'traditional-indian-tents'],
  },
  {
    id: 'utility',
    name: 'Utility',
    slug: 'utility',
    kicker: 'Institutional & Relief',
    blurb:
      'Shelter bought by the hundred rather than the one — defence, disaster relief, exhibitions and schools. Plain, repairable, and specified against a tender.',
    categories: ['military-tents', 'relief-tents', 'exhibition-tents', 'play-tents'],
  },
  {
    id: 'travel',
    name: 'Travel',
    slug: 'bags',
    kicker: 'Bags & Carry',
    blurb:
      'Cotton duck and coated technical cloth, cut into carry that ages rather than wears out. Built around brass, bar-tack and the assumption of a long life.',
    categories: [
      'duffel-bags',
      'waterproof-travel',
      'hiking-backpacks',
      'tactical-backpacks',
      'everyday-canvas',
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep',
    slug: 'sleeping',
    kicker: 'Sleep Systems',
    blurb:
      'Down, synthetic fill and heavy bedroll canvas. Warmth measured honestly, in the conditions it is sold for.',
    categories: ['sleeping-bags'],
  },
  {
    id: 'field',
    name: 'Field',
    slug: 'field',
    kicker: 'Camp Furniture & Light',
    blurb:
      'The objects that turn a pitched tent into a room — seating, surfaces, light, and the organisation that keeps a camp civilised.',
    categories: [
      'foldable-chairs',
      'camping-tables',
      'lanterns-accessories',
      'camping-organizers',
    ],
  },
  {
    id: 'living',
    name: 'Living',
    slug: 'outdoor-living',
    kicker: 'Outdoor Living',
    blurb:
      'Cushions, covers, shade and soft furnishing for terraces, courtyards and poolsides that see real sun and real monsoon.',
    categories: ['outdoor-living', 'parasols'],
  },
  {
    id: 'materials',
    name: 'Materials',
    slug: 'materials',
    kicker: 'Cloth by the Metre',
    blurb:
      'The bolts everything else is cut from — tent canvas, camouflage print, tarpaulin and artist grounds, sold by the metre and by the roll to trades who cut their own.',
    categories: ['tent-fabrics', 'camouflage-fabrics', 'tarpaulins', 'artist-canvas'],
  },
  {
    id: 'home',
    name: 'Home',
    slug: 'home',
    kicker: 'Canvas at Home',
    blurb:
      'Storage and utility in the same cloth as the tents. Quiet, structural, and made to sit in a room for a decade.',
    categories: ['canvas-home'],
  },
  {
    id: 'companion',
    name: 'Companion',
    slug: 'companion',
    kicker: 'For the Dog',
    blurb:
      'Beds, mats and carriers in offcut-grade canvas — the same cloth, the same stitch, a shorter journey.',
    categories: ['companion'],
  },
  {
    id: 'atelier',
    name: 'Atelier',
    slug: 'atelier',
    kicker: 'Bespoke & Projects',
    blurb:
      'Drawn to your dimensions. Resort packages, restaurant canopies and architect-specified structures, quoted from a technical drawing.',
    categories: ['bespoke'],
  },
]

/** Catalogue sections. Every product carries exactly one `category`. */
export const categories: Category[] = [
  {
    id: 'glamping-tents',
    name: 'Luxury Glamping Tents',
    family: 'shelter',
    slug: 'glamping-tents',
    blurb:
      'Bell tents, safari suites and yurts specified for hospitality — the structures that let a property sell a room without building one.',
    plate: 'bell',
  },
  {
    id: 'family-tents',
    name: 'Family Tents',
    family: 'shelter',
    slug: 'family-tents',
    blurb:
      'Standing-height cabins and pavilions for four to ten. Room dividers, generous vestibules, and a pitch two people can manage.',
    plate: 'cabin',
  },
  {
    id: 'expedition-tents',
    name: 'Expedition Tents',
    family: 'shelter',
    slug: 'expedition-tents',
    blurb:
      'Four-season geometry for altitude and wind. Sleeved poles, storm valances, and fabric rated well past the forecast.',
    plate: 'tunnel',
  },
  {
    id: 'trekking-tents',
    name: 'Trekking Tents',
    family: 'shelter',
    slug: 'trekking-tents',
    blurb:
      'Light enough to be carried all day, honest enough to be slept in all night. Weight measured with every peg in the bag.',
    plate: 'ridge',
  },
  {
    id: 'dome-tents',
    name: 'Dome Tents',
    family: 'shelter',
    slug: 'dome-tents',
    blurb:
      'Free-standing domes and geodesics. Pitched in minutes, moved in one piece, stable on ground that refuses a peg.',
    plate: 'dome',
  },
  {
    id: 'rooftop-tents',
    name: 'Rooftop Tents',
    family: 'shelter',
    slug: 'rooftop-tents',
    blurb:
      'Vehicle-mounted shelter in soft-shell and hardshell. Sleeping platform, ladder and mattress, deployed above the dust line.',
    plate: 'rooftop',
  },
  {
    id: 'event-structures',
    name: 'Event Structures',
    family: 'shelter',
    slug: 'event-structures',
    blurb:
      'Marquees, lounge canopies, cabanas and pavilions for weddings, restaurants and season-long installations.',
    plate: 'marquee',
  },

  {
    id: 'medieval-tents',
    name: 'Medieval Tents',
    family: 'heritage',
    slug: 'medieval-tents',
    blurb:
      'Round, square, oval, wedge and the great named pavilions — Viking, Anglo-Saxon, Tudor, Regent, Imperial. Cut to period geometry in natural cotton canvas.',
    plate: 'pavilion',
  },
  {
    id: 'traditional-indian-tents',
    name: 'Traditional Indian Tents',
    family: 'heritage',
    slug: 'traditional-indian-tents',
    blurb:
      'Shamiana, darbar and Mughal pavilion work — scalloped valances, block print, appliqué and hand-painted interiors, made the way the craft still runs in Rajasthan.',
    plate: 'shamiana',
  },
  {
    id: 'military-tents',
    name: 'Army & Military Tents',
    family: 'utility',
    slug: 'military-tents',
    blurb:
      'Ridge tents, frame tents, command posts and storage shelter in camouflage or plain olive. Built to a tender specification and to survive being pitched by people in a hurry.',
    plate: 'military',
  },
  {
    id: 'relief-tents',
    name: 'Emergency Relief Tents',
    family: 'utility',
    slug: 'relief-tents',
    blurb:
      'Family shelter, medical posts and winterised units for disaster response. Flat-packed, fast to pitch, and repairable in the field with what is in the bag.',
    plate: 'relief',
  },
  {
    id: 'exhibition-tents',
    name: 'Exhibition Tents',
    family: 'utility',
    slug: 'exhibition-tents',
    blurb:
      'Pagoda peaks and clear-span halls for trade fairs and product launches. Printable roofs, linkable bays, and a frame that goes up overnight.',
    plate: 'pagoda',
  },
  {
    id: 'play-tents',
    name: 'Children Play Tents',
    family: 'utility',
    slug: 'play-tents',
    blurb:
      'Play tipis, small bell tents and den sets in the same cloth as everything else — soft-edged, washable, and made to survive a childhood rather than a season.',
    plate: 'play',
  },

  {
    id: 'tent-fabrics',
    name: 'Canvas & Tent Fabrics',
    family: 'materials',
    slug: 'tent-fabrics',
    blurb:
      'Cotton duck, treated tent canvas, ripstop poly-cotton and marine acrylic, sold by the metre with the full technical data sheet.',
    plate: 'roll',
  },
  {
    id: 'camouflage-fabrics',
    name: 'Camouflage Print Fabrics',
    family: 'materials',
    slug: 'camouflage-fabrics',
    blurb:
      'Woodland, desert and digital patterns printed on canvas and ripstop, colour-fast and IR-considered where the specification calls for it.',
    plate: 'swatch',
  },
  {
    id: 'tarpaulins',
    name: 'Tarpaulins',
    family: 'materials',
    slug: 'tarpaulins',
    blurb:
      'Cotton, PVC and fire-retardant tarpaulins cut to size with welded seams and brass eyelets. Truck covers, ground sheets and general cover.',
    plate: 'tarp',
  },
  {
    id: 'artist-canvas',
    name: 'Painting & Artist Canvas',
    family: 'materials',
    slug: 'artist-canvas',
    blurb:
      'Primed and unprimed cotton and linen grounds by the roll, and stretched frames. The same cloth as the tents, prepared for a different kind of work.',
    plate: 'easel',
  },
  {
    id: 'parasols',
    name: 'Umbrellas & Parasols',
    family: 'living',
    slug: 'parasols',
    blurb:
      'Market, cantilever and café parasols in solution-dyed acrylic on hardwood and alloy, with bases heavy enough to mean it.',
    plate: 'parasol',
  },

  {
    id: 'duffel-bags',
    name: 'Duffel Bags',
    family: 'travel',
    slug: 'duffel-bags',
    blurb:
      'Weekenders through ninety-litre cargo. Full-length zips, leather-reinforced ends, and webbing that carries loaded.',
    plate: 'duffel',
  },
  {
    id: 'waterproof-travel',
    name: 'Waterproof Travel',
    family: 'travel',
    slug: 'waterproof-travel',
    blurb:
      'Roll-top and welded-seam carry for boats, bikes and monsoon. Sealed rather than merely treated.',
    plate: 'drybag',
  },
  {
    id: 'hiking-backpacks',
    name: 'Hiking Backpacks',
    family: 'travel',
    slug: 'hiking-backpacks',
    blurb:
      'Thirty-five to seventy-five litres, on an adjustable harness. Load transferred to the hip, not the shoulder.',
    plate: 'backpack',
  },
  {
    id: 'tactical-backpacks',
    name: 'Tactical Backpacks',
    family: 'travel',
    slug: 'tactical-backpacks',
    blurb:
      'Modular webbing, reinforced grab handles and hardware chosen for abuse. Restrained finish, serious build.',
    plate: 'tactical',
  },
  {
    id: 'everyday-canvas',
    name: 'Everyday Canvas',
    family: 'travel',
    slug: 'everyday-canvas',
    blurb:
      'Totes, laptop carry, gym and toiletry. The pieces that put heavy cotton duck into an ordinary Tuesday.',
    plate: 'tote',
  },

  {
    id: 'sleeping-bags',
    name: 'Sleeping Bags',
    family: 'sleep',
    slug: 'sleeping-bags',
    blurb:
      'Responsibly sourced down and high-loft synthetic, from ten degrees down to minus fifteen. Bedrolls for the canvas camp.',
    plate: 'sleeping-bag',
  },

  {
    id: 'foldable-chairs',
    name: 'Foldable Chairs',
    family: 'field',
    slug: 'foldable-chairs',
    blurb:
      'Seasoned hardwood frames and heavy canvas slings. Folded flat, they read as furniture rather than equipment.',
    plate: 'chair',
  },
  {
    id: 'camping-tables',
    name: 'Camping Tables',
    family: 'field',
    slug: 'camping-tables',
    blurb:
      'Roll-top and folding surfaces in hardwood and anodised alloy. Level on ground that isn’t.',
    plate: 'table',
  },
  {
    id: 'lanterns-accessories',
    name: 'Lanterns & Accessories',
    family: 'field',
    slug: 'lanterns-accessories',
    blurb:
      'Brass light, enamel service and cast iron fire. The small objects that set the tone of an evening.',
    plate: 'lantern',
  },
  {
    id: 'camping-organizers',
    name: 'Camping Organizers',
    family: 'field',
    slug: 'camping-organizers',
    blurb:
      'Groundsheets, pole and peg bags, tool rolls and gear cases. Everything that makes a pitch repeatable.',
    plate: 'pouch',
  },

  {
    id: 'outdoor-living',
    name: 'Outdoor Living',
    family: 'living',
    slug: 'outdoor-living',
    blurb:
      'Cushions, furniture covers, shade sails, hammocks and pergola canvas in solution-dyed, UV-stable cloth.',
    plate: 'cushion',
  },

  {
    id: 'canvas-home',
    name: 'Canvas Home',
    family: 'home',
    slug: 'canvas-home',
    blurb:
      'Hampers, baskets, organisers and aprons. Structural storage that holds its shape empty.',
    plate: 'basket',
  },

  {
    id: 'companion',
    name: 'Companion',
    family: 'companion',
    slug: 'companion',
    blurb:
      'Beds, travel mats, carriers and toy baskets, cut from the same bolt as everything else.',
    plate: 'pet-bed',
  },

  {
    id: 'bespoke',
    name: 'Bespoke & Projects',
    family: 'atelier',
    slug: 'bespoke',
    blurb:
      'Resort packages, restaurant canopies, architect commissions and corporate gifting, quoted per drawing.',
    plate: 'project',
  },
]

export const familyById = new Map<FamilyId, Family>(families.map((f) => [f.id, f]))
export const familyBySlug = new Map<string, Family>(families.map((f) => [f.slug, f]))
export const categoryById = new Map<CategoryId, Category>(
  categories.map((c) => [c.id, c]),
)

export function categoriesOf(familyId: FamilyId): Category[] {
  const family = familyById.get(familyId)
  if (!family) return []
  return family.categories
    .map((id) => categoryById.get(id))
    .filter((c): c is Category => Boolean(c))
}
