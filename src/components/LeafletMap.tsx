import { useEffect, useRef, useState, useCallback } from 'react'

export interface MapHotel {
  id: string
  name: string
  city: string
  area: string
  rating: number
  stars: number
  basePrice: number
  discountPercent?: number
  latitude: number
  longitude: number
  images: string[]
}

interface LeafletMapProps {
  hotels: MapHotel[]
  selectedHotelId?: string
  onSelectHotel?: (hotel: MapHotel) => void
  onBoundsChange?: (visibleHotels: MapHotel[]) => void
  center?: [number, number]
  zoom?: number
  interactive?: boolean
  className?: string
}

export function LeafletMap({
  hotels,
  selectedHotelId,
  onSelectHotel,
  onBoundsChange,
  center,
  zoom = 12,
  interactive = true,
  className = 'w-full h-full min-h-[300px]',
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const [isClient] = useState(() => typeof window !== 'undefined')

  const renderMarkers = useCallback(
    (L: any, map: any, group: any) => {
      group.clearLayers()

      const currentZoom = map.getZoom()
      const clusters: {
        hotels: MapHotel[]
        centerLat: number
        centerLng: number
      }[] = []

      hotels.forEach((hotel) => {
        const p = map.project(
          L.latLng(hotel.latitude, hotel.longitude),
          currentZoom,
        )
        let addedToCluster = false

        for (const cluster of clusters) {
          const cp = map.project(
            L.latLng(cluster.centerLat, cluster.centerLng),
            currentZoom,
          )
          const dist = Math.hypot(p.x - cp.x, p.y - cp.y)
          if (dist < 45) {
            cluster.hotels.push(hotel)
            addedToCluster = true
            break
          }
        }

        if (!addedToCluster) {
          clusters.push({
            hotels: [hotel],
            centerLat: hotel.latitude,
            centerLng: hotel.longitude,
          })
        }
      })

      clusters.forEach((cluster) => {
        if (cluster.hotels.length > 1) {
          const minPrice = Math.min(...cluster.hotels.map((h) => h.basePrice))
          const count = cluster.hotels.length
          const icon = L.divIcon({
            className: 'price-pill-marker',
            html: `<div class="cluster-pill">${count} stays · $${minPrice}+</div>`,
            iconSize: [120, 28],
            iconAnchor: [60, 14],
          })

          const marker = L.marker([cluster.centerLat, cluster.centerLng], {
            icon,
          }).addTo(group)

          marker.on('click', () => {
            if (interactive) {
              const bounds = L.latLngBounds(
                cluster.hotels.map((h) => L.latLng(h.latitude, h.longitude)),
              )
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
            }
          })
        } else {
          const hotel = cluster.hotels[0]
          const isSelected = hotel.id === selectedHotelId
          const icon = L.divIcon({
            className: 'price-pill-marker',
            html: `<div class="price-pill ${isSelected ? 'selected' : ''}">$${Math.round(hotel.basePrice)}</div>`,
            iconSize: [60, 26],
            iconAnchor: [30, 13],
          })

          const marker = L.marker([hotel.latitude, hotel.longitude], {
            icon,
            zIndexOffset: isSelected ? 1000 : 0,
          }).addTo(group)

          marker.on('click', () => {
            if (onSelectHotel) {
              onSelectHotel(hotel)
            }
          })
        }
      })
    },
    [hotels, interactive, onSelectHotel, selectedHotelId],
  )

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    let isMounted = true

    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      let initialCenter: [number, number] = center || [34.0522, -118.2437]
      if (!center && hotels.length > 0) {
        initialCenter = [hotels[0].latitude, hotels[0].longitude]
      }

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom,
        zoomControl: interactive,
        scrollWheelZoom: interactive,
        dragging: interactive,
        attributionControl: true,
      })

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const markersGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = markersGroup
      mapRef.current = map

      renderMarkers(L, map, markersGroup)

      if (interactive && onBoundsChange) {
        map.on('moveend zoomend', () => {
          if (!isMounted) return
          const bounds = map.getBounds()
          const visible = hotels.filter((h) =>
            bounds.contains(L.latLng(h.latitude, h.longitude)),
          )
          onBoundsChange(visible)
        })
      }
    })

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [
    center,
    hotels,
    interactive,
    isClient,
    onBoundsChange,
    renderMarkers,
    zoom,
  ])

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return
    import('leaflet').then((L) => {
      renderMarkers(L, mapRef.current, markersLayerRef.current)
    })
  }, [renderMarkers])

  if (!isClient) {
    return (
      <div
        className={`${className} bg-neutral-100 dark:bg-neutral-900 rounded-xl flex items-center justify-center text-sm text-[var(--text-muted)]`}
      >
        Loading map...
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
