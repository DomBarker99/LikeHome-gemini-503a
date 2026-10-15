import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { SearchBar } from '@/components/SearchBar'
import { getFeaturedShelvesFn } from '@/server/functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    return await getFeaturedShelvesFn()
  },
  component: HomeComponent,
})

const QUICK_DESTINATIONS = [
  'All destinations',
  'Los Angeles',
  'San Francisco',
  'New York',
  'Chicago',
  'Miami',
  'Seattle',
  'Austin',
  'Boston',
]

function HomeComponent() {
  const { discountedHotels, topRatedHotels } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleDestinationClick = (dest: string) => {
    navigate({
      to: '/search',
      search: {
        location: dest === 'All destinations' ? undefined : dest,
        page: 1,
      },
    })
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-8 md:py-12">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">
          Find a place that feels like home.
        </h1>
        <p className="mt-3 text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto">
          Explore over 3,000 real stays with live street maps, transparent
          member pricing, and LikeHome Rewards points on every night.
        </p>

        {/* 4-column SearchBar */}
        <div className="mt-8 max-w-4xl mx-auto">
          <SearchBar />
        </div>

        {/* Destination Quick Filters */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {QUICK_DESTINATIONS.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => handleDestinationClick(dest)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-brand)] transition-all cursor-pointer shadow-xs"
            >
              {dest}
            </button>
          ))}
        </div>
      </section>

      {/* Shelf 1: Featured discounted hotels */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Featured discounted hotels
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Exclusive member discounts up to 30% off standard nightly rates
            </p>
          </div>
          <Link
            to="/search"
            search={{ discounted: true, page: 1 }}
            className="text-xs font-bold text-[var(--accent-brand)] hover:underline"
          >
            See all deals →
          </Link>
        </div>

        {/* Horizontal scrollable cards shelf */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {discountedHotels.map((hotel) => {
            const nightlyRate = Math.round(hotel.basePrice)
            const originalPrice = Math.round(
              nightlyRate / (1 - (hotel.discountPercent || 15) / 100),
            )
            return (
              <Link
                key={hotel.id}
                to="/hotels/$hotelId"
                params={{ hotelId: hotel.id }}
                className="flex-shrink-0 w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                  <img
                    src={hotel.images[0] || '/images/hotels/photo-01.webp'}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[var(--status-error)] text-white text-[11px] font-black shadow-sm">
                    -{hotel.discountPercent}% OFF
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
                    ★ {hotel.rating.toFixed(1)}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors truncate">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {hotel.area}, {hotel.city}
                  </p>

                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--text-muted)] line-through">
                      ${originalPrice}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-[var(--accent-brand)]">
                        ${nightlyRate}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        / night
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Shelf 2: Top-rated stays */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Top-rated stays
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Guest favorites with verified review scores 9.0 and above
            </p>
          </div>
          <Link
            to="/search"
            search={{ rating9: true, page: 1 }}
            className="text-xs font-bold text-[var(--accent-brand)] hover:underline"
          >
            See all top-rated →
          </Link>
        </div>

        {/* Horizontal scrollable cards shelf */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {topRatedHotels.map((hotel) => (
            <Link
              key={hotel.id}
              to="/hotels/$hotelId"
              params={{ hotelId: hotel.id }}
              className="flex-shrink-0 w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                <img
                  src={hotel.images[0] || '/images/hotels/photo-01.webp'}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[var(--accent-brand)] text-white text-[11px] font-bold shadow-sm">
                  Top rated · ★ {hotel.rating.toFixed(1)}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors truncate">
                  {hotel.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {hotel.area}, {hotel.city}
                </p>

                <div className="mt-3 flex items-baseline justify-end pt-2 border-t border-[var(--border)] gap-1">
                  <span className="text-xs text-[var(--text-muted)]">From</span>
                  <span className="text-base font-black text-[var(--accent-brand)]">
                    ${Math.round(hotel.basePrice)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    / night
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
