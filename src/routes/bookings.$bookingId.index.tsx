import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ChangeStayModal } from '@/components/ChangeStayModal'
import { CancelStayModal } from '@/components/CancelStayModal'
import {
  getBookingFn,
  getCurrentUserFn,
  getHotelByIdFn,
  modifyBookingFn,
  cancelBookingFn,
  completeStayFn,
} from '@/server/functions'

export const Route = createFileRoute('/bookings/$bookingId/')({
  loader: async ({ params }) => {
    const [booking, session] = await Promise.all([
      getBookingFn({ data: { id: params.bookingId } }),
      getCurrentUserFn(),
    ])

    if (!booking) {
      throw new Error(`Reservation #${params.bookingId} not found`)
    }

    const hotel = await getHotelByIdFn({ data: booking.hotelId })

    return {
      booking,
      hotel,
      user: session?.user || null,
    }
  },
  component: BookingDetailComponent,
})

function BookingDetailComponent() {
  const { booking, hotel, user } = Route.useLoaderData()
  const router = useRouter()

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isOwner = user?.id === booking.userId
  const isUpcoming = booking.status === 'UPCOMING'
  const isCompleted = booking.status === 'COMPLETED'
  const isCancelled = booking.status === 'CANCELLED'

  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)

  const checkInStr = checkInDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const checkOutStr = checkOutDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Format ISO date strings for date inputs YYYY-MM-DD
  const formatInputDate = (d: Date) => d.toISOString().split('T')[0]

  const handleModifyStay = async (data: {
    roomId: string
    checkIn: string
    checkOut: string
    guests: number
  }) => {
    await modifyBookingFn({
      data: {
        bookingId: booking.id,
        ...data,
      },
    })
    setMessage('Stay details updated successfully!')
    router.invalidate()
  }

  const handleCancelStay = async (simulateLateFee: boolean) => {
    await cancelBookingFn({
      data: {
        bookingId: booking.id,
        simulateLateFee,
      },
    })
    setMessage('Reservation cancelled. Refund has been initiated.')
    router.invalidate()
  }

  const handleCompleteStay = async () => {
    setIsCompleting(true)
    try {
      await completeStayFn({ data: booking.id })
      setMessage(
        `Stay completed! +${booking.pointsEarned} reward points awarded!`,
      )
      router.invalidate()
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <Link to="/my-booking" className="hover:text-[var(--text-primary)]">
            ← MyBooking
          </Link>
          <span>/</span>
          <span className="font-mono text-[var(--text-primary)]">
            #{booking.confirmationCode.replace(/^#/, '')}
          </span>
        </div>

        <span
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold ${
            isUpcoming
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              : isCompleted
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}
        >
          {booking.status}
        </span>
      </div>

      {message && (
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/10 text-xs font-bold text-[var(--status-success)]">
          ✓ {message}
        </div>
      )}

      {/* Main Reservation Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-6">
        {/* Hotel & Room Banner */}
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between pb-6 border-b border-[var(--border)]">
          <div className="flex gap-4 items-center">
            <img
              src={booking.hotel.images[0] || '/images/hotels/photo-01.webp'}
              alt={booking.hotel.name}
              className="w-24 h-24 rounded-2xl object-cover bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-[var(--accent-brand)]">
                ★ {booking.hotel.rating.toFixed(1)} · {booking.hotel.city}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">
                {booking.hotel.name}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                📍 {booking.hotel.address}
              </p>
              <p className="text-xs font-bold text-[var(--text-primary)] mt-1.5">
                {booking.room.name}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-mono text-[var(--text-muted)] block">
              Confirmation Code
            </span>
            <span className="text-lg font-mono font-black text-[var(--accent-brand)] block mt-0.5">
              #{booking.confirmationCode.replace(/^#/, '')}
            </span>
          </div>
        </div>

        {/* Dates & Guest Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-[var(--text-muted)] block uppercase font-bold text-[10px] tracking-wider">
              Check-in
            </span>
            <span className="font-bold text-sm text-[var(--text-primary)] block mt-1">
              {checkInStr}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              From {booking.hotel.checkInTime}
            </span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block uppercase font-bold text-[10px] tracking-wider">
              Check-out
            </span>
            <span className="font-bold text-sm text-[var(--text-primary)] block mt-1">
              {checkOutStr}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              By {booking.hotel.checkOutTime}
            </span>
          </div>

          <div>
            <span className="text-[var(--text-muted)] block uppercase font-bold text-[10px] tracking-wider">
              Stay Details
            </span>
            <span className="font-bold text-sm text-[var(--text-primary)] block mt-1">
              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'} ·{' '}
              {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Guest: {booking.guestName}
            </span>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="pt-4 border-t border-[var(--border)] text-xs">
            <span className="font-bold text-[var(--text-muted)] block uppercase text-[10px] tracking-wider">
              Special Requests
            </span>
            <p className="text-[var(--text-primary)] mt-1 italic">
              "{booking.specialRequests}"
            </p>
          </div>
        )}

        {/* Itemized Payment Receipt */}
        <div className="pt-6 border-t border-[var(--border)] space-y-2.5 text-xs">
          <h3 className="font-bold text-sm text-[var(--text-primary)] mb-2">
            Itemized Receipt
          </h3>

          <div className="flex justify-between text-[var(--text-muted)]">
            <span>
              Room Rate (${(booking.roomRateCents / 100).toFixed(0)} ×{' '}
              {booking.nights} nights)
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              ${(booking.roomSubtotalCents / 100).toFixed(2)}
            </span>
          </div>

          {booking.rewardDiscountCents > 0 && (
            <div className="flex justify-between text-[var(--status-success)]">
              <span>LikeHome Rewards Free Night Discount</span>
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
              Total charge
            </span>
            <span className="text-xl font-black text-[var(--accent-brand)]">
              ${(booking.totalChargeCents / 100).toFixed(2)}
            </span>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-1 flex justify-between">
            <span>Payment method</span>
            <span className="font-medium text-[var(--text-primary)]">
              {booking.paymentBrand} •••• {booking.paymentLast4}
            </span>
          </div>

          {/* Cancellation Info if cancelled */}
          {isCancelled && (
            <div className="mt-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-1">
              <span className="font-bold text-[var(--status-error)] block">
                Stay Cancelled on{' '}
                {booking.cancelledAt
                  ? new Date(booking.cancelledAt).toLocaleDateString()
                  : 'N/A'}
              </span>
              <div className="flex justify-between text-xs">
                <span>Cancellation fee:</span>
                <span className="font-semibold">
                  ${((booking.cancellationFeeCents || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[var(--status-success)]">
                <span>Refund amount:</span>
                <span>
                  ${((booking.refundAmountCents || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Points Status */}
          <div className="pt-2 flex items-center gap-1.5 text-xs text-[var(--accent-brand)] font-semibold">
            <span>★</span>
            <span>
              {isCompleted
                ? `+${booking.pointsEarned} reward points earned and credited to balance!`
                : isCancelled
                  ? 'Points reversed/refunded upon cancellation.'
                  : `+${booking.pointsEarned} reward points pending — will be awarded upon stay completion.`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel (Upcoming bookings) */}
      {isUpcoming && isOwner && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Manage Reservation
          </h2>

          <div className="flex flex-wrap gap-3">
            {/* Change Stay */}
            <button
              type="button"
              onClick={() => setIsChangeModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer"
            >
              Change stay (dates / room / guests)
            </button>

            {/* Complete Stay Demo Button (LH-12) */}
            <button
              type="button"
              disabled={isCompleting}
              onClick={handleCompleteStay}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--status-success)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isCompleting
                ? 'Completing...'
                : 'Complete stay (award points) [Demo]'}
            </button>

            {/* Cancel Stay */}
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[var(--status-error)] text-[var(--status-error)] hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Cancel reservation
            </button>
          </div>
        </div>
      )}

      {/* Change Stay Modal */}
      {hotel && (
        <ChangeStayModal
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          onSave={handleModifyStay}
          availableRooms={hotel.rooms.map((r) => ({
            id: r.id,
            name: r.name,
            maxGuests: r.maxGuests,
            nightlyRateCents: r.nightlyRateCents,
          }))}
          currentRoomId={booking.roomId}
          initialCheckIn={formatInputDate(checkInDate)}
          initialCheckOut={formatInputDate(checkOutDate)}
          initialGuests={booking.guests}
        />
      )}

      {/* Cancel Stay Modal */}
      <CancelStayModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleCancelStay}
        booking={booking}
      />
    </div>
  )
}
