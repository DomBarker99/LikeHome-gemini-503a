import { Link } from '@tanstack/react-router'

interface HotelCardProps {
  hotel: {
    id: string
    name: string
    city: string
    area: string
    shortDescription: string
    rating: number
    stars: number
    basePrice: number
    discountPercent?: number
    amenities: string[]
    images: string[]
    rooms?: {
      id: string
      nightlyRateCents: number
    }[]
  }
  checkIn?: string
  checkOut?: string
  guests?: number
}

export function HotelCard({
  hotel,
  checkIn,
  checkOut,
  guests = 2,
}: HotelCardProps) {
  const thumbnail = hotel.images[0] || '/images/hotels/photo-01.webp'
  const isDiscounted = (hotel.discountPercent ?? 0) > 0
  const nightlyRate = Math.round(hotel.basePrice)
  const originalPrice = isDiscounted
    ? Math.round(nightlyRate / (1 - (hotel.discountPercent ?? 0) / 100))
    : null

  // Calculate nights
  let nights = 1
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    nights = Math.max(
      1,
      Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
    )
  }

  const subtotal = nightlyRate * nights
  const totalWithTax = Math.round(subtotal * 1.12)

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 grid grid-cols-1 md:grid-cols-12 gap-0 group">
      {/* Thumbnail */}
      <div className="md:col-span-4 relative aspect-[16/10] md:aspect-auto overflow-hidden bg-neutral-200 dark:bg-neutral-800">
        <img
          src={thumbnail}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isDiscounted ? (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[var(--status-error)] text-white text-xs font-black shadow-md">
            -{hotel.discountPercent}% OFF
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="md:col-span-5 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]">
              ★ {hotel.rating.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {'★'.repeat(hotel.stars)} {hotel.stars}-star
            </span>
            <span className="text-xs text-[var(--text-muted)]">·</span>
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {hotel.area}, {hotel.city}
            </span>
          </div>

          <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors leading-snug">
            {hotel.name}
          </h3>

          <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed">
            {hotel.shortDescription}
          </p>
        </div>

        {/* Amenity tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {hotel.amenities.slice(0, 4).map((a) => (
            <span
              key={a}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800/80 text-[var(--text-muted)]"
            >
              {a}
            </span>
          ))}
          {hotel.amenities.length > 4 && (
            <span className="px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">
              +{hotel.amenities.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="md:col-span-3 p-5 border-t md:border-t-0 md:border-l border-[var(--border)] flex flex-col justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="text-right">
          {isDiscounted && originalPrice ? (
            <span className="text-xs text-[var(--text-muted)] line-through block">
              ${originalPrice}
            </span>
          ) : null}
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-black text-[var(--accent-brand)]">
              ${nightlyRate}
            </span>
            <span className="text-xs font-medium text-[var(--text-muted)]">
              / night
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
            ${totalWithTax} total ({nights} {nights === 1 ? 'night' : 'nights'})
          </span>
          <span className="text-[10px] text-neutral-400 block">
            includes taxes & fees
          </span>
        </div>

        <div className="mt-4">
          <Link
            to="/hotels/$hotelId"
            params={{ hotelId: hotel.id }}
            search={{
              checkIn,
              checkOut,
              guests,
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white dark:text-black dark:bg-white flex items-center justify-center hover:opacity-90 shadow-sm transition-opacity"
          >
            View stay →
          </Link>
        </div>
      </div>
    </div>
  )
}
