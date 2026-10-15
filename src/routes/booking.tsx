import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { OverlappingStayModal } from '@/components/OverlappingStayModal'
import {
  getCurrentUserFn,
  getHotelByIdFn,
  checkOverlapFn,
  createBookingFn,
  getUserProfileFn,
} from '@/server/functions'

interface BookingSearchParams {
  hotelId: string
  roomId: string
  checkIn: string
  checkOut: string
  guests?: number
}

export const Route = createFileRoute('/booking')({
  validateSearch: (search: Record<string, unknown>): BookingSearchParams => ({
    hotelId: (search.hotelId as string) || '',
    roomId: (search.roomId as string) || '',
    checkIn: (search.checkIn as string) || '2026-11-10',
    checkOut: (search.checkOut as string) || '2026-11-14',
    guests: search.guests ? Number(search.guests) : 2,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, location }) => {
    const session = await getCurrentUserFn()
    if (!session?.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirectTo: location.href,
        },
      })
    }

    const [hotel, userProfile] = await Promise.all([
      getHotelByIdFn({ data: deps.hotelId }),
      getUserProfileFn(),
    ])

    if (!hotel) {
      throw new Error(`Hotel not found: ${deps.hotelId}`)
    }

    const room = hotel.rooms.find((r) => r.id === deps.roomId) || hotel.rooms[0]

    return {
      user: session.user,
      userProfile,
      hotel,
      room,
      checkIn: deps.checkIn,
      checkOut: deps.checkOut,
      guests: deps.guests || 2,
    }
  },
  component: BookingCheckoutComponent,
})

function BookingCheckoutComponent() {
  const { user, userProfile, hotel, room, checkIn, checkOut, guests } =
    Route.useLoaderData()
  const navigate = useNavigate()

  // Form states
  const [guestName, setGuestName] = useState(user.name || '')
  const [guestEmail, setGuestEmail] = useState(user.email || '')
  const [guestPhone, setGuestPhone] = useState(user.phone || '(555) 234-5678')
  const [specialRequests, setSpecialRequests] = useState('')

  // Rewards redemption
  const [pointsToRedeem, setPointsToRedeem] = useState(0)

  // Payment states
  const savedCards = userProfile?.savedCards || []
  const [useSavedCard, setUseSavedCard] = useState(savedCards.length > 0)
  const [selectedCardId, setSelectedCardId] = useState(savedCards[0]?.id || '')
  const [cardholderName, setCardholderName] = useState(user.name || '')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [brand, setBrand] = useState('VISA')
  const [expMonth, setExpMonth] = useState(8)
  const [expYear, setExpYear] = useState(2029)
  const [saveCard, setSaveCard] = useState(true)

  // Overlap conflict state (LH-08)
  const [overlapConflict, setOverlapConflict] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculations
  const diffTime = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)))
  const userRewardPoints = user.rewardPoints || 0
  const maxRedeemableNights = Math.min(
    nights,
    Math.floor(userRewardPoints / 1000),
  )

  const roomSubtotalCents = nights * room.nightlyRateCents
  const freeNights = Math.floor(pointsToRedeem / 1000)
  const rewardDiscountCents = freeNights * room.nightlyRateCents
  const taxableSubtotal = Math.max(0, roomSubtotalCents - rewardDiscountCents)
  const taxesAndFeesCents = Math.round(taxableSubtotal * 0.12)
  const totalChargeCents = taxableSubtotal + taxesAndFeesCents
  const pointsToEarn = nights * 100

  const handleConfirmAndPay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Step 1: Pre-check overlapping stay rule LH-08
      const overlap = await checkOverlapFn({
        data: {
          checkIn,
          checkOut,
        },
      })

      if (overlap.hasOverlap && overlap.conflictingBooking) {
        setOverlapConflict(overlap.conflictingBooking)
        setIsSubmitting(false)
        return
      }

      // Determine payment card metadata
      let paymentBrand = 'VISA'
      let paymentLast4 = '4242'
      let savedCardPayload = undefined

      if (useSavedCard && selectedCardId) {
        const c = savedCards.find((sc) => sc.id === selectedCardId)
        if (c) {
          paymentBrand = c.brand
          paymentLast4 = c.last4
        }
      } else {
        paymentBrand = brand.toUpperCase()
        const clean = cardNumber.replace(/\D/g, '')
        paymentLast4 = clean.slice(-4) || '4242'
        if (saveCard) {
          savedCardPayload = {
            cardholderName,
            brand: paymentBrand,
            last4: paymentLast4,
            expMonth,
            expYear,
          }
        }
      }

      // Step 2: Create booking
      const newBooking = await createBookingFn({
        data: {
          hotelId: hotel.id,
          roomId: room.id,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests: specialRequests.trim() || undefined,
          paymentBrand,
          paymentLast4,
          pointsToRedeem,
          savedCardData: savedCardPayload,
        },
      })

      navigate({
        to: '/bookings/$bookingId/confirmed',
        params: { bookingId: newBooking.id },
      })
    } catch (err: any) {
      if (err?.overlap?.hasOverlap) {
        setOverlapConflict(err.overlap.conflictingBooking)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Confirm and Pay
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Review your reservation details and complete booking
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-semibold text-[var(--status-error)]">
          {error}
        </div>
      )}

      <form
        onSubmit={handleConfirmAndPay}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Column: Guest Info & Payment Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Guest Information */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-brand)] text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Guest information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Email for confirmation
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Special requests (optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="e.g. Quiet room away from elevator, feather-free pillows"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                />
              </div>
            </div>
          </div>

          {/* LikeHome Rewards Redemption Card */}
          <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">★</span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    LikeHome Rewards Redemption
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    1,000 points = 1 free room night
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--text-muted)] block">
                  Your Balance
                </span>
                <span className="text-base font-black text-[var(--accent-brand)]">
                  {userRewardPoints.toLocaleString()} pts
                </span>
              </div>
            </div>

            {maxRedeemableNights > 0 ? (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Redeem points for free room nights:
                </label>
                <select
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)] cursor-pointer"
                >
                  <option value={0}>Do not redeem points ($0 discount)</option>
                  {Array.from(
                    { length: maxRedeemableNights },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <option key={n} value={n * 1000}>
                      Redeem {n * 1000} pts ({n}{' '}
                      {n === 1 ? 'free night' : 'free nights'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] pt-1">
                You need at least 1,000 points to redeem a free night. This stay
                will earn you +{pointsToEarn} points upon completion!
              </p>
            )}
          </div>

          {/* Step 2: Payment Details */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-brand)] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Payment details</span>
            </h2>

            {/* Saved card or New Card toggle */}
            {savedCards.length > 0 && (
              <div className="flex gap-4 pb-2 border-b border-[var(--border)]">
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="cardChoice"
                    checked={useSavedCard}
                    onChange={() => setUseSavedCard(true)}
                    className="text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                  />
                  <span>Use saved card</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="cardChoice"
                    checked={!useSavedCard}
                    onChange={() => setUseSavedCard(false)}
                    className="text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                  />
                  <span>Enter new card</span>
                </label>
              </div>
            )}

            {useSavedCard && savedCards.length > 0 ? (
              <div className="space-y-2.5">
                {savedCards.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedCardId === c.id
                        ? 'border-[var(--accent-brand)] bg-purple-500/5'
                        : 'border-[var(--border)] hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="savedCard"
                        value={c.id}
                        checked={selectedCardId === c.id}
                        onChange={() => setSelectedCardId(c.id)}
                        className="text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[var(--text-primary)] block">
                          {c.brand} ending in •••• {c.last4}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] block">
                          {c.cardholderName} · Exp {c.expMonth}/{c.expYear}
                        </span>
                      </div>
                    </div>
                    {c.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-muted)]">
                        Default
                      </span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Cardholder name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    required
                    placeholder="Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Card brand
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)] cursor-pointer"
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                    <option value="DISCOVER">Discover</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Card number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    placeholder="4242 •••• •••• 4242"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Expiration Month
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={expMonth}
                    onChange={(e) => setExpMonth(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Expiration Year
                  </label>
                  <input
                    type="number"
                    min={2026}
                    max={2040}
                    value={expYear}
                    onChange={(e) => setExpYear(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
                  />
                </div>

                <div className="md:col-span-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                    />
                    <span>Save card for future stays</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Stay Summary & Price Breakdown */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-5">
            {/* Hotel thumbnail & info */}
            <div className="flex gap-3.5 items-center pb-4 border-b border-[var(--border)]">
              <img
                src={hotel.images[0] || '/images/hotels/photo-01.webp'}
                alt={hotel.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[var(--accent-brand)] block">
                  ★ {hotel.rating.toFixed(1)} · {hotel.city}
                </span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {hotel.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {room.name}
                </p>
              </div>
            </div>

            {/* Stay Dates */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Check-in</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {checkIn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Check-out</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {checkOut}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Duration</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {nights} {nights === 1 ? 'night' : 'nights'} · {guests}{' '}
                  {guests === 1 ? 'guest' : 'guests'}
                </span>
              </div>
            </div>

            {/* Price Itemized Breakdown */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>
                  ${(room.nightlyRateCents / 100).toFixed(0)} × {nights}{' '}
                  {nights === 1 ? 'night' : 'nights'}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  ${(roomSubtotalCents / 100).toFixed(2)}
                </span>
              </div>

              {rewardDiscountCents > 0 && (
                <div className="flex justify-between text-[var(--status-success)] font-medium">
                  <span>Rewards Free Night ({freeNights})</span>
                  <span>-${(rewardDiscountCents / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Taxes & fees (12%)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  ${(taxesAndFeesCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-between items-baseline font-bold">
                <span className="text-sm text-[var(--text-primary)]">
                  Total due
                </span>
                <span className="text-2xl font-black text-[var(--accent-brand)]">
                  ${(totalChargeCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 text-[11px] text-[var(--accent-brand)] flex items-center gap-1 font-semibold">
                <span>★</span>
                <span>You will earn +{pointsToEarn} points on this stay</span>
              </div>
            </div>

            {/* Confirm & Pay Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-[var(--accent-brand)] hover:opacity-90 text-white shadow-md transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming stay...' : 'Confirm and pay'}
              </button>
            </div>
          </div>
        </aside>
      </form>

      {/* Screen 8: Overlapping Stay Popup Modal (LH-08) */}
      <OverlappingStayModal
        isOpen={Boolean(overlapConflict)}
        onClose={() => setOverlapConflict(null)}
        conflict={overlapConflict}
      />
    </div>
  )
}
