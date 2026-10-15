import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { SearchBar } from '@/components/SearchBar'
import { MapPreviewCard } from '@/components/MapPreviewCard'
import { getHotelByIdFn } from '@/server/functions'

interface HotelSearchParams {
  checkIn?: string
  checkOut?: string
  guests?: number
}

export const Route = createFileRoute('/hotels/$hotelId')({
  validateSearch: (search: Record<string, unknown>): HotelSearchParams => ({
    checkIn: (search.checkIn as string) || '2026-11-10',
    checkOut: (search.checkOut as string) || '2026-11-14',
    guests: search.guests ? Number(search.guests) : 2,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const hotel = await getHotelByIdFn({ data: params.hotelId })
    if (!hotel) {
      throw new Error(`Hotel not found: ${params.hotelId}`)
    }
    return {
      hotel,
      checkIn: deps.checkIn || '2026-11-10',
      checkOut: deps.checkOut || '2026-11-14',
      guests: deps.guests || 2,
    }
  },
  component: HotelDetailComponent,
})

function HotelDetailComponent() {
  const { hotel, checkIn, checkOut, guests } = Route.useLoaderData()

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [secondaryPhotoIndex, setSecondaryPhotoIndex] = useState(1)
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    hotel.rooms[0]?.id || '',
  )

  const selectedRoom =
    hotel.rooms.find((r) => r.id === selectedRoomId) || hotel.rooms[0]

  // Calculate nights & pricing
  let nights = 1
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    nights = Math.max(
      1,
      Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
    )
  }

  const roomSubtotal = selectedRoom.nightlyRateCents * nights
  const taxesAndFees = Math.round(roomSubtotal * 0.12)
  const totalCents = roomSubtotal + taxesAndFees

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % hotel.images.length)
  }

  const handlePrevPhoto = () => {
    setActivePhotoIndex(
      (prev) => (prev - 1 + hotel.images.length) % hotel.images.length,
    )
  }

  const handleCycleSecondary = () => {
    setSecondaryPhotoIndex((prev) => (prev + 1) % hotel.images.length)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top SearchBar to adjust dates/guests */}
      <SearchBar
        initialLocation={hotel.city}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests}
        compact={true}
      />

      {/* Hotel Title & Metadata */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]">
            ★ {hotel.rating.toFixed(1)}
          </span>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {'★'.repeat(hotel.stars)} {hotel.stars}-star hotel
          </span>
          <span className="text-xs text-[var(--text-muted)]">·</span>
          <span className="text-xs font-semibold text-[var(--accent-brand)]">
            {hotel.area}, {hotel.city}
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">
          {hotel.name}
        </h1>
        <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
          📍 {hotel.address}
        </p>
      </div>

      {/* 12-column Upper Grid: Gallery Carousel (8 cols) + Amenities Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Photo Gallery Carousel */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-md group">
            <img
              src={
                hotel.images[activePhotoIndex] || '/images/hotels/photo-01.webp'
              }
              alt={`${hotel.name} photo ${activePhotoIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Prev / Next buttons */}
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl font-bold backdrop-blur-sm transition-all cursor-pointer shadow-md"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl font-bold backdrop-blur-sm transition-all cursor-pointer shadow-md"
              aria-label="Next photo"
            >
              ›
            </button>

            {/* Photo Counter */}
            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-bold">
              {activePhotoIndex + 1} / {hotel.images.length}
            </div>
          </div>

          {/* Clickable Thumbnail Strip */}
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {hotel.images.map((img, idx) => (
              <button
                key={img}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                  activePhotoIndex === idx
                    ? 'border-[var(--accent-brand)] scale-105 shadow-sm'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Amenities & Check-in Details Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Key Amenities
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {hotel.amenities.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  <span className="text-[var(--status-success)] font-bold">
                    ✓
                  </span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Stay Details
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Check-in from</span>
              <span className="font-bold text-[var(--text-primary)]">
                {hotel.checkInTime}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Check-out by</span>
              <span className="font-bold text-[var(--text-primary)]">
                {hotel.checkOutTime}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Timezone</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {hotel.timezone}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-brand)]">
              <span>★</span>
              <span>Earn 100 LikeHome Rewards points / night</span>
            </div>
          </div>
        </div>
      </div>

      {/* Choose a Room Section */}
      <section className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Choose a room
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Transparent pricing for {nights} {nights === 1 ? 'night' : 'nights'}{' '}
            · includes taxes and fees
          </p>
        </div>

        <div className="space-y-3">
          {hotel.rooms.map((room) => {
            const isSelected = room.id === selectedRoom.id
            const roomNightlyDollars = room.nightlyRateCents / 100
            const roomTotalDollars = (
              (room.nightlyRateCents * nights * 1.12) /
              100
            ).toFixed(2)

            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${
                  isSelected
                    ? 'border-[var(--accent-brand)] bg-purple-500/5 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-neutral-400'
                }`}
              >
                {/* Room Info */}
                <div className="md:col-span-8 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                      {room.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-muted)]">
                      Up to {room.maxGuests} guests
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {room.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {room.amenities.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-[var(--text-muted)]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Selection */}
                <div className="md:col-span-4 flex flex-col md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                  <div className="text-left md:text-right">
                    <span className="text-xl font-black text-[var(--accent-brand)]">
                      ${roomTotalDollars} total
                    </span>
                    <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                      ${roomNightlyDollars.toFixed(0)} / night · incl. taxes &
                      fees
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-brand)] text-white'
                        : 'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-neutral-400'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Lower 2-column Grid: Street Map Card (Left) + Secondary Photo Strip (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 items-stretch">
        {/* Left: Real Leaflet street map card */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Location & Surroundings
          </span>
          <MapPreviewCard
            hotels={[
              {
                id: hotel.id,
                name: hotel.name,
                city: hotel.city,
                area: hotel.area,
                rating: hotel.rating,
                stars: hotel.stars,
                basePrice: hotel.basePrice,
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                images: hotel.images,
              },
            ]}
            selectedHotel={{
              id: hotel.id,
              name: hotel.name,
              city: hotel.city,
              area: hotel.area,
              rating: hotel.rating,
              stars: hotel.stars,
              basePrice: hotel.basePrice,
              latitude: hotel.latitude,
              longitude: hotel.longitude,
              images: hotel.images,
            }}
            className="h-64"
            buttonText="Map"
          />
        </div>

        {/* Right: Secondary Photo Carousel */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Other Hotel Pics
          </span>
          <div className="relative h-64 rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-sm group">
            <img
              src={hotel.images[secondaryPhotoIndex] || hotel.images[0]}
              alt="Secondary view"
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-bold">
              View {secondaryPhotoIndex + 1}
            </div>
            <button
              type="button"
              onClick={handleCycleSecondary}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl font-bold backdrop-blur-sm cursor-pointer shadow-md"
              aria-label="Cycle photo"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Card: Hotel Info & Policies */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
            About {hotel.name}
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {hotel.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[var(--border)] text-xs">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              Check-in / Check-out
            </h4>
            <p className="text-[var(--text-muted)]">
              Check-in from {hotel.checkInTime}. Check-out by{' '}
              {hotel.checkOutTime}. Express mobile check-in available.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              7-Day Cancellation Policy
            </h4>
            <p className="text-[var(--text-muted)]">
              Free cancellation (100% refund, $0 fee) when cancelled 7 or more
              days before check-in. Cancellations within 7 days incur a 1-night
              room rate fee.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              LikeHome Rewards
            </h4>
            <p className="text-[var(--text-muted)]">
              Earn 100 points per night stayed. Redeem 1,000 points for a free
              night at checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Reservation Bar (Sticky Bottom-0) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)] py-3 shadow-xl">
        <div className="max-w-[1120px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-center sm:text-left">
            <span className="font-bold text-sm text-[var(--text-primary)]">
              {selectedRoom.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              📅 {checkIn} to {checkOut} · {guests}{' '}
              {guests === 1 ? 'guest' : 'guests'}
            </span>
            <span className="text-base font-black text-[var(--accent-brand)] sm:ml-2">
              ${(totalCents / 100).toFixed(2)} total
            </span>
          </div>

          <Link
            to="/booking"
            search={{
              hotelId: hotel.id,
              roomId: selectedRoom.id,
              checkIn,
              checkOut,
              guests,
            }}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent-brand)] hover:opacity-90 text-white shadow-md transition-opacity cursor-pointer whitespace-nowrap text-center"
          >
            Reserve selected room
          </Link>
        </div>
      </div>
    </div>
  )
}
