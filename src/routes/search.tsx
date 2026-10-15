import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SearchBar } from '@/components/SearchBar'
import { HotelCard } from '@/components/HotelCard'
import { MapPreviewCard } from '@/components/MapPreviewCard'
import { searchHotelsFn, getMapHotelsFn } from '@/server/functions'

interface SearchParams {
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  page?: number
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'rating-desc'
  priceUnder180?: boolean
  rating9?: boolean
  wifi?: boolean
  breakfast?: boolean
  discounted?: boolean
  pool?: boolean
  parking?: boolean
}

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    location: (search.location as string) || undefined,
    checkIn: (search.checkIn as string) || undefined,
    checkOut: (search.checkOut as string) || undefined,
    guests: search.guests ? Number(search.guests) : 2,
    page: search.page ? Number(search.page) : 1,
    sort: (search.sort as SearchParams['sort']) || 'recommended',
    priceUnder180:
      search.priceUnder180 === true || search.priceUnder180 === 'true',
    rating9: search.rating9 === true || search.rating9 === 'true',
    wifi: search.wifi === true || search.wifi === 'true',
    breakfast: search.breakfast === true || search.breakfast === 'true',
    discounted: search.discounted === true || search.discounted === 'true',
    pool: search.pool === true || search.pool === 'true',
    parking: search.parking === true || search.parking === 'true',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [searchResult, mapHotels] = await Promise.all([
      searchHotelsFn({ data: deps }),
      getMapHotelsFn({ data: deps.location }),
    ])
    return {
      searchResult,
      mapHotels,
    }
  },
  component: SearchComponent,
})

function SearchComponent() {
  const searchParams = Route.useSearch()
  const navigate = useNavigate()
  const { searchResult, mapHotels } = Route.useLoaderData()
  const { hotels, totalCount, page, totalPages } = searchResult

  const updateFilters = (newParams: Partial<SearchParams>) => {
    navigate({
      to: '/search',
      search: {
        ...searchParams,
        ...newParams,
        page: newParams.page !== undefined ? newParams.page : 1,
      },
    })
  }

  const hasActiveFilters = Boolean(
    searchParams.priceUnder180 ||
    searchParams.rating9 ||
    searchParams.wifi ||
    searchParams.breakfast ||
    searchParams.discounted ||
    searchParams.pool ||
    searchParams.parking,
  )

  const resetFilters = () => {
    navigate({
      to: '/search',
      search: {
        location: searchParams.location,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
        sort: searchParams.sort,
        page: 1,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Top SearchBar */}
      <SearchBar
        initialLocation={searchParams.location || ''}
        initialCheckIn={searchParams.checkIn || '2026-11-10'}
        initialCheckOut={searchParams.checkOut || '2026-11-14'}
        initialGuests={searchParams.guests || 2}
        compact={true}
      />

      {/* Main Grid: Left Filters Sidebar + Right Results */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-5">
          {/* Street Map Preview Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Map Preview
            </span>
            <MapPreviewCard hotels={mapHotels} className="h-48" />
          </div>

          {/* Filters Card */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-[var(--accent-brand)] hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Checkbox items */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.priceUnder180)}
                  onChange={(e) =>
                    updateFilters({
                      priceUnder180: e.target.checked || undefined,
                    })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Price (Under $180 / night)</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.rating9)}
                  onChange={(e) =>
                    updateFilters({ rating9: e.target.checked || undefined })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Rating (★ 9.0+)</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.wifi)}
                  onChange={(e) =>
                    updateFilters({ wifi: e.target.checked || undefined })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Free WiFi</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.breakfast)}
                  onChange={(e) =>
                    updateFilters({ breakfast: e.target.checked || undefined })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Breakfast</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.discounted)}
                  onChange={(e) =>
                    updateFilters({ discounted: e.target.checked || undefined })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Discounted</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.pool)}
                  onChange={(e) =>
                    updateFilters({ pool: e.target.checked || undefined })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Pool</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(searchParams.parking)}
                  onChange={(e) =>
                    updateFilters({ parking: e.target.checked || undefined })
                  }
                  className="rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
                />
                <span>Parking</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Column: Results List */}
        <section className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Header count + Sort dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {totalCount.toLocaleString()}{' '}
                {totalCount === 1 ? 'hotel' : 'hotels'} found
                {searchParams.location ? ` in "${searchParams.location}"` : ''}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Showing page {page} of {totalPages} (24 stays per page)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">
                Sort by:
              </label>
              <select
                value={searchParams.sort || 'recommended'}
                onChange={(e) =>
                  updateFilters({
                    sort: e.target.value as SearchParams['sort'],
                  })
                }
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)] cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating-desc">Rating: high to low</option>
              </select>
            </div>
          </div>

          {/* HotelCard List */}
          {hotels.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
              <span className="text-3xl block">🔍</span>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                No stays match your criteria
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Try loosening your filters, selecting a different destination,
                or resetting your search.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-all"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  checkIn={searchParams.checkIn}
                  checkOut={searchParams.checkOut}
                  guests={searchParams.guests}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-neutral-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-neutral-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
