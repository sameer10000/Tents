import { useMemo } from 'react'
import { useCatalogue } from '../data/catalogue'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ProductImage } from '../components/ProductImage'
import { Reveal } from '../components/motion/Reveal'
import { ArrowIcon, CheckIcon } from '../components/icons'
import { formatPrice } from '../lib/format'
import { estimateDelivery, findOrder } from '../lib/order'

export function OrderConfirmation() {
  const { productBySku } = useCatalogue()
  const { id = '' } = useParams()
  const order = useMemo(() => findOrder(id), [id])

  if (!order) {
    return (
      <>
        <PageHeader
          eyebrow="Order"
          title="We cannot find"
          subtitle="that reference."
          blurb="Order records are kept in this browser. If you have cleared your data, or opened the link elsewhere, the reference will not resolve here."
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Order' }]}
        />
        <section className="py-24">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
            <Link to="/collections" className="btn-luxe">
              Back to the catalogue
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </>
    )
  }

  const placed = new Date(order.placedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="pt-[104px] lg:pt-[128px]">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
        {/* Confirmation */}
        <header className="border-b py-16 lg:py-24">
          <Reveal from="none">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent text-accent">
              <CheckIcon className="h-6 w-6" />
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="eyebrow eyebrow-accent mt-8">Order {order.id}</p>
            <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2.4rem,5.5vw,4.4rem)] leading-[1] font-light">
              Thank you. Your order is placed.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-7 max-w-[54ch] text-sm leading-[1.9] font-light text-muted lg:text-base">
              A confirmation has been sent to{' '}
              <span className="text-ink">{order.customer.email}</span>. Estimated arrival
              is <span className="text-ink">{estimateDelivery(order.delivery)}</span>.
              Keep the reference above for any correspondence about this order.
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            <p className="mt-6 max-w-[54ch] border-l-2 border-accent pl-4 text-[0.76rem] leading-relaxed font-light text-muted">
              No payment was taken — this build has no processor connected. The order is
              recorded in this browser so the flow can be reviewed end to end.
            </p>
          </Reveal>
        </header>

        {/* Detail */}
        <div className="grid gap-14 py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
          <div className="lg:col-span-7">
            <p className="eyebrow eyebrow-accent">
              {order.lines.length} {order.lines.length === 1 ? 'piece' : 'pieces'}
            </p>

            <ul className="mt-8 border-t">
              {order.lines.map((line, index) => {
                const product = productBySku.get(line.sku)
                return (
                  <Reveal key={line.sku} delay={index * 0.05}>
                    <li className="flex gap-5 border-b py-6">
                      <Link
                        to={`/product/${line.sku}`}
                        className="relative h-24 w-20 shrink-0 overflow-hidden"
                      >
                        {product ? <ProductImage product={product} /> : null}
                      </Link>

                      <div className="flex min-w-0 flex-1 items-start justify-between gap-5">
                        <div>
                          <Link
                            to={`/product/${line.sku}`}
                            className="link-draw font-display text-xl leading-snug font-light"
                          >
                            {line.name}
                          </Link>
                          <p className="eyebrow mt-2">{line.sku}</p>
                          <p className="mt-2 text-[0.76rem] font-light text-muted tabular-nums">
                            {line.qty} × {formatPrice(line.unitPrice)}
                          </p>
                        </div>
                        <span className="shrink-0 font-display text-xl font-light tabular-nums">
                          {formatPrice(line.lineTotal)}
                        </span>
                      </div>
                    </li>
                  </Reveal>
                )
              })}
            </ul>

            <div className="mt-12 grid gap-10 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Delivering to</p>
                <address className="mt-4 space-y-0.5 text-sm leading-relaxed font-light text-muted not-italic">
                  <span className="block text-ink">{order.customer.name}</span>
                  <span className="block">{order.customer.address}</span>
                  <span className="block">
                    {order.customer.city}, {order.customer.state} {order.customer.pincode}
                  </span>
                  <span className="block">{order.customer.phone}</span>
                  {order.customer.gstin ? (
                    <span className="block pt-2">GSTIN {order.customer.gstin}</span>
                  ) : null}
                </address>
              </div>

              <div>
                <p className="eyebrow">Order details</p>
                <dl className="mt-4 space-y-2 text-sm font-light text-muted">
                  <div className="flex justify-between gap-6">
                    <dt>Placed</dt>
                    <dd className="text-ink">{placed}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt>Delivery</dt>
                    <dd className="text-ink capitalize">{order.delivery}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt>Payment</dt>
                    <dd className="text-ink">{order.paymentMethod}</dd>
                  </div>
                </dl>
                {order.customer.notes ? (
                  <p className="mt-5 text-[0.76rem] leading-relaxed font-light text-muted">
                    <span className="eyebrow block">Notes</span>
                    <span className="mt-2 block">{order.customer.notes}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="border p-7 lg:sticky lg:top-32">
              <p className="eyebrow eyebrow-accent">Summary</p>

              <dl className="mt-7 space-y-3.5 text-sm font-light">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(order.totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="tabular-nums">
                    {order.totals.shipping === 0
                      ? 'Free'
                      : formatPrice(order.totals.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">GST (18%)</dt>
                  <dd className="tabular-nums">{formatPrice(order.totals.gst)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t pt-4">
                  <dt className="eyebrow">Paid</dt>
                  <dd className="font-display text-3xl font-light tabular-nums">
                    {formatPrice(order.totals.total)}
                  </dd>
                </div>
              </dl>

              <Link to="/collections" className="btn-luxe mt-8 w-full">
                Continue browsing
                <ArrowIcon className="h-4 w-4" />
              </Link>

              <p className="mt-6 text-[0.7rem] leading-relaxed font-light text-muted">
                Questions about this order? Quote reference {order.id} to{' '}
                <a href="mailto:studio@canvasemporium.in" className="link-draw text-ink">
                  studio@canvasemporium.in
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
