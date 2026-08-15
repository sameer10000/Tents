# Canvas Emporium

An editorial catalogue site for a premium Indian canvas house — tents, expedition
shelter, travel and camping bags, sleep systems, camp furniture and outdoor living.

Built as a **catalogue**, not a store: there is no cart, no checkout and no stock
count. Every route converges on an enquiry, because the profit engine of this
business is B2B project work quoted against a drawing.

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 · Framer Motion · React Router 7

---

## Running it

Two processes — the API and the front end.

```bash
npm install

npm run server     # http://localhost:4000  — API, must start first
npm run dev        # http://localhost:5173  — storefront + admin portal
```

Vite proxies `/api` and `/uploads` to the API, so everything is same-origin and
the session cookie behaves exactly as it will in production.

```bash
npm run build      # typecheck, then production build to dist/
npm run preview    # serve the built output
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier
```

---

## The tent configurator

`http://localhost:5173/create-tent`

Three families — **bell tents**, **medieval pavilions** and **safari tents** —
drawn live in 3D as you specify them. Dimensions, canvas weight and treatments,
doors, windows, vents, stove jacks, groundsheets, poles, guys, awnings, valance
edges, finials, verandas, ensuite pods and a per-part colourway, all from the
15-colour house palette.

| Route | Does |
| --- | --- |
| `/create-tent` | Start a new design |
| `/create-tent/:id` | Reopen a saved one — this is the share link |
| `/admin/enquiries` | Everything sent to the studio |

### Scallops, braid and the pavilion colours

The medieval valance is cut to one of the eight house profiles — **Plain**,
**Square**, **Sine Wave**, **Fish Mouth**, **Inverted Taj**, **Raj**, **Fish
Scale** and **Dragon Mouth** — each with an optional **braid**: a coloured cord
sewn along the cut edge, which the geometry follows exactly.

Every profile lives in `src/data/scallops.ts` as a single `at(t)` function
returning how deep the cloth hangs across one repeat, plus its preferred repeat
width and depth. That one function drives all three of the cloth, the braid and
the little SVG preview beside the option in the form, so the preview cannot
drift from what the tent actually does. A profile too deep for a short wall is
shortened rather than cut into the ground.

The pavilions are cut from the dyed medieval range rather than the natural
house colourway — **Black, Brown, Sea Green, Forest Green, Golden Yellow, Red,
Royal Blue and Navy Blue** (`MEDIEVAL` in `src/data/palette.ts`, sampled from
the house colour sheet), alongside the four natural grounds. The bell and
safari tents keep the house palette; a family declares which set it offers via
`swatches` in `tent-config.ts`.

**Three render styles**, switched in the viewport: matte (editorial, the
default), photoreal (procedural woven canvas and environment light) and
blueprint (dimension leaders, a 1.8 m figure for scale, and a plan-view
toggle). Metres by default with a foot toggle.

**Nothing is priced.** A commission is quoted against its drawing, so a custom
tent enters the bag marked *price on request*, is excluded from the subtotal,
GST and shipping, and turns the checkout button into **Request a quote**.
Priced catalogue pieces in the same bag can still be paid for on their own.

**No email is sent.** A submitted enquiry lands in `/admin/enquiries` with the
full specification, the colourway, the contact details, any catalogue pieces
that were in the same bag, and a New / Contacted / Quoted / Closed workflow.
The overview page carries the unanswered count. To add mail later, the one
place to touch is `POST /api/custom-tents/enquiry` in
`server/src/routes/custom-tents.js`.

### How it is put together

```
src/
  data/tent-config.ts        the three families: every control, range,
                             option and default — the form renders itself
                             from this, and the geometry reads the spec
  data/scallops.ts           the eight valance profiles, as curves
  data/palette.ts            house colourway + the dyed MEDIEVAL range
  lib/tent-geometry/
    shared.ts                ground plans, wall bands, gores, struts, sag
    bell.ts · medieval.ts · safari.ts
    index.ts                 buildTent(spec) → TentModel
  components/tent/
    TentViewport.tsx         shell: style switcher, WebGL check, fallback
    TentScene.tsx            the r3f scene (lazy — carries three.js)
    materials.ts             palette resolution, procedural canvas weave
    TentControls.tsx         every control, rendered from the config
```

Changing a manufacturing limit — a diameter range, a canvas weight, an option
that is no longer offered — is an edit to `tent-config.ts` and nothing else.
The **ranges shipped are sensible industry defaults, not measured house
limits**; correct them there.

Doors are real openings: the wall arcs stop at their edges and the roof is cut
back along an arch above them. Medieval gores are built individually, so an
alternating cut is geometry rather than a texture, and the valance genuinely
ends at a different height as you walk round a Dragon Mouth edge.

three.js, `@react-three/fiber` and `@react-three/drei` are ~990 kB together and
are **only** in the `TentScene` chunk. Nothing else on the storefront pulls
them in, and a device without WebGL falls back to that family's generated plate
with the form and the enquiry still fully working.

---

## The admin portal

`http://localhost:5173/admin`

Sign in, then add pieces to an existing lineup or open a new one. Everything —
name, section, pricing, cost, MOQ, dimensions, weight, weather rating, capacity,
materials, detail bullets, colourway, photography, badges — is editable, with a
live card preview beside the form.

| Route | Does |
| --- | --- |
| `/admin/login` | Sign in |
| `/admin` | Overview: counts, pieces without photography, empty sections |
| `/admin/products` | Every piece, searchable and filterable; edit or delete |
| `/admin/products/new` | Create a piece |
| `/admin/products/:sku` | Edit a piece |
| `/admin/sections` | Sections (Bell Tents, Duffel Bags…) |
| `/admin/houses` | Houses — the top-level lineups |

**The first admin account** is created the first time the API starts. Its
password is printed to that terminal **once** and stored only as a scrypt hash.
To choose your own, set it before the first run:

```bash
ADMIN_USERNAME=you ADMIN_PASSWORD=your-password npm run server
```

Structure is three levels: a **house** holds **sections**, a section holds
**pieces**. A piece's house always follows its section, so the two can never
disagree.

### Photography

Upload up to eight images per piece (JPEG, PNG, WebP, AVIF; 8 MB each). The
first is the primary view and the rest fill the gallery. Any view without a
photograph falls back to that piece's generated plate — so a half-photographed
catalogue never looks broken.

---

## Backend

`server/` — Express 5 on Node 24, using the built-in `node:sqlite`. No native
compilation, no ORM, three runtime dependencies in total.

```
server/
  src/
    index.js       app, static uploads, error funnel
    config.js      paths, port, session secret (generated on first run)
    db.js          schema + row mappers
    auth.js        scrypt hashing, HMAC session cookies, guards
    seed.js        first-run seed, read straight from src/data
    validate.js    request validation
    routes/        auth · catalogue · custom-tents · uploads
  data/            canvas.db (SQLite, WAL) — gitignored
  uploads/         uploaded imagery — gitignored
```

| Method | Endpoint | Auth |
| --- | --- | --- |
| `GET` | `/api/catalogue` | public |
| `GET` | `/api/health` | public |
| `POST` | `/api/auth/login` · `/logout` · `GET /me` | — |
| `POST` `PATCH` `DELETE` | `/api/products[/:sku]` | required |
| `POST` `PATCH` `DELETE` | `/api/categories[/:id]` | required |
| `POST` `PATCH` `DELETE` | `/api/families[/:id]` | required |
| `POST` `DELETE` | `/api/uploads[/:filename]` | required |
| `POST` `PATCH` | `/api/custom-tents[/:id]` | public — saves a design |
| `GET` | `/api/custom-tents/:id` | public — returns no contact details |
| `POST` | `/api/custom-tents/enquiry` | public — attaches contact, submits |
| `GET` `PATCH` `DELETE` | `/api/custom-tents[/:id/status]` | required |

Deleting a house or section that still holds pieces returns `409` with a count
rather than cascading silently; the portal then asks before repeating with
`?force=true`.

**On first run** the database is empty, so the server loads `src/data` through
Vite (which transpiles the TypeScript and resolves its imports exactly as the
app does) and seeds all 175 pieces, 32 sections and 11 houses. After that the
database is the source of truth and the TypeScript files are only a fallback.

### How the storefront reads it

`src/data/catalogue.ts` is a `useSyncExternalStore` store seeded with the
bundled TypeScript data and hydrated from `/api/catalogue` on mount. So:

- the storefront paints immediately, before the API answers;
- it still works with **no server running at all**;
- an admin save calls `refreshCatalogue()` and every subscriber re-renders.

Components read it with `useCatalogue()`, which returns the same maps and
helpers the static modules used to export.

---

## The catalogue

**122 SKUs** across 8 houses and 21 sections, in `src/data/products/`.

The 76 codes carried over from the founding business plan — the `T` (tents), `O`
(outdoor), `B` (bags), `H` (home), `C` (camping), `P` (pets) and `X` (custom)
ranges — keep their **original price, cost, channel and MOQ exactly**. Nothing
was rounded or re-invented. The remaining 46 were drawn to complete the
technical categories the plan did not cover:

| Range | Section | Count |
| --- | --- | --- |
| `FT` | Family tents | 4 |
| `ET` | Expedition tents | 4 |
| `DT` | Dome tents | 4 |
| `TK` | Trekking tents | 3 |
| `RT` | Rooftop tents | 3 |
| `DF` | Duffel bags | 3 |
| `WT` | Waterproof travel | 3 |
| `HB` | Hiking backpacks | 3 |
| `TB` | Tactical backpacks | 3 |
| `SB` | Sleeping bags | 5 |
| `FC` | Foldable chairs | 3 |
| `CT` | Camping tables | 3 |
| `LA` | Lanterns & accessories | 5 |

Adding a product is a **data edit, never a code edit** — append an object
matching `Product` in `src/data/types.ts` and it appears in navigation, filters,
search, related-product rails and counts automatically.

`cogs` is carried on every product for margin work. It is **never rendered
publicly** — only `price` reaches the UI.

---

## Imagery

There is no photography in this repository. Instead, every product renders a
generated **plate**: a duotone ground seeded from the SKU, raking light, a
contact shadow, film grain and a hand-authored line-art silhouette
(`src/lib/plate.ts` holds all 32 silhouettes).

Plates are deterministic — the same SKU always produces the same plate, so a
grid looks identical on every visit.

### Dropping in real photography

No code change is needed. Add files to `public/`:

```
public/images/products/t02.jpg      # primary view for SKU T02 (lowercase)
public/images/products/t02-2.jpg    # gallery view 2
public/images/products/t02-3.jpg    # gallery view 3
public/images/products/t02-4.jpg    # gallery view 4
public/media/hero.mp4               # home page hero video
```

`ProductImage` renders the plate first and fades a photograph in over it once it
loads. If the file is absent the plate simply stays. There is never a broken
image and never a layout shift. The hero video behaves the same way — the drawn
night-camp scene is the baseline, and footage fades in over it if supplied.

---

## Structure

```
src/
  data/
    types.ts          Product / Category / Family contracts
    taxonomy.ts       8 houses, 21 sections
    palette.ts        the house colourway
    products/         122 SKUs, split by house + query helpers
  lib/
    plate.ts          32 line-art silhouettes + deterministic ground seeding
    format.ts         Indian-grouped currency (₹1,29,000, lakh/crore shorthand)
  context/
    theme.ts / ThemeProvider.tsx
    wishlist.ts / WishlistProvider.tsx
    ui.ts / UIProvider.tsx
  components/
    motion/           Reveal, Parallax, SplitHeading, PageTransition
    …                 navbar, mega menu, plates, cards, drawers, overlays
  pages/              Home, Collections, Family, Category, Product,
                      Craftsmanship, About, Contact, NotFound
```

Context is split into a `.ts` file (context object + hook) and a `.tsx` file
(provider) so React Fast Refresh works correctly during development.

### Routes

| Route | Page |
| --- | --- |
| `/` | Home — cinematic hero, houses, signature pieces, craftsmanship, atelier |
| `/collections` | Full catalogue, all 122 pieces, filterable |
| `/collections/:slug` | House index — `tents`, `bags`, `sleeping`, `field`, `outdoor-living`, `home`, `companion`, `atelier` |
| `/catalogue/:slug` | A single section, e.g. `/catalogue/dome-tents` |
| `/product/:sku` | Product detail, e.g. `/product/T02` |
| `/create-tent` · `/create-tent/:id` | The tent configurator |
| `/craftsmanship` · `/about` · `/contact` | Editorial pages |

`/collections/sleeping` is the "Sleeping Bags & Accessories" page — it composes
the Sleep and Field houses together.

---

## Design system

All tokens live in `src/index.css`.

- **Type** — Cormorant Garamond (display) over Jost (sans), both from Google
  Fonts with system fallbacks. Wide-tracked micro-caps (`.eyebrow`) are the
  connective tissue of every layout.
- **Colour** — a fixed brand scale (`ink`, `ivory`, `olive`, `forest`, `brass`)
  plus semantic tokens (`surface`, `ink`, `muted`, `line`, `accent`) that flip
  between themes via `@theme inline`.
- **Theme** — dark and light are both first-class. The choice is resolved in
  `index.html` before first paint, so there is no flash of the wrong palette.
- **Motion** — one easing curve (`cubic-bezier(0.22, 1, 0.36, 1)`) and long
  durations throughout. Every animated component honours
  `prefers-reduced-motion`.

---

## Not wired up

The **general** enquiry forms have no backend. On submit they log a structured
payload to the console and show a reference number:

```js
console.info('[Canvas Emporium] enquiry', { … })
```

To connect them, replace that call in `src/components/InquiryDrawer.tsx` and
`src/pages/Contact.tsx` with a `fetch` to your endpoint or form service.

Custom tent enquiries are the exception — they are stored and shown in
`/admin/enquiries`. No mail is sent for those either; see the configurator
section above.

Prices are exclusive of GST, freight and installation, and are indicative until
quoted — as stated in the footer and on every trade product page.
