import type { PlateId } from '../data/types'

/**
 * Line art for the generated product plates.
 *
 * Every entry is a list of SVG path strings drawn on a 240 × 180 stage with a
 * notional ground line at y = 148. They are deliberately schematic — the plate
 * is art direction, not a technical drawing, and it reads at 300 px as well as
 * at 1200 px.
 *
 * The first path in each list is drawn in the accent stroke; the rest are the
 * quiet strokes. Order accordingly.
 */
export const PLATE_ART: Record<PlateId, string[]> = {
  bell: [
    'M120 28 L36 146 M120 28 L204 146',
    'M36 146 A84 11 0 0 0 204 146 A84 11 0 0 0 36 146',
    'M104 146 L120 86 L136 146',
    'M120 28 L120 18',
    'M120 28 L58 40 M120 28 L182 40',
  ],
  safari: [
    'M28 74 L120 34 L212 74',
    'M46 74 L46 146 M194 74 L194 146',
    'M30 74 L30 146 M210 74 L210 146',
    'M104 146 L104 100 L136 100 L136 146',
    'M20 148 L220 148',
    'M62 96 L86 96 L86 118 L62 118 Z M154 96 L178 96 L178 118 L154 118 Z',
  ],
  cabin: [
    'M38 78 L120 40 L202 78',
    'M40 78 L40 146 M200 78 L200 146',
    'M106 146 L106 104 L134 104 L134 146',
    'M20 148 L220 148',
    'M58 96 L84 96 L84 118 L58 118 Z M156 96 L182 96 L182 118 L156 118 Z',
  ],
  tipi: [
    'M120 22 L52 148 M120 22 L188 148',
    'M52 148 A68 9 0 0 0 188 148',
    'M108 148 L120 92 L132 148',
    'M110 14 L130 36 M130 14 L110 36',
  ],
  yurt: [
    'M44 88 L120 52 L196 88',
    'M112 52 A8 4 0 1 0 128 52 A8 4 0 1 0 112 52',
    'M44 88 L44 146 M196 88 L196 146',
    'M44 146 A76 10 0 0 0 196 146',
    'M106 146 L106 104 L134 104 L134 146',
    'M44 116 L196 116',
  ],
  canopy: [
    'M30 70 L120 44 L210 70',
    'M46 70 L46 148 M194 70 L194 148',
    'M20 148 L220 148',
    'M30 70 q10 9 20 0 q10 9 20 0 q10 9 20 0 q10 9 20 0 q10 9 20 0 q10 9 20 0 q10 9 20 0 q10 9 20 0 q10 9 20 0',
  ],
  marquee: [
    'M22 78 L120 40 L218 78',
    'M32 78 L32 148 M208 78 L208 148',
    'M120 40 L120 148',
    'M20 148 L220 148',
    'M22 78 L218 78',
  ],
  cabana: [
    'M38 62 L120 40 L202 62',
    'M48 62 L48 150 M192 62 L192 150',
    'M68 66 C 62 100 74 124 68 150 M172 66 C 178 100 166 124 172 150',
    'M20 150 L220 150',
  ],
  dome: [
    'M40 148 A80 78 0 0 1 200 148',
    'M56 148 C 74 58 166 58 184 148',
    'M104 148 A18 24 0 0 1 136 148',
    'M20 148 L220 148',
  ],
  ridge: [
    'M46 148 L110 58 L174 148',
    'M110 58 L178 44 L206 132 L174 148',
    'M96 148 L110 96 L124 148',
    'M20 148 L220 148',
    'M110 58 L52 40 M178 44 L214 30',
  ],
  tunnel: [
    'M44 148 C 44 66 78 56 110 56 L150 56 C 182 56 216 66 216 148',
    'M110 56 C 78 56 44 66 44 148',
    'M150 56 C 182 56 216 66 216 148',
    'M96 148 A26 42 0 0 1 148 148',
    'M20 148 L220 148',
  ],
  rooftop: [
    'M56 100 L56 60 L184 42 L184 100',
    'M28 148 L28 122 L58 102 L182 102 L212 122 L212 148',
    'M62 148 A15 15 0 1 0 92 148 A15 15 0 1 0 62 148 M150 148 A15 15 0 1 0 180 148 A15 15 0 1 0 150 148',
    'M184 76 L212 132 M190 88 L206 84 M196 102 L212 98 M202 116 L218 112',
    'M20 150 L220 150',
  ],
  duffel: [
    'M58 74 L182 74 A22 38 0 0 1 182 150 L58 150 A22 38 0 0 1 58 74 Z',
    'M182 74 A22 38 0 0 0 182 150',
    'M62 92 L178 92',
    'M96 74 C 96 50 144 50 144 74',
    'M58 112 L36 128',
  ],
  drybag: [
    'M62 96 L62 152 L178 152 L178 96',
    'M62 96 L62 78 q58 -16 116 0 L178 96',
    'M64 86 q56 -14 112 0',
    'M108 68 L132 68 L132 78 L108 78 Z',
    'M62 82 L108 70 M178 82 L132 70',
  ],
  tote: [
    'M62 82 L52 152 L188 152 L178 82 Z',
    'M92 82 C 92 48 148 48 148 82',
    'M60 98 L180 98',
    'M20 154 L220 154',
  ],
  backpack: [
    'M74 62 q46 -22 92 0 L176 146 q-56 12 -112 0 Z',
    'M74 62 q46 -22 92 0 L168 94 q-48 14 -96 0 Z',
    'M96 64 C 74 92 74 122 88 148 M144 64 C 166 92 166 122 152 148',
    'M112 100 L128 100 L128 110 L112 110 Z',
  ],
  tactical: [
    'M76 56 L164 56 L172 148 L68 148 Z',
    'M86 82 L154 82 M86 100 L154 100 M86 118 L154 118',
    'M110 56 q10 -14 20 0',
    'M92 58 C 74 90 74 122 86 148 M148 58 C 166 90 166 122 154 148',
  ],
  pouch: [
    'M56 92 L184 92 L176 148 L64 148 Z',
    'M56 92 L184 92',
    'M120 92 L120 80 M114 74 A6 6 0 1 0 126 74 A6 6 0 1 0 114 74',
    'M66 134 L174 134',
  ],
  'sleeping-bag': [
    'M56 82 L184 82 A20 34 0 0 1 184 150 L56 150 A20 34 0 0 1 56 82 Z',
    'M184 82 A20 34 0 0 0 184 150',
    'M86 82 L86 150 M116 82 L116 150 M146 82 L146 150',
    'M100 78 L100 154 M160 78 L160 154',
  ],
  bedroll: [
    'M52 84 L188 84 A22 36 0 0 1 188 152 L52 152 A22 36 0 0 1 52 84 Z',
    'M188 84 A22 36 0 0 0 188 152',
    'M186 102 A10 18 0 0 0 186 134',
    'M92 80 L92 156 M152 80 L152 156',
    'M86 112 L98 112 L98 124 L86 124 Z M146 112 L158 112 L158 124 L146 124 Z',
  ],
  chair: [
    'M76 54 L76 104 M154 54 L154 104',
    'M76 60 L154 60 M76 84 L154 84',
    'M62 104 L168 104',
    'M76 104 L58 152 M154 104 L172 152 M62 104 L96 152 M168 104 L134 152',
    'M40 152 L190 152',
  ],
  table: [
    'M40 92 L200 92 L192 100 L48 100 Z',
    'M58 100 L74 150 M182 100 L166 150',
    'M74 126 L166 126',
    'M40 152 L200 152',
  ],
  lantern: [
    'M94 74 L146 74 L146 128 L94 128 Z',
    'M92 62 C 92 40 148 40 148 62',
    'M88 62 L152 62 L146 74 L94 74 Z',
    'M86 128 L154 128 L150 142 L90 142 Z',
    'M120 92 q-9 11 0 20 q9 -9 0 -20',
  ],
  cushion: [
    'M56 74 q64 -12 128 0 q11 40 0 76 q-64 12 -128 0 q-11 -36 0 -76 z',
    'M72 88 q48 -9 96 0 q8 30 0 56 q-48 9 -96 0 q-8 -26 0 -56 z',
  ],
  cover: [
    'M40 98 C 60 64 180 64 200 98',
    'M40 98 L40 142 M200 98 L200 142',
    'M40 142 q20 10 40 0 q20 10 40 0 q20 10 40 0 q20 10 40 0',
    'M120 66 L120 148',
  ],
  shade: [
    'M36 60 Q124 84 206 44 Q188 102 176 148 Q116 128 54 132 Q42 98 36 60 Z',
    'M36 60 A5 5 0 1 0 46 60 A5 5 0 1 0 36 60 M201 44 A5 5 0 1 0 211 44 A5 5 0 1 0 201 44',
    'M171 148 A5 5 0 1 0 181 148 A5 5 0 1 0 171 148 M49 132 A5 5 0 1 0 59 132 A5 5 0 1 0 49 132',
    'M36 60 L20 44 M206 44 L222 30 M176 148 L192 162 M54 132 L38 148',
  ],
  hammock: [
    'M40 66 C 80 152 160 152 200 66',
    'M40 78 C 82 158 158 158 200 78',
    'M40 46 L40 152 M200 46 L200 152',
    'M20 152 L220 152',
    'M40 66 L28 52 M200 66 L212 52',
  ],
  basket: [
    'M62 80 L54 148 q66 12 132 0 L178 80 Z',
    'M62 80 q58 -13 116 0',
    'M56 110 q64 11 128 0 M55 128 q65 11 130 0',
    'M58 96 q-11 7 0 14 M182 96 q11 7 0 14',
  ],
  mat: [
    'M40 146 L152 146 M40 154 L152 154',
    'M176 126 A26 26 0 1 0 176 178 A26 26 0 1 0 176 126',
    'M176 138 A14 14 0 1 0 176 166 A14 14 0 1 0 176 138',
    'M20 158 L220 158',
  ],
  apron: [
    'M92 44 L148 44 L152 84 L88 84 Z',
    'M88 84 L76 152 L164 152 L152 84',
    'M92 46 C 92 24 148 24 148 46',
    'M76 106 L44 118 M164 106 L196 118',
    'M96 110 L144 110 L144 136 L96 136 Z M120 110 L120 136',
  ],
  'pet-bed': [
    'M40 118 q80 -28 160 0 q11 24 0 34 q-80 24 -160 0 q-11 -10 0 -34 z',
    'M64 124 q56 -15 112 0 q6 12 0 18 q-56 15 -112 0 q-6 -8 0 -18 z',
    'M20 158 L220 158',
  ],
  // Round medieval pavilion: conical roof, finial, straight walls, valance.
  pavilion: [
    'M120 22 L44 82 L196 82 Z',
    'M120 22 L120 10 M114 10 A6 6 0 1 0 126 10 A6 6 0 1 0 114 10',
    'M44 82 L44 146 M196 82 L196 146',
    'M44 146 A76 10 0 0 0 196 146',
    'M44 82 q9 9 19 0 q9 9 19 0 q9 9 19 0 q9 9 19 0 q9 9 19 0 q9 9 19 0 q9 9 19 0 q9 9 19 0',
    'M104 146 L104 106 L136 106 L136 146',
  ],
  // Wedge / A-frame medieval tent with a ridge pole through the apex.
  wedge: [
    'M48 148 L120 52 L192 148 Z',
    'M120 52 L120 40 M104 44 L136 44',
    'M100 148 L120 98 L140 148',
    'M48 148 L36 158 M192 148 L204 158',
    'M20 152 L220 152',
  ],
  // Norse A-frame: crossed head poles above the ridge.
  viking: [
    'M52 148 L120 58 L188 148',
    'M104 42 L136 74 M136 42 L104 74',
    'M120 58 L120 148',
    'M52 148 L188 148',
    'M74 118 L166 118',
  ],
  // Shamiana: scalloped valance under a shallow four-post canopy.
  shamiana: [
    'M28 72 L120 40 L212 72',
    'M28 72 q11 12 23 0 q11 12 23 0 q11 12 23 0 q11 12 23 0 q11 12 23 0 q11 12 23 0 q11 12 23 0 q11 12 23 0',
    'M40 84 L40 150 M200 84 L200 150',
    'M120 40 L120 30 M114 30 A6 6 0 1 0 126 30 A6 6 0 1 0 114 30',
    'M20 150 L220 150',
  ],
  // Military ridge tent: guy lines out to pegs, sod cloth at the base.
  military: [
    'M46 146 L120 62 L194 146',
    'M120 62 L120 50 M96 50 L144 50',
    'M46 146 L194 146 M46 152 L194 152',
    'M120 62 L28 118 M120 62 L212 118 M46 146 L26 156 M194 146 L214 156',
    'M104 146 L120 104 L136 146',
  ],
  // Relief tent: ridge over vertical side walls, centre pole visible.
  relief: [
    'M34 88 L120 44 L206 88',
    'M52 88 L52 148 M188 88 L188 148',
    'M120 44 L120 148',
    'M20 150 L220 150',
    'M100 148 L100 110 L140 110 L140 148',
  ],
  // Pagoda exhibition tent: hipped peak on four legs.
  pagoda: [
    'M120 30 L40 86 L200 86 Z',
    'M120 30 L120 86',
    'M52 86 L52 150 M188 86 L188 150',
    'M40 86 L200 86 M40 94 L200 94',
    'M120 30 L120 20',
  ],
  // Child's play tent: a small tipi with a bunting line.
  play: [
    'M120 48 L62 148 M120 48 L178 148',
    'M62 148 L178 148',
    'M104 148 L120 100 L136 148',
    'M112 42 L128 62 M128 42 L112 62',
    'M40 74 Q120 96 200 74 M64 82 L70 92 L76 80 M114 90 L120 100 L126 88 M164 82 L170 92 L176 80',
  ],
  // Folded tarpaulin sheet with corner eyelets.
  tarp: [
    'M36 66 L204 66 L184 150 L56 150 Z',
    'M36 66 L204 66',
    'M46 78 A5 5 0 1 0 56 78 A5 5 0 1 0 46 78 M184 78 A5 5 0 1 0 194 78 A5 5 0 1 0 184 78 M62 140 A5 5 0 1 0 72 140 A5 5 0 1 0 62 140 M168 140 A5 5 0 1 0 178 140 A5 5 0 1 0 168 140',
    'M120 66 L120 150',
    'M52 108 L188 108',
  ],
  // Bolt of cloth: a roll with a length falling from it.
  roll: [
    'M52 58 L52 128 A24 12 0 0 0 100 128 L100 58 A24 12 0 0 0 52 58 A24 12 0 0 0 100 58',
    'M100 92 L196 92 L196 152 L100 152',
    'M100 152 q24 8 48 0 q24 8 48 0',
    'M120 92 L120 152 M148 92 L148 152 M172 92 L172 152',
  ],
  // Artist canvas on an easel.
  easel: [
    'M62 44 L178 44 L178 122 L62 122 Z',
    'M74 56 L166 56 L166 110 L74 110 Z',
    'M120 122 L120 156 M120 122 L74 156 M120 122 L166 156',
    'M92 144 L148 144',
    'M20 156 L220 156',
  ],
  // Market parasol: canopy, finial, pole and base.
  parasol: [
    'M28 90 Q74 42 120 40 Q166 42 212 90',
    'M28 90 q11 14 23 0 q11 14 23 0 q11 14 23 0 q11 14 23 0 q11 14 23 0 q11 14 23 0 q11 14 23 0 q11 14 23 0',
    'M120 40 L120 28 M114 28 A6 6 0 1 0 126 28 A6 6 0 1 0 114 28',
    'M120 90 L120 148',
    'M96 148 L144 148 L148 156 L92 156 Z',
  ],
  // Fabric swatch: layered corners with a printed pattern.
  swatch: [
    'M46 56 L182 56 L182 148 L46 148 Z',
    'M58 68 L194 68 L194 160 L58 160',
    'M70 84 A8 8 0 1 0 86 84 A8 8 0 1 0 70 84 M108 100 A11 11 0 1 0 130 100 A11 11 0 1 0 108 100 M144 78 A7 7 0 1 0 158 78 A7 7 0 1 0 144 78 M78 122 A9 9 0 1 0 96 122 A9 9 0 1 0 78 122 M140 126 A8 8 0 1 0 156 126 A8 8 0 1 0 140 126',
    'M46 56 L58 68',
  ],
  project: [
    'M44 50 L196 50 L196 150 L44 150 Z',
    'M84 124 L120 84 L156 124 M84 124 L156 124',
    'M72 138 L168 138 M72 132 L72 144 M168 132 L168 144',
    'M148 140 L190 140 L190 146 L148 146 Z',
    'M44 66 L196 66',
  ],
}

/**
 * Duotone grounds. Plates stay dark in both themes — they read as photography,
 * and photographs do not invert when a page does.
 */
const GROUNDS: Array<[string, string]> = [
  ['#12150f', '#39412c'], // deep olive
  ['#101215', '#2e343c'], // charcoal
  ['#161209', '#463a26'], // umber / brass shadow
  ['#0f1416', '#28383c'], // slate
  ['#141008', '#3d3220'], // tobacco
  ['#0f1310', '#2b3a2c'], // forest
]

/** Stable, non-cryptographic hash so a SKU always gets the same ground. */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export interface PlateTone {
  from: string
  to: string
  /** Gradient rotation in degrees — varies the light direction per product. */
  angle: number
  /** Horizontal drift of the light source, 0–1. */
  focus: number
}

export function plateTone(seed: string): PlateTone {
  const h = hash(seed)
  const [from, to] = GROUNDS[h % GROUNDS.length]
  return {
    from,
    to,
    angle: 100 + ((h >> 3) % 70),
    focus: 0.3 + ((h >> 7) % 40) / 100,
  }
}
