import { useState } from 'react'
import { LeafletMap } from './LeafletMap'
import type { MapHotel } from './LeafletMap'
import { MapPreviewModal } from './MapPreviewModal'

interface MapPreviewCardProps {
  hotels: MapHotel[]
  selectedHotel?: MapHotel | null
  className?: string
  buttonText?: string
}

export function MapPreviewCard({
  hotels,
  selectedHotel,
  className = 'h-48',
  buttonText = 'Map · click to expand',
}: MapPreviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm cursor-pointer group ${className}`}
      >
        <LeafletMap
          hotels={hotels}
          selectedHotelId={selectedHotel?.id}
          center={
            selectedHotel
              ? [selectedHotel.latitude, selectedHotel.longitude]
              : hotels.length > 0
                ? [hotels[0].latitude, hotels[0].longitude]
                : undefined
          }
          zoom={13}
          interactive={false}
          className="w-full h-full pointer-events-none group-hover:scale-105 transition-transform duration-300"
        />

        {/* Bottom anchored expand button */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center z-10 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            className="pointer-events-auto cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-white dark:text-black dark:bg-white shadow-lg backdrop-blur-md group-hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <span>🗺️</span>
            <span>{buttonText}</span>
          </button>
        </div>
      </div>

      <MapPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hotels={hotels}
        initialSelectedHotel={selectedHotel}
      />
    </>
  )
}
