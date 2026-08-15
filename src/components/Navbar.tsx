import { useEffect, useState } from 'react'
import { useCatalogue } from '../data/catalogue'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/cart'
import { useTheme } from '../context/theme'
import { useUI } from '../context/ui'
import { useWishlist } from '../context/wishlist'
import { MegaMenu } from './MegaMenu'
import { Monogram, Wordmark } from './BrandMark'
import {
  BagIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from './icons'

const PRIMARY = [
  { label: 'Tents', to: '/collections/tents' },
  { label: 'Travel', to: '/collections/bags' },
  { label: 'Sleep & Field', to: '/collections/sleeping' },
  { label: 'Craftsmanship', to: '/craftsmanship' },
  { label: 'Atelier', to: '/collections/atelier' },
  { label: 'Create Your Tent', to: '/create-tent', accent: true },
]

export function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const { open, openInquiry } = useUI()
  const { count } = useWishlist()
  const { count: cartCount } = useCart()
  const { pathname } = useLocation()

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 24)
  })

  // Any navigation closes whatever was open. Adjusted during render rather
  // than in an effect, so the menu is already gone on the first paint of the
  // new route instead of flashing over it for a frame.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMegaOpen(false)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  return (
    <>
      {/* Page scrim behind the open menu. Sits below the header's z-50 so the
          bar and its panel stay clear of it. */}
      <AnimatePresence>
        {megaOpen ? (
          <motion.div
            key="mega-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 hidden bg-ink-950/45 lg:block"
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 ${
          megaOpen
            ? // Solid while the menu is down — the panel below it is opaque, so
              // a translucent bar here would be the one place text bled through.
              'border-b bg-surface'
            : scrolled
              ? 'glass border-b'
              : 'border-b border-transparent bg-transparent'
        }`}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-8 px-5 lg:h-[86px] lg:px-10">
          {/* Left — brand */}
          <Link
            to="/"
            className="flex items-center gap-3 text-ink transition-opacity duration-500 hover:opacity-70"
            aria-label="Canvas Emporium — home"
          >
            <Monogram className="h-7 w-7 text-accent lg:h-8 lg:w-8" />
            <Wordmark className="hidden text-[0.95rem] sm:flex" />
          </Link>

          {/* Centre — primary navigation */}
          <nav className="hidden items-center gap-9 lg:flex">
            <button
              type="button"
              onMouseEnter={() => setMegaOpen(true)}
              onClick={() => setMegaOpen((v) => !v)}
              className="eyebrow text-ink transition-colors duration-400 hover:text-accent"
              aria-expanded={megaOpen}
            >
              Collections
            </button>

            {PRIMARY.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onMouseEnter={() => setMegaOpen(false)}
                className={({ isActive }) =>
                  `eyebrow link-draw transition-colors duration-400 hover:text-accent ${
                    isActive || item.accent ? 'text-accent' : 'text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right — utilities */}
          <div className="flex items-center gap-1.5 lg:gap-3">
            <button
              type="button"
              onClick={() => open('search')}
              className="p-2.5 text-ink transition-colors duration-400 hover:text-accent"
              aria-label="Search the catalogue"
            >
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => open('wishlist')}
              className="relative p-2.5 text-ink transition-colors duration-400 hover:text-accent"
              aria-label={`Saved pieces (${count})`}
            >
              <HeartIcon className="h-[18px] w-[18px]" filled={count > 0} />
              {count > 0 ? (
                <motion.span
                  key={count}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.55rem] font-medium text-surface tabular-nums"
                >
                  {count}
                </motion.span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => open('cart')}
              className="relative p-2.5 text-ink transition-colors duration-400 hover:text-accent"
              aria-label={`Your bag (${cartCount} ${cartCount === 1 ? 'unit' : 'units'})`}
            >
              <BagIcon className="h-[18px] w-[18px]" />
              {cartCount > 0 ? (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.55rem] font-medium text-surface tabular-nums"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={toggle}
              className="p-2.5 text-ink transition-colors duration-400 hover:text-accent"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="block"
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-[18px] w-[18px]" />
                  ) : (
                    <MoonIcon className="h-[18px] w-[18px]" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => openInquiry()}
              className="btn-luxe ml-2 hidden px-6! py-2.5! lg:inline-flex"
            >
              Enquire
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2.5 text-ink lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {megaOpen ? <MegaMenu onNavigate={() => setMegaOpen(false)} /> : null}
        </AnimatePresence>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categoriesOf, families } = useCatalogue()
  const { openInquiry } = useUI()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] bg-surface lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex h-[72px] items-center justify-between px-5">
            <Wordmark className="text-[0.95rem]" />
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-ink"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="h-[calc(100dvh-72px)] overflow-y-auto px-5 pt-4 pb-16">
            {families.map((family, index) => (
              <motion.div
                key={family.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.06 + index * 0.045 }}
                className="border-b py-6"
              >
                <Link
                  to={`/collections/${family.slug}`}
                  onClick={onClose}
                  className="flex items-baseline justify-between"
                >
                  <span className="font-display text-3xl font-light">{family.name}</span>
                  <span className="eyebrow">{family.kicker}</span>
                </Link>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  {categoriesOf(family.id).map((category) => (
                    <Link
                      key={category.id}
                      to={`/catalogue/${category.slug}`}
                      onClick={onClose}
                      className="text-[0.8rem] font-light text-muted"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}

            <div className="mt-8 flex flex-col gap-3">
              <Link to="/create-tent" onClick={onClose} className="btn-luxe btn-solid">
                Create Your Tent
              </Link>
              <Link to="/craftsmanship" onClick={onClose} className="btn-luxe">
                Craftsmanship
              </Link>
              <Link to="/about" onClick={onClose} className="btn-luxe">
                About
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  openInquiry()
                }}
                className="btn-luxe btn-solid"
              >
                Dealer Enquiry
              </button>
            </div>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
