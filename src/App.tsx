import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { CartDrawer } from './components/CartDrawer'
import { FloatingInquiry } from './components/FloatingInquiry'
import { Footer } from './components/Footer'
import { InquiryDrawer } from './components/InquiryDrawer'
import { Loader } from './components/Loader'
import { Navbar } from './components/Navbar'
import { ScrollProgress } from './components/ScrollProgress'
import { SearchOverlay } from './components/SearchOverlay'
import { WishlistDrawer } from './components/WishlistDrawer'
import { PageTransition } from './components/motion/PageTransition'
import { Home } from './pages/Home'

// Home is eager — everything else splits, so the first paint carries only the
// hero and its dependencies.
const Collections = lazy(() =>
  import('./pages/Collections').then((m) => ({ default: m.Collections })),
)
const FamilyPage = lazy(() =>
  import('./pages/FamilyPage').then((m) => ({ default: m.FamilyPage })),
)
const CategoryPage = lazy(() =>
  import('./pages/CategoryPage').then((m) => ({ default: m.CategoryPage })),
)
const Product = lazy(() =>
  import('./pages/Product').then((m) => ({ default: m.Product })),
)
const Craftsmanship = lazy(() =>
  import('./pages/Craftsmanship').then((m) => ({ default: m.Craftsmanship })),
)
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Contact = lazy(() =>
  import('./pages/Contact').then((m) => ({ default: m.Contact })),
)
// The configurator carries three.js with it, so it must never be part of any
// other chunk.
const CreateTent = lazy(() =>
  import('./pages/CreateTent').then((m) => ({ default: m.CreateTent })),
)
const Cart = lazy(() => import('./pages/Cart').then((m) => ({ default: m.Cart })))
const Checkout = lazy(() =>
  import('./pages/Checkout').then((m) => ({ default: m.Checkout })),
)
const OrderConfirmation = lazy(() =>
  import('./pages/OrderConfirmation').then((m) => ({ default: m.OrderConfirmation })),
)
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
)

// The admin portal is a separate application sharing the same bundle. None of
// it is fetched until someone visits /admin.
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })),
)
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const AdminProducts = lazy(() =>
  import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })),
)
const AdminProductEditor = lazy(() =>
  import('./pages/admin/AdminProductEditor').then((m) => ({
    default: m.AdminProductEditor,
  })),
)
const AdminEnquiries = lazy(() =>
  import('./pages/admin/AdminEnquiries').then((m) => ({ default: m.AdminEnquiries })),
)
const AdminHouses = lazy(() =>
  import('./pages/admin/AdminTaxonomy').then((m) => ({ default: m.AdminHouses })),
)
const AdminSections = lazy(() =>
  import('./pages/admin/AdminTaxonomy').then((m) => ({ default: m.AdminSections })),
)

/** Holds the viewport while a split chunk arrives. */
function RouteFallback() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center">
      <div className="h-px w-40 overflow-hidden bg-line-strong">
        <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-accent to-transparent bg-[length:300%_100%]" />
      </div>
    </div>
  )
}

export default function App() {
  // The portal has its own shell — no storefront chrome, no entry curtain, no
  // floating enquiry button.
  const isAdmin = useLocation().pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductEditor />} />
            <Route path="products/:sku" element={<AdminProductEditor />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="sections" element={<AdminSections />} />
            <Route path="houses" element={<AdminHouses />} />
          </Route>
        </Routes>
      </Suspense>
    )
  }

  return (
    <>
      <Loader />
      <ScrollProgress />
      <Navbar />

      <main id="main">
        <PageTransition>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:slug" element={<FamilyPage />} />
              <Route path="/catalogue/:slug" element={<CategoryPage />} />
              <Route path="/product/:sku" element={<Product />} />
              <Route path="/craftsmanship" element={<Craftsmanship />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/create-tent" element={<CreateTent />} />
              <Route path="/create-tent/:id" element={<CreateTent />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:id" element={<OrderConfirmation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </main>

      <Footer />

      <SearchOverlay />
      <CartDrawer />
      <WishlistDrawer />
      <InquiryDrawer />
      <FloatingInquiry />
    </>
  )
}
