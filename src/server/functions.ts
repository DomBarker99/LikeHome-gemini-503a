import { createServerFn } from '@tanstack/react-start'
import { getServerSession } from './session'
import {
  searchHotels,
  getFeaturedShelves,
  getHotelById,
  getMapHotels,
} from './services/hotel-service'
import {
  calculateBookingPrice,
  checkOverlappingStay,
  createBooking,
  modifyBooking,
  cancelBooking,
  completeBookingStay,
  getBookingByConfirmationCode,
  getBookingById,
  getUserBookings,
  normalizeStayDates,
} from './services/booking-service'
import {
  getUserProfile,
  updateUserProfile,
  addPaymentCard,
  deletePaymentCard,
} from './services/user-service'

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getServerSession()
    return session
  },
)

export const searchHotelsFn = createServerFn({ method: 'GET' })
  .validator(
    (params: {
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
    }) => params,
  )
  .handler(async ({ data }) => {
    return await searchHotels(data)
  })

export const getFeaturedShelvesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await getFeaturedShelves()
  },
)

export const getHotelByIdFn = createServerFn({ method: 'GET' })
  .validator((hotelId: string) => hotelId)
  .handler(async ({ data: hotelId }) => {
    return await getHotelById(hotelId)
  })

export const getMapHotelsFn = createServerFn({ method: 'GET' })
  .validator((location?: string) => location)
  .handler(async ({ data: location }) => {
    return await getMapHotels(location)
  })

export const calculatePriceFn = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      roomRateCents: number
      checkIn: string
      checkOut: string
      pointsToRedeem?: number
    }) => input,
  )
  .handler(async ({ data }) => {
    const session = await getServerSession()
    const userPoints = session ? (session.user.rewardPoints ?? 0) : 0
    const { checkIn, checkOut } = normalizeStayDates(
      data.checkIn,
      data.checkOut,
    )

    return calculateBookingPrice({
      roomRateCents: data.roomRateCents,
      checkIn,
      checkOut,
      pointsToRedeem: data.pointsToRedeem,
      userPoints,
    })
  })

export const checkOverlapFn = createServerFn({ method: 'POST' })
  .validator(
    (input: { checkIn: string; checkOut: string; excludeBookingId?: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    const session = await getServerSession()
    if (!session?.user) return { hasOverlap: false }

    return await checkOverlappingStay({
      userId: session.user.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      excludeBookingId: data.excludeBookingId,
    })
  })

export const createBookingFn = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      hotelId: string
      roomId: string
      checkIn: string
      checkOut: string
      guests: number
      guestName: string
      guestEmail: string
      guestPhone: string
      specialRequests?: string
      paymentBrand: string
      paymentLast4: string
      pointsToRedeem?: number
      savedCardData?: {
        cardholderName: string
        brand: string
        last4: string
        expMonth: number
        expYear: number
      }
    }) => input,
  )
  .handler(async ({ data }) => {
    const session = await getServerSession()
    if (!session?.user) {
      throw new Error('Must be signed in to book a room')
    }

    return await createBooking({
      ...data,
      userId: session.user.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
    })
  })

export const getBookingFn = createServerFn({ method: 'GET' })
  .validator((query: { id?: string; code?: string }) => query)
  .handler(async ({ data }) => {
    if (data.code) {
      return await getBookingByConfirmationCode(data.code)
    }
    if (data.id) {
      return await getBookingById(data.id)
    }
    return null
  })

export const getUserBookingsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getServerSession()
    if (!session?.user) return []
    return await getUserBookings(session.user.id)
  },
)

export const modifyBookingFn = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      bookingId: string
      roomId: string
      checkIn: string
      checkOut: string
      guests: number
    }) => input,
  )
  .handler(async ({ data }) => {
    const session = await getServerSession()
    if (!session?.user) throw new Error('Unauthorized')

    return await modifyBooking({
      ...data,
      userId: session.user.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
    })
  })

export const cancelBookingFn = createServerFn({ method: 'POST' })
  .validator((input: { bookingId: string; simulateLateFee?: boolean }) => input)
  .handler(async ({ data }) => {
    const session = await getServerSession()
    if (!session?.user) throw new Error('Unauthorized')

    return await cancelBooking({
      bookingId: data.bookingId,
      userId: session.user.id,
      simulateLateFee: data.simulateLateFee,
    })
  })

export const completeStayFn = createServerFn({ method: 'POST' })
  .validator((bookingId: string) => bookingId)
  .handler(async ({ data: bookingId }) => {
    const session = await getServerSession()
    if (!session?.user) throw new Error('Unauthorized')

    return await completeBookingStay(bookingId, session.user.id)
  })

export const getUserProfileFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getServerSession()
    if (!session?.user) return null
    return await getUserProfile(session.user.id)
  },
)

export const updateProfileFn = createServerFn({ method: 'POST' })
  .validator(
    (input: { name: string; phone?: string; preferredCity?: string }) => input,
  )
  .handler(async ({ data }) => {
    const session = await getServerSession()
    if (!session?.user) throw new Error('Unauthorized')

    return await updateUserProfile({
      userId: session.user.id,
      ...data,
    })
  })

export const addCardFn = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      cardholderName: string
      brand: string
      cardNumber: string
      expMonth: number
      expYear: number
      isDefault?: boolean
    }) => input,
  )
  .handler(async ({ data }) => {
    const session = await getServerSession()
    if (!session?.user) throw new Error('Unauthorized')

    return await addPaymentCard({
      userId: session.user.id,
      ...data,
    })
  })

export const deleteCardFn = createServerFn({ method: 'POST' })
  .validator((cardId: string) => cardId)
  .handler(async ({ data: cardId }) => {
    const session = await getServerSession()
    if (!session?.user) throw new Error('Unauthorized')

    return await deletePaymentCard(cardId, session.user.id)
  })
