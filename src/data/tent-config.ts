import { C, MEDIEVAL } from './palette'
import { SCALLOPS, type ScallopId } from './scallops'
import type { ColorVariant, PlateId } from './types'

/**
 * The configurator's contract.
 *
 * Everything the /create-tent page offers — the three families, every control,
 * its range, its options and its default — is declared here. The form renders
 * itself from `sections`, the geometry reads the spec, and the enquiry stores
 * it verbatim. Correcting a manufacturing limit is an edit to this file and
 * nothing else.
 *
 * All lengths are **metres**, always. The foot toggle is a display conversion
 * applied at the input, never a second stored unit.
 */

export type TentFamilyId = 'bell' | 'medieval' | 'safari'

/** Which surface a colour applies to. Not every family uses every part. */
export type ColorPart =
  | 'roof'
  | 'roofAlt'
  | 'walls'
  | 'valance'
  | 'braid'
  | 'door'
  | 'finial'
  | 'frame'
  | 'deck'

export type PartColors = Partial<Record<ColorPart, string>>

/** Everything a control can hold. */
export type SpecValue = string | number | boolean | string[]

interface CommonSpec {
  family: TentFamilyId
  quantity: number
  canvasGsm: number
  treatment: string[]
  colors: PartColors
}

export interface BellSpec extends CommonSpec {
  family: 'bell'
  diameter: number
  wallHeight: number
  centreHeight: number
  doors: 'single' | 'double' | 'opposing'
  windows: number
  windowStyle: 'mesh' | 'pvc' | 'none'
  vents: number
  stoveJack: 'none' | 'wall' | 'roof'
  groundsheet: 'zip-in' | 'sewn-in' | 'none'
  poleFinish: 'galvanised' | 'powder' | 'wood'
  stormSkirt: boolean
  valance: boolean
  finial: boolean
  guyKit: 'standard' | 'storm'
  awning: 'none' | 'porch' | 'veranda'
  branding: 'none' | 'printed' | 'embroidered'
}

export interface MedievalSpec extends CommonSpec {
  family: 'medieval'
  form: 'round' | 'oval' | 'geteld' | 'saxon'
  diameter: number
  length: number
  width: number
  gores: number
  stripe: 'solid' | 'alternating' | 'banded'
  valanceEdge: ScallopId
  /** A coloured cord run along the cut edge of the valance. */
  braid: boolean
  finial: 'none' | 'ball' | 'spear' | 'pennant'
  roofPitch: number
  wallHeight: number
  door: 'single-arch' | 'double-arch' | 'laced'
  frame: 'rope-and-pole' | 'internal'
  ground: 'sewn-in' | 'none'
  heraldry: boolean
}

export interface SafariSpec extends CommonSpec {
  family: 'safari'
  length: number
  width: number
  eaveHeight: number
  ridgeHeight: number
  veranda: 'none' | 'porch' | 'wrap'
  verandaDepth: number
  roof: 'single' | 'double'
  ensuite: 'none' | 'rear'
  ensuiteDepth: number
  windowsPerWall: number
  doors: 'front' | 'front-rear'
  meshInner: boolean
  rollUpWalls: boolean
  floor: 'none' | 'pvc' | 'deck'
  frameFinish: 'galvanised' | 'powder'
  ridgeVents: number
  partition: boolean
  branding: 'none' | 'printed' | 'embroidered'
}

export type TentSpec = BellSpec | MedievalSpec | SafariSpec

/* ── Control declarations ───────────────────────────────────────────────── */

interface FieldBase {
  key: string
  label: string
  hint?: string
  /** Only show this control when the predicate passes — e.g. veranda depth. */
  when?: (spec: Record<string, SpecValue>) => boolean
}

export type TentField =
  | (FieldBase & {
      kind: 'range'
      min: number
      max: number
      step: number
      /** 'm' converts with the foot toggle; '°' and '' never do. */
      unit: 'm' | '°' | ''
    })
  | (FieldBase & {
      kind: 'select'
      options: Array<{
        value: string
        label: string
        hint?: string
        /** Draws the cut edge beside the option, from the real profile. */
        scallop?: ScallopId
      }>
    })
  | (FieldBase & { kind: 'stepper'; min: number; max: number })
  | (FieldBase & { kind: 'toggle' })
  | (FieldBase & { kind: 'chips'; options: Array<{ value: string; label: string }> })

export interface TentSection {
  title: string
  fields: TentField[]
}

export interface TentFamilyDef {
  id: TentFamilyId
  name: string
  kicker: string
  blurb: string
  /** Silhouette used when WebGL is unavailable. */
  plate: PlateId
  defaults: TentSpec
  sections: TentSection[]
  colorParts: Array<{ key: ColorPart; label: string; hint?: string }>
  /**
   * The cloth this family is actually cut from. The pavilions run the dyed
   * medieval range; everything else stays in the house colourway.
   */
  swatches: ColorVariant[]
}

/* ── Shared option sets ─────────────────────────────────────────────────── */

const CANVAS_WEIGHTS = [
  { value: '280', label: '280 gsm', hint: 'Lightest — seasonal and event use' },
  { value: '320', label: '320 gsm', hint: 'General purpose' },
  { value: '360', label: '360 gsm', hint: 'The house standard' },
  { value: '400', label: '400 gsm', hint: 'Heavy duty, year-round pitching' },
  { value: '450', label: '450 gsm', hint: 'Permanent installation' },
]

const TREATMENTS = [
  { value: 'rot-mould-uv', label: 'Rot, mould & UV' },
  { value: 'waterproof', label: 'Waterproof PU coating' },
  { value: 'fire-retardant', label: 'Fire retardant (CPAI-84)' },
  { value: 'anti-fungal', label: 'Anti-fungal wash' },
]

const BRANDING = [
  { value: 'none', label: 'None' },
  { value: 'printed', label: 'Printed logo' },
  { value: 'embroidered', label: 'Embroidered patch' },
]

const canvasSection = (weights = CANVAS_WEIGHTS.slice(0, 4)): TentSection => ({
  title: 'Cloth',
  fields: [
    { kind: 'select', key: 'canvasGsm', label: 'Canvas weight', options: weights },
    { kind: 'chips', key: 'treatment', label: 'Treatments', options: TREATMENTS },
  ],
})

/* ── Swatch sets ────────────────────────────────────────────────────────── */

/** The house colourway — what the bell and safari tents are cut from. */
export const SWATCHES: ColorVariant[] = Object.values(C)

/**
 * The pavilion range: the natural grounds a historic tent is bodied in, then
 * the eight dyed cloths the gores, valance and braid are actually run in.
 */
export const MEDIEVAL_SWATCHES: ColorVariant[] = [
  C.natural,
  C.ecru,
  C.bone,
  C.sand,
  ...Object.values(MEDIEVAL),
]

/** Every swatch known to the configurator, for naming a stored hex. */
const ALL_SWATCHES = [...SWATCHES, ...Object.values(MEDIEVAL)]

/* ── Bell ───────────────────────────────────────────────────────────────── */

const bell: TentFamilyDef = {
  id: 'bell',
  name: 'Bell Tent',
  kicker: 'One pole, a perfect circle',
  blurb:
    'The glamping standard. A single centre pole under a cone of treated canvas, walled to whatever height the site asks for.',
  plate: 'bell',
  swatches: SWATCHES,
  colorParts: [
    { key: 'roof', label: 'Roof cone' },
    { key: 'walls', label: 'Side walls' },
    { key: 'valance', label: 'Valance & skirt' },
    { key: 'door', label: 'Door canvas' },
    { key: 'finial', label: 'Finial' },
  ],
  defaults: {
    family: 'bell',
    quantity: 1,
    diameter: 5,
    wallHeight: 0.8,
    centreHeight: 3,
    canvasGsm: 360,
    treatment: ['rot-mould-uv', 'waterproof'],
    doors: 'single',
    windows: 4,
    windowStyle: 'mesh',
    vents: 2,
    stoveJack: 'none',
    groundsheet: 'zip-in',
    poleFinish: 'galvanised',
    stormSkirt: true,
    valance: true,
    finial: true,
    guyKit: 'standard',
    awning: 'none',
    branding: 'none',
    colors: {
      roof: C.natural.hex,
      walls: C.natural.hex,
      valance: C.olive.hex,
      door: C.natural.hex,
      finial: C.brass.hex,
    },
  },
  sections: [
    {
      title: 'Dimensions',
      fields: [
        {
          kind: 'range',
          key: 'diameter',
          label: 'Diameter',
          min: 3,
          max: 8,
          step: 0.5,
          unit: 'm',
          hint: 'Measured at the storm skirt',
        },
        {
          kind: 'range',
          key: 'wallHeight',
          label: 'Wall height',
          min: 0.6,
          max: 1.2,
          step: 0.05,
          unit: 'm',
        },
        {
          kind: 'range',
          key: 'centreHeight',
          label: 'Centre height',
          min: 2,
          max: 4,
          step: 0.1,
          unit: 'm',
        },
      ],
    },
    canvasSection(),
    {
      title: 'Openings',
      fields: [
        {
          kind: 'select',
          key: 'doors',
          label: 'Doors',
          options: [
            { value: 'single', label: 'Single' },
            { value: 'double', label: 'Double width' },
            { value: 'opposing', label: 'Two, opposing' },
          ],
        },
        { kind: 'stepper', key: 'windows', label: 'Windows', min: 0, max: 6 },
        {
          kind: 'select',
          key: 'windowStyle',
          label: 'Window style',
          when: (spec) => Number(spec.windows) > 0,
          options: [
            { value: 'mesh', label: 'Mesh with storm flap' },
            { value: 'pvc', label: 'Clear PVC' },
            { value: 'none', label: 'Canvas only' },
          ],
        },
        { kind: 'stepper', key: 'vents', label: 'Roof vents', min: 0, max: 2 },
        {
          kind: 'select',
          key: 'stoveJack',
          label: 'Stove jack',
          options: [
            { value: 'none', label: 'None' },
            { value: 'wall', label: 'Wall, silicone collar' },
            { value: 'roof', label: 'Roof, high position' },
          ],
        },
      ],
    },
    {
      title: 'Structure',
      fields: [
        {
          kind: 'select',
          key: 'groundsheet',
          label: 'Groundsheet',
          options: [
            { value: 'zip-in', label: 'Zip-in PVC, 540 gsm' },
            { value: 'sewn-in', label: 'Sewn-in bathtub' },
            { value: 'none', label: 'None' },
          ],
        },
        {
          kind: 'select',
          key: 'poleFinish',
          label: 'Pole finish',
          options: [
            { value: 'galvanised', label: 'Galvanised steel' },
            { value: 'powder', label: 'Powder-coated steel' },
            { value: 'wood', label: 'Turned hardwood' },
          ],
        },
        {
          kind: 'select',
          key: 'guyKit',
          label: 'Guy & peg kit',
          options: [
            { value: 'standard', label: 'Standard' },
            { value: 'storm', label: 'Heavy-duty storm kit' },
          ],
        },
        {
          kind: 'select',
          key: 'awning',
          label: 'Awning',
          options: [
            { value: 'none', label: 'None' },
            { value: 'porch', label: 'Porch over the door' },
            { value: 'veranda', label: 'Full veranda' },
          ],
        },
        { kind: 'toggle', key: 'stormSkirt', label: 'Storm skirt' },
        { kind: 'toggle', key: 'valance', label: 'Valance band' },
        { kind: 'toggle', key: 'finial', label: 'Finial cap' },
      ],
    },
    {
      title: 'Finishing',
      fields: [{ kind: 'select', key: 'branding', label: 'Branding', options: BRANDING }],
    },
  ],
}

/* ── Medieval ───────────────────────────────────────────────────────────── */

const medieval: TentFamilyDef = {
  id: 'medieval',
  name: 'Medieval Pavilion',
  kicker: 'Gores, valance and a spear at the peak',
  blurb:
    'Historic forms cut the historic way — individual gores, a dagged or scalloped valance and a finial that carries a pennant.',
  plate: 'viking',
  swatches: MEDIEVAL_SWATCHES,
  colorParts: [
    { key: 'roof', label: 'Gore — first colour' },
    { key: 'roofAlt', label: 'Gore — second colour', hint: 'Used by striped cuts' },
    { key: 'walls', label: 'Side walls' },
    { key: 'valance', label: 'Valance' },
    { key: 'braid', label: 'Braid', hint: 'The cord run along the cut edge' },
    { key: 'door', label: 'Door curtains' },
    { key: 'finial', label: 'Finial & pennant' },
  ],
  defaults: {
    family: 'medieval',
    quantity: 1,
    form: 'round',
    diameter: 5,
    length: 6,
    width: 4,
    gores: 12,
    stripe: 'alternating',
    valanceEdge: 'fish-mouth',
    braid: true,
    finial: 'spear',
    roofPitch: 45,
    wallHeight: 1.6,
    canvasGsm: 400,
    treatment: ['rot-mould-uv', 'waterproof'],
    door: 'double-arch',
    frame: 'rope-and-pole',
    ground: 'none',
    heraldry: false,
    colors: {
      roof: C.bone.hex,
      roofAlt: MEDIEVAL.red.hex,
      walls: C.bone.hex,
      valance: MEDIEVAL.forestGreen.hex,
      braid: MEDIEVAL.goldenYellow.hex,
      door: MEDIEVAL.red.hex,
      finial: C.brass.hex,
    },
  },
  sections: [
    {
      title: 'Form',
      fields: [
        {
          kind: 'select',
          key: 'form',
          label: 'Pavilion type',
          options: [
            { value: 'round', label: 'Round pavilion', hint: 'Conical, walled, single mast' },
            { value: 'oval', label: 'Oval (Burgundian)', hint: 'Two masts, ridged centre' },
            { value: 'geteld', label: 'Viking geteld', hint: 'A-frame, crossed gable ends' },
            { value: 'saxon', label: 'Saxon square', hint: 'Four-sided pyramid roof' },
          ],
        },
        {
          kind: 'range',
          key: 'diameter',
          label: 'Diameter',
          min: 3,
          max: 9,
          step: 0.5,
          unit: 'm',
          when: (spec) => spec.form === 'round',
        },
        {
          kind: 'range',
          key: 'length',
          label: 'Length',
          min: 4,
          max: 12,
          step: 0.5,
          unit: 'm',
          when: (spec) => spec.form !== 'round',
        },
        {
          kind: 'range',
          key: 'width',
          label: 'Width',
          min: 3,
          max: 8,
          step: 0.5,
          unit: 'm',
          when: (spec) => spec.form !== 'round',
        },
        {
          kind: 'range',
          key: 'wallHeight',
          label: 'Wall height',
          min: 0,
          max: 2.4,
          step: 0.1,
          unit: 'm',
          hint: 'Zero pitches the roof straight to the ground',
        },
        {
          kind: 'range',
          key: 'roofPitch',
          label: 'Roof pitch',
          min: 30,
          max: 65,
          step: 1,
          unit: '°',
        },
      ],
    },
    {
      title: 'The cut',
      fields: [
        {
          kind: 'select',
          key: 'gores',
          label: 'Gore count',
          when: (spec) => spec.form === 'round' || spec.form === 'oval',
          options: [
            { value: '8', label: '8 gores' },
            { value: '10', label: '10 gores' },
            { value: '12', label: '12 gores' },
            { value: '16', label: '16 gores', hint: 'The roundest cone' },
          ],
        },
        {
          kind: 'select',
          key: 'stripe',
          label: 'Stripe treatment',
          options: [
            { value: 'solid', label: 'Solid' },
            { value: 'alternating', label: 'Alternating gores' },
            { value: 'banded', label: 'Horizontal band' },
          ],
        },
        {
          kind: 'select',
          key: 'valanceEdge',
          label: 'Scallop',
          // Straight off the house cutting sheet, and drawn from the same
          // profile the cloth is cut to.
          options: SCALLOPS.map((profile) => ({
            value: profile.id,
            label: profile.label,
            hint: profile.hint,
            scallop: profile.id,
          })),
        },
        {
          kind: 'toggle',
          key: 'braid',
          label: 'Braid the edge',
          hint: 'A coloured cord sewn along the scallop',
        },
        {
          kind: 'select',
          key: 'finial',
          label: 'Finial',
          options: [
            { value: 'none', label: 'None' },
            { value: 'ball', label: 'Turned ball' },
            { value: 'spear', label: 'Spear point' },
            { value: 'pennant', label: 'Spear with pennant' },
          ],
        },
      ],
    },
    canvasSection(CANVAS_WEIGHTS.slice(1)),
    {
      title: 'Structure',
      fields: [
        {
          kind: 'select',
          key: 'door',
          label: 'Entry',
          options: [
            { value: 'single-arch', label: 'Single arch' },
            { value: 'double-arch', label: 'Double arch, tied back' },
            { value: 'laced', label: 'Laced closure' },
          ],
        },
        {
          kind: 'select',
          key: 'frame',
          label: 'Frame',
          options: [
            { value: 'rope-and-pole', label: 'Rope and pole' },
            { value: 'internal', label: 'Internal steel frame' },
          ],
        },
        {
          kind: 'select',
          key: 'ground',
          label: 'Ground',
          options: [
            { value: 'none', label: 'Open ground' },
            { value: 'sewn-in', label: 'Sewn-in floor' },
          ],
        },
        { kind: 'toggle', key: 'heraldry', label: 'Painted heraldry panel' },
      ],
    },
  ],
}

/* ── Safari ─────────────────────────────────────────────────────────────── */

const safari: TentFamilyDef = {
  id: 'safari',
  name: 'Safari Tent',
  kicker: 'A room on a frame, with a veranda',
  blurb:
    'The lodge structure: a steel frame carrying a ridged canvas room, a covered veranda and — where the property needs it — a plumbed rear pod.',
  plate: 'safari',
  swatches: SWATCHES,
  colorParts: [
    { key: 'roof', label: 'Roof & fly' },
    { key: 'walls', label: 'Side walls' },
    { key: 'valance', label: 'Veranda trim' },
    { key: 'door', label: 'Door canvas' },
    { key: 'frame', label: 'Frame' },
    { key: 'deck', label: 'Deck' },
  ],
  defaults: {
    family: 'safari',
    quantity: 1,
    length: 6,
    width: 4,
    eaveHeight: 2.1,
    ridgeHeight: 3.2,
    veranda: 'porch',
    verandaDepth: 1.5,
    roof: 'double',
    ensuite: 'none',
    ensuiteDepth: 2,
    windowsPerWall: 2,
    doors: 'front',
    meshInner: true,
    rollUpWalls: false,
    floor: 'deck',
    frameFinish: 'galvanised',
    ridgeVents: 2,
    partition: false,
    canvasGsm: 400,
    treatment: ['rot-mould-uv', 'waterproof', 'fire-retardant'],
    branding: 'none',
    colors: {
      roof: C.khaki.hex,
      walls: C.sand.hex,
      valance: C.olive.hex,
      door: C.sand.hex,
      frame: C.charcoal.hex,
      deck: C.rust.hex,
    },
  },
  sections: [
    {
      title: 'Dimensions',
      fields: [
        { kind: 'range', key: 'length', label: 'Length', min: 4, max: 12, step: 0.5, unit: 'm' },
        { kind: 'range', key: 'width', label: 'Width', min: 3, max: 8, step: 0.5, unit: 'm' },
        {
          kind: 'range',
          key: 'eaveHeight',
          label: 'Eave height',
          min: 1.8,
          max: 3,
          step: 0.1,
          unit: 'm',
        },
        {
          kind: 'range',
          key: 'ridgeHeight',
          label: 'Ridge height',
          min: 2.4,
          max: 4.5,
          step: 0.1,
          unit: 'm',
          hint: 'Held above the eave automatically',
        },
      ],
    },
    {
      title: 'Veranda & extensions',
      fields: [
        {
          kind: 'select',
          key: 'veranda',
          label: 'Veranda',
          options: [
            { value: 'none', label: 'None' },
            { value: 'porch', label: 'Front porch' },
            { value: 'wrap', label: 'Wrap-around' },
          ],
        },
        {
          kind: 'range',
          key: 'verandaDepth',
          label: 'Veranda depth',
          min: 1,
          max: 3,
          step: 0.25,
          unit: 'm',
          when: (spec) => spec.veranda !== 'none',
        },
        {
          kind: 'select',
          key: 'ensuite',
          label: 'Ensuite pod',
          options: [
            { value: 'none', label: 'None' },
            { value: 'rear', label: 'Rear bathroom' },
          ],
        },
        {
          kind: 'range',
          key: 'ensuiteDepth',
          label: 'Pod depth',
          min: 1.5,
          max: 3.5,
          step: 0.25,
          unit: 'm',
          when: (spec) => spec.ensuite === 'rear',
        },
        { kind: 'toggle', key: 'partition', label: 'Interior partition wall' },
      ],
    },
    canvasSection(CANVAS_WEIGHTS.slice(1)),
    {
      title: 'Openings',
      fields: [
        {
          kind: 'select',
          key: 'roof',
          label: 'Roof',
          options: [
            { value: 'single', label: 'Single skin' },
            { value: 'double', label: 'Double skin with fly' },
          ],
        },
        {
          kind: 'stepper',
          key: 'windowsPerWall',
          label: 'Windows per side',
          min: 0,
          max: 4,
        },
        {
          kind: 'select',
          key: 'doors',
          label: 'Doors',
          options: [
            { value: 'front', label: 'Front only' },
            { value: 'front-rear', label: 'Front and rear' },
          ],
        },
        { kind: 'stepper', key: 'ridgeVents', label: 'Ridge vents', min: 0, max: 4 },
        { kind: 'toggle', key: 'meshInner', label: 'Mesh inner doors' },
        { kind: 'toggle', key: 'rollUpWalls', label: 'Roll-up side walls' },
      ],
    },
    {
      title: 'Frame & floor',
      fields: [
        {
          kind: 'select',
          key: 'frameFinish',
          label: 'Frame finish',
          options: [
            { value: 'galvanised', label: 'Hot-dip galvanised' },
            { value: 'powder', label: 'Powder-coated' },
          ],
        },
        {
          kind: 'select',
          key: 'floor',
          label: 'Floor',
          options: [
            { value: 'none', label: 'Open ground' },
            { value: 'pvc', label: 'PVC groundsheet' },
            { value: 'deck', label: 'Timber deck' },
          ],
        },
        { kind: 'select', key: 'branding', label: 'Branding', options: BRANDING },
      ],
    },
  ],
}

export const TENT_FAMILIES: TentFamilyDef[] = [bell, medieval, safari]

export const TENT_FAMILY_BY_ID = new Map(TENT_FAMILIES.map((f) => [f.id, f]))

export function familyDef(id: TentFamilyId): TentFamilyDef {
  const found = TENT_FAMILY_BY_ID.get(id)
  if (!found) throw new Error(`Unknown tent family: ${id}`)
  return found
}

/** A fresh copy of the defaults — never hand out the shared object. */
export function defaultSpec(id: TentFamilyId): TentSpec {
  const base = familyDef(id).defaults
  return { ...base, treatment: [...base.treatment], colors: { ...base.colors } }
}

/* ── Units ──────────────────────────────────────────────────────────────── */

export type LengthUnit = 'm' | 'ft'

const FEET_PER_METRE = 3.28084

export function toDisplay(metres: number, unit: LengthUnit): number {
  return unit === 'ft' ? metres * FEET_PER_METRE : metres
}

export function fromDisplay(value: number, unit: LengthUnit): number {
  return unit === 'ft' ? value / FEET_PER_METRE : value
}

/** "5.0 m" / "16.4 ft" — one decimal is the honest precision here. */
export function formatLength(metres: number, unit: LengthUnit): string {
  return `${toDisplay(metres, unit).toFixed(1)} ${unit}`
}

/* ── Reading a spec generically ─────────────────────────────────────────── */

/**
 * The form is data-driven, so it addresses the spec by string key. The union
 * types stay strict for the geometry; this is the single seam where they are
 * read as a bag of values.
 */
export function asRecord(spec: TentSpec): Record<string, SpecValue> {
  return spec as unknown as Record<string, SpecValue>
}

export function isVisible(field: TentField, spec: TentSpec): boolean {
  return field.when ? field.when(asRecord(spec)) : true
}

/** Human-readable value for a field, used by the summary and the enquiry. */
export function describeField(
  field: TentField,
  spec: TentSpec,
  unit: LengthUnit = 'm',
): string {
  const value = asRecord(spec)[field.key]

  switch (field.kind) {
    case 'range':
      return field.unit === 'm'
        ? formatLength(Number(value), unit)
        : `${Number(value)}${field.unit === '°' ? '°' : ''}`
    case 'stepper':
      return String(value)
    case 'toggle':
      return value ? 'Yes' : 'No'
    case 'chips':
      return Array.isArray(value) && value.length
        ? value
            .map((v) => field.options.find((o) => o.value === v)?.label ?? v)
            .join(', ')
        : 'None'
    case 'select':
      return field.options.find((o) => o.value === String(value))?.label ?? String(value)
  }
}

/** Flattens the whole spec into label/value pairs — spec sheet and admin use this. */
export function summariseSpec(
  spec: TentSpec,
  unit: LengthUnit = 'm',
): Array<{ section: string; rows: Array<{ label: string; value: string }> }> {
  return familyDef(spec.family).sections.map((section) => ({
    section: section.title,
    rows: section.fields
      .filter((field) => isVisible(field, spec))
      .map((field) => ({ label: field.label, value: describeField(field, spec, unit) })),
  }))
}

/** The one-line description that rides on the cart line. */
export function specHeadline(spec: TentSpec, unit: LengthUnit = 'm'): string {
  const def = familyDef(spec.family)
  if (spec.family === 'bell') {
    return `${def.name} · ${formatLength(spec.diameter, unit)} Ø`
  }
  if (spec.family === 'medieval') {
    const size =
      spec.form === 'round'
        ? `${formatLength(spec.diameter, unit)} Ø`
        : `${formatLength(spec.length, unit)} × ${formatLength(spec.width, unit)}`
    return `${def.name} · ${size}`
  }
  return `${def.name} · ${formatLength(spec.length, unit)} × ${formatLength(spec.width, unit)}`
}

export function swatchName(hex: string): string {
  return ALL_SWATCHES.find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex
}
