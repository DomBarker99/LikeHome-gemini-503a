import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  getCurrentUserFn,
  getUserBookingsFn,
  getBookingFn,
} from '@/server/functions'

export const Route = createFileRoute('/my-booking')({
  loader: async () => {
    const [session, bookings] = await Promise.all([
      getCurrentUserFn(),
      getUserBookingsFn(),
    ])
    return {
      user: session?.user || null,
      bookings,
    }
  },
  component: MyBookingComponent,
})

function MyBookingComponent() {
  const { user, bookings } = Route.useLoaderData()
  const navigate = useNavigate()

  const [lookupCode, setLookupCode] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  >('ALL')

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupError(null)
    const clean = lookupCode.trim()
    if (!clean) return

    setIsLookingUp(true)
    try {
      const found = await getBookingFn({ data: { code: clean } })
      if (!found) {
        setLookupError(`No reservation found matching code "${clean}"`)
        return
      }
      navigate({
        to: '/bookings/$bookingId',
        params: { bookingId: found.id },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setLookupError(msg)
    } finally {
      setIsLookingUp(false)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true
    return b.status === statusFilter
  })

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          MyBooking Lookup & Reservations
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Look up a reservation by confirmation code or manage your stay history
        </p>
      </div>

      {/* Confirmation Code Quick Lookup Card */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Look Up Single Reservation
        </h2>
        <form
          onSubmit={handleLookup}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            placeholder="Enter confirmation code (e.g. #LH-20481)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
          />
          <button
            type="submit"
            disabled={isLookingUp}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isLookingUp ? 'Searching...' : 'Find Reservation'}
          </button>
        </form>

        {lookupError && (
          <p className="text-xs font-semibold text-[var(--status-error)]">
            ⚠️ {lookupError}
          </p>
        )}
      </div>

      {/* Bookings List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Your Reservations ({filteredBookings.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[var(--accent)] text-white dark:text-black dark:bg-white shadow-xs'
                      : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ),
            )}
          </div>
        </div>

        {!user ? (
          <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
            <span className="text-2xl block">🔒</span>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Sign in to view your complete booking history
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Guests can always look up individual reservations above with their
              confirmation code.
            </p>
            <Link
              to="/sign-in"
              className="inline-block mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 transition-opacity"
            >
              Sign in now
            </Link>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              No reservations in this view
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Book a hotel from our catalog of 3,000 stays to start earning
              rewards!
            </p>
            <Link
              to="/"
              className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 transition-opacity"
            >
              Explore hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const d1 = new Date(b.checkIn).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              const d2 = new Date(b.checkOut).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs hover:border-neutral-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={b.hotel.images[0] || '/images/hotels/photo-01.webp'}
                      alt={b.hotel.name}
                      className="w-16 h-16 rounded-xl object-cover bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[var(--accent-brand)]">
                          #{b.confirmationCode.replace(/^#/, '')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'UPCOMING'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : b.status === 'COMPLETED'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        {b.hotel.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {b.room.name} · {d1} – {d2} ({b.nights}{' '}
                        {b.nights === 1 ? 'night' : 'nights'})
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <div className="text-left md:text-right">
                      <span className="text-base font-black text-[var(--text-primary)]">
                        ${(b.totalChargeCents / 100).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {b.paymentBrand} •••• {b.paymentLast4}
                      </span>
                    </div>

                    <Link
                      to="/bookings/$bookingId"
                      params={{ bookingId: b.id }}
                      className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white dark:text-black dark:bg-white hover:opacity-90 shadow-xs transition-opacity"
                    >
                      Open reservation →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
