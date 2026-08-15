import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { useCatalogue } from '../../data/catalogue'
import { Monogram } from '../../components/BrandMark'
import { ArrowIcon } from '../../components/icons'

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Pieces' },
  { to: '/admin/enquiries', label: 'Enquiries' },
  { to: '/admin/sections', label: 'Sections' },
  { to: '/admin/houses', label: 'Houses' },
]

/**
 * Admin shell and auth gate.
 *
 * Everything under /admin except the sign-in page renders through here, so
 * there is exactly one place that decides whether a session is good.
 */
export function AdminLayout() {
  const { user, ready, signOut } = useAuth()
  const { products, categories, families, live } = useCatalogue()
  const location = useLocation()

  // Wait for the session check before deciding — otherwise a refresh on an
  // admin page bounces to the login screen for a frame.
  if (!ready) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center">
        <div className="h-px w-40 overflow-hidden bg-line-strong">
          <div className="animate-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent bg-[length:300%_100%]" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="min-h-[100svh] bg-surface">
      <header className="sticky top-0 z-40 border-b bg-surface">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="flex items-center gap-3 text-ink">
              <Monogram className="h-7 w-7 text-accent" />
              <span className="font-display text-lg font-light tracking-[0.14em]">
                CANVAS
              </span>
              <span className="eyebrow eyebrow-accent">Portal</span>
            </Link>

            <nav className="flex items-center gap-6">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `eyebrow transition-colors duration-300 hover:text-accent ${
                      isActive ? 'text-accent' : 'text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden text-[0.68rem] tracking-[0.18em] text-muted uppercase tabular-nums sm:inline">
              {products.length} · {categories.length} · {families.length}
            </span>

            {!live ? (
              <span
                className="text-[0.62rem] tracking-[0.18em] uppercase"
                style={{ color: '#8C4B32' }}
                title="Showing bundled data — the API did not answer."
              >
                Offline
              </span>
            ) : null}

            <Link
              to="/"
              className="flex items-center gap-2 text-[0.66rem] tracking-[0.2em] text-muted uppercase transition-colors hover:text-ink"
            >
              Storefront
              <ArrowIcon className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              className="text-[0.66rem] tracking-[0.2em] text-muted uppercase transition-colors hover:text-ink"
            >
              Sign out — {user.username}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-12 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
