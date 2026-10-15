import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export interface SearchHotelsParams {
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  page?: number
  pageSize?: number
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'rating-desc'
  priceUnder180?: boolean
  rating9?: boolean
  wifi?: boolean
  breakfast?: boolean
  discounted?: boolean
  pool?: boolean
  parking?: boolean
}

export async function searchHotels(params: SearchHotelsParams) {
  const page = Math.max(1, params.page || 1)
  const pageSize = params.pageSize || 24
  const skip = (page - 1) * pageSize

  const where: Prisma.HotelWhereInput = {}

  if (params.location && params.location.trim()) {
    const loc = params.location.trim()
    where.OR = [
      { name: { contains: loc, mode: 'insensitive' } },
      { city: { contains: loc, mode: 'insensitive' } },
      { area: { contains: loc, mode: 'insensitive' } },
      { address: { contains: loc, mode: 'insensitive' } },
    ]
  }

  if (params.priceUnder180) {
    where.basePrice = { lte: 180 }
  }

  if (params.rating9) {
    where.rating = { gte: 9.0 }
  }

  if (params.discounted) {
    where.discountPercent = { gt: 0 }
  }

  const amenityFilters: string[] = []
  if (params.wifi) amenityFilters.push('WiFi')
  if (params.breakfast) amenityFilters.push('Breakfast')
  if (params.pool) amenityFilters.push('Pool')
  if (params.parking) amenityFilters.push('Parking')

  if (amenityFilters.length > 0) {
    where.amenities = {
      hasEvery: amenityFilters,
    }
  }

  // Sorting
  let orderBy: Prisma.HotelOrderByWithRelationInput[] = []
  switch (params.sort) {
    case 'price-asc':
      orderBy = [{ basePrice: 'asc' }, { rating: 'desc' }]
      break
    case 'price-desc':
      orderBy = [{ basePrice: 'desc' }, { rating: 'desc' }]
      break
    case 'rating-desc':
      orderBy = [{ rating: 'desc' }, { basePrice: 'asc' }]
      break
    case 'recommended':
    default:
      // In recommended sort: flagship/featured first, then rating
      orderBy = [
        { featuredTopRated: 'desc' },
        { rating: 'desc' },
        { basePrice: 'asc' },
      ]
      break
  }

  const [hotels, totalCount] = await Promise.all([
    prisma.hotel.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        rooms: {
          orderBy: { nightlyRateCents: 'asc' },
          take: 1,
        },
      },
    }),
    prisma.hotel.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return {
    hotels,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

export async function getFeaturedShelves() {
  const [discountedHotels, topRatedHotels] = await Promise.all([
    prisma.hotel.findMany({
      where: { discountPercent: { gt: 0 } },
      orderBy: [{ discountPercent: 'desc' }, { rating: 'desc' }],
      take: 10,
      include: {
        rooms: {
          orderBy: { nightlyRateCents: 'asc' },
          take: 1,
        },
      },
    }),
    prisma.hotel.findMany({
      where: { rating: { gte: 9.0 } },
      orderBy: [{ rating: 'desc' }, { stars: 'desc' }],
      take: 10,
      include: {
        rooms: {
          orderBy: { nightlyRateCents: 'asc' },
          take: 1,
        },
      },
    }),
  ])

  return {
    discountedHotels,
    topRatedHotels,
  }
}

export async function getHotelById(id: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      rooms: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  return hotel
}

export async function getMapHotels(location?: string, limit: number = 200) {
  const where: Prisma.HotelWhereInput = {}
  if (
    location &&
    location.trim() &&
    location.toLowerCase() !== 'all destinations'
  ) {
    const loc = location.trim()
    where.OR = [
      { name: { contains: loc, mode: 'insensitive' } },
      { city: { contains: loc, mode: 'insensitive' } },
      { area: { contains: loc, mode: 'insensitive' } },
    ]
  }

  const hotels = await prisma.hotel.findMany({
    where,
    select: {
      id: true,
      name: true,
      city: true,
      area: true,
      rating: true,
      stars: true,
      basePrice: true,
      discountPercent: true,
      latitude: true,
      longitude: true,
      images: true,
    },
    orderBy: [{ rating: 'desc' }],
    take: limit,
  })

  return hotels
}
