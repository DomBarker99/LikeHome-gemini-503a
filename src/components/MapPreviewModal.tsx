import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LeafletMap } from './LeafletMap'
import type { MapHotel } from './LeafletMap'

interface MapPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  hotels: MapHotel[]
  initialSelectedHotel?: MapHotel | null
  onFilterToVisibleArea?: (visibleIds: string[]) => void
}

export function MapPreviewModal({
  isOpen,
  onClose,
  hotels,
  initialSelectedHotel,
  onFilterToVisibleArea,
}: MapPreviewModalProps) {
  const [selectedHotel, setSelectedHotel] = useState<MapHotel | null>(
    initialSelectedHotel || (hotels.length > 0 ? hotels[0] : null),
  )
  const [visibleHotels, setVisibleHotels] = useState<MapHotel[]>(hotels)
  const [hasMoved, setHasMoved] = useState(false)

  if (!isOpen) return null

  const handleBoundsChange = (visible: MapHotel[]) => {
    setVisibleHotels(visible)
    setHasMoved(true)
  }

  const handleApplyAreaFilter = () => {
    if (onFilterToVisibleArea) {
      onFilterToVisibleArea(visibleHotels.map((h) => h.id))
      onClose()
    }
  }

  const handleResetView = () => {
    setVisibleHotels(hotels)
    setHasMoved(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[var(--text-primary)]">
              Interactive Map
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-muted)]">
              {visibleHotels.length} stays in view
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasMoved && (
              <>
                <button
                  type="button"
                  onClick={handleApplyAreaFilter}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-all cursor-pointer"
                >
                  Filter to visible map area
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Reset map view
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-lg leading-none"
              aria-label="Close map modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Grid: Map + Inspector Sidebar */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Map canvas */}
          <div className="md:col-span-8 h-full relative">
            <LeafletMap
              hotels={hotels}
              selectedHotelId={selectedHotel?.id}
              onSelectHotel={(h) => setSelectedHotel(h)}
              onBoundsChange={handleBoundsChange}
              interactive={true}
              className="w-full h-full"
            />
          </div>

          {/* Inspector sidebar */}
          <div className="md:col-span-4 h-full border-l border-[var(--border)] flex flex-col bg-[var(--bg-surface)] overflow-hidden">
            {selectedHotel ? (
              <div className="p-4 border-b border-[var(--border)] bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-neutral-200 dark:bg-neutral-800">
                  <img
                    src={
                      selectedHotel.images[0] || '/images/hotels/photo-01.webp'
                    }
                    alt={selectedHotel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-bold">
                    ★ {selectedHotel.rating.toFixed(1)}
                  </div>
                  {selectedHotel.discountPercent ? (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[var(--status-error)] text-white text-xs font-black">
                      -{selectedHotel.discountPercent}%
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)] leading-snug">
                      {selectedHotel.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {selectedHotel.area}, {selectedHotel.city}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      {selectedHotel.latitude.toFixed(4)},{' '}
                      {selectedHotel.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-muted)] block">
                      From
                    </span>
                    <span className="text-lg font-black text-[var(--accent-brand)]">
                      ${Math.round(selectedHotel.basePrice)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      /nt
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    to="/hotels/$hotelId"
                    params={{ hotelId: selectedHotel.id }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-white dark:text-black dark:bg-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    Open hotel page →
                  </Link>
                </div>
              </div>
            ) : null}

            {/* List of visible stays in area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-2">
                Stays in visible view ({visibleHotels.length})
              </div>
              {visibleHotels.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHotel(h)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedHotel?.id === h.id
                      ? 'border-[var(--accent-brand)] bg-purple-500/5'
                      : 'border-[var(--border)] hover:border-neutral-400'
                  }`}
                >
                  <img
                    src={h.images[0] || '/images/hotels/photo-01.webp'}
                    alt={h.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {h.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      ★ {h.rating.toFixed(1)} · {h.area}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      ${Math.round(h.basePrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
