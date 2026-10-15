import { Link, createFileRoute } from '@tanstack/react-router'
import { getBookingFn } from '@/server/functions'

export const Route = createFileRoute('/bookings/$bookingId/confirmed')({
  loader: async ({ params }) => {
    const booking = await getBookingFn({ data: { id: params.bookingId } })
    if (!booking) {
      throw new Error(`Booking not found: ${params.bookingId}`)
    }
    return { booking }
  },
  component: BookingConfirmedComponent,
})

function BookingConfirmedComponent() {
  const { booking } = Route.useLoaderData()

  const checkInStr = new Date(booking.checkIn).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const checkOutStr = new Date(booking.checkOut).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-6">
      {/* Confirmation Success Banner */}
      <div className="p-8 rounded-3xl border border-green-500/30 bg-green-500/10 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[var(--status-success)] text-white text-3xl font-black flex items-center justify-center mx-auto shadow-md">
          ✓
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Reservation Confirmed!
        </h1>
        <p className="text-xs md:text-sm text-[var(--text-muted)] max-w-md mx-auto">
          We have sent your confirmation receipt to{' '}
          <strong className="text-[var(--text-primary)]">
            {booking.guestEmail}
          </strong>
          .
        </p>

        <div className="pt-2">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-mono font-black bg-[var(--bg-surface)] text-[var(--accent-brand)] border border-[var(--border)] shadow-xs">
            #{booking.confirmationCode.replace(/^#/, '')}
          </span>
        </div>
      </div>

      {/* Reservation Receipt Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-6">
        {/* Hotel & Room */}
        <div className="flex gap-4 items-center pb-5 border-b border-[var(--border)]">
          <img
            src={booking.hotel.images[0] || '/images/hotels/photo-01.webp'}
            alt={booking.hotel.name}
            className="w-20 h-20 rounded-xl object-cover bg-neutral-200 dark:bg-neutral-800"
          />
          <div>
            <span className="text-xs font-semibold text-[var(--accent-brand)]">
              ★ {booking.hotel.rating.toFixed(1)} · {booking.hotel.city}
            </span>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {booking.hotel.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {booking.room.name} · {booking.guests}{' '}
              {booking.guests === 1 ? 'guest' : 'guests'}
            </p>
          </div>
        </div>

        {/* Stay Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[var(--text-muted)] block">Check-in</span>
            <span className="font-bold text-sm text-[var(--text-primary)] block mt-0.5">
              {checkInStr}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              From {booking.hotel.checkInTime}
            </span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block">Check-out</span>
            <span className="font-bold text-sm text-[var(--text-primary)] block mt-0.5">
              {checkOutStr}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              By {booking.hotel.checkOutTime}
            </span>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="pt-4 border-t border-[var(--border)] space-y-2 text-xs">
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Payment method</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {booking.paymentBrand} ending in •••• {booking.paymentLast4}
            </span>
          </div>

          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Room subtotal ({booking.nights} nights)</span>
            <span className="font-semibold text-[var(--text-primary)]">
              ${(booking.roomSubtotalCents / 100).toFixed(2)}
            </span>
          </div>

          {booking.rewardDiscountCents > 0 && (
            <div className="flex justify-between text-[var(--status-success)]">
              <span>LikeHome Rewards Discount</span>
              <span className="font-semibold">
                -${(booking.rewardDiscountCents / 100).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Taxes & fees (12%)</span>
            <span className="font-semibold text-[var(--text-primary)]">
              ${(booking.taxesAndFeesCents / 100).toFixed(2)}
            </span>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex justify-between items-baseline font-bold">
            <span className="text-sm text-[var(--text-primary)]">
              Total paid
            </span>
            <span className="text-xl font-black text-[var(--accent-brand)]">
              ${(booking.totalChargeCents / 100).toFixed(2)}
            </span>
          </div>

          <div className="pt-2 flex items-center gap-1.5 text-xs text-[var(--accent-brand)] font-semibold">
            <span>★</span>
            <span>
              {booking.pointsEarned} reward points pending — will be awarded
              upon stay completion!
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/bookings/$bookingId"
          params={{ bookingId: booking.id }}
          className="flex-1 py-3 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white text-center hover:opacity-90 shadow-sm transition-opacity"
        >
          Manage this booking →
        </Link>
        <Link
          to="/my-booking"
          className="flex-1 py-3 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-center hover:border-neutral-400 transition-colors"
        >
          Go to MyBooking list
        </Link>
      </div>
    </div>
  )
}
