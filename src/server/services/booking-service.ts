import { prisma } from '../prisma'

export interface CalculatePriceInput {
  roomRateCents: number
  checkIn: Date
  checkOut: Date
  pointsToRedeem?: number
  userPoints?: number
}

export function calculateBookingPrice({
  roomRateCents,
  checkIn,
  checkOut,
  pointsToRedeem = 0,
  userPoints = 0,
}: CalculatePriceInput) {
  const diffTime = checkOut.getTime() - checkIn.getTime()
  const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)))

  const roomSubtotalCents = nights * roomRateCents

  // 1,000 points = 1 free night
  const maxPossibleFreeNights = Math.min(
    nights,
    Math.floor((userPoints || 0) / 1000),
  )
  const requestedFreeNights = Math.floor(pointsToRedeem / 1000)
  const actualFreeNights = Math.max(
    0,
    Math.min(maxPossibleFreeNights, requestedFreeNights),
  )

  const actualPointsRedeemed = actualFreeNights * 1000
  const rewardDiscountCents = actualFreeNights * roomRateCents

  const taxableSubtotal = Math.max(0, roomSubtotalCents - rewardDiscountCents)
  const taxesAndFeesCents = Math.round(taxableSubtotal * 0.12)
  const totalChargeCents = taxableSubtotal + taxesAndFeesCents

  // Earn 100 points per night
  const pointsEarned = nights * 100

  return {
    nights,
    roomRateCents,
    roomSubtotalCents,
    actualFreeNights,
    pointsRedeemed: actualPointsRedeemed,
    rewardDiscountCents,
    taxesAndFeesCents,
    totalChargeCents,
    pointsEarned,
  }
}

export async function checkOverlappingStay({
  userId,
  checkIn,
  checkOut,
  excludeBookingId,
}: {
  userId: string
  checkIn: Date
  checkOut: Date
  excludeBookingId?: string
}) {
  const conflicting = await prisma.booking.findFirst({
    where: {
      userId,
      status: 'UPCOMING',
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    include: {
      hotel: {
        select: { name: true },
      },
    },
  })

  if (!conflicting) {
    return { hasOverlap: false }
  }

  return {
    hasOverlap: true,
    conflictingBooking: {
      id: conflicting.id,
      confirmationCode: conflicting.confirmationCode,
      hotelName: conflicting.hotel.name,
      checkIn: conflicting.checkIn,
      checkOut: conflicting.checkOut,
    },
  }
}

export async function createBooking({
  userId,
  hotelId,
  roomId,
  checkIn,
  checkOut,
  guests,
  guestName,
  guestEmail,
  guestPhone,
  specialRequests,
  paymentBrand,
  paymentLast4,
  pointsToRedeem = 0,
  savedCardData,
}: {
  userId: string
  hotelId: string
  roomId: string
  checkIn: Date
  checkOut: Date
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
}) {
  const [user, hotel, room] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.hotel.findUnique({ where: { id: hotelId } }),
    prisma.room.findUnique({ where: { id: roomId } }),
  ])

  if (!user) throw new Error('User not found')
  if (!hotel) throw new Error('Hotel not found')
  if (!room) throw new Error('Room not found')

  if (guests > room.maxGuests) {
    throw new Error(`Room maximum capacity is ${room.maxGuests} guests`)
  }

  // LH-08 Overlap prevention
  const overlap = await checkOverlappingStay({
    userId,
    checkIn,
    checkOut,
  })

  if (overlap.hasOverlap && overlap.conflictingBooking) {
    const err = new Error(
      `Overlapping stay detected with #${overlap.conflictingBooking.confirmationCode}`,
    )
    ;(err as unknown as { overlap: typeof overlap }).overlap = overlap
    throw err
  }

  const pricing = calculateBookingPrice({
    roomRateCents: room.nightlyRateCents,
    checkIn,
    checkOut,
    pointsToRedeem,
    userPoints: user.rewardPoints,
  })

  // Generate confirmation code: LH-XXXXX
  const randomSuffix = Math.floor(10000 + Math.random() * 90000)
  const confirmationCode = `LH-${randomSuffix}`

  // Execute in Prisma transaction
  return await prisma.$transaction(async (tx) => {
    // If points redeemed, deduct from user and record ledger
    if (pricing.pointsRedeemed > 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          rewardPoints: { decrement: pricing.pointsRedeemed },
        },
      })
    }

    // Save card if requested
    if (savedCardData) {
      const existing = await tx.paymentCard.findFirst({
        where: {
          userId,
          last4: savedCardData.last4,
          brand: savedCardData.brand,
        },
      })
      if (!existing) {
        await tx.paymentCard.create({
          data: {
            userId,
            cardholderName: savedCardData.cardholderName,
            brand: savedCardData.brand,
            last4: savedCardData.last4,
            expMonth: savedCardData.expMonth,
            expYear: savedCardData.expYear,
            isDefault: false,
          },
        })
      }
    }

    const booking = await tx.booking.create({
      data: {
        confirmationCode,
        userId,
        hotelId,
        roomId,
        checkIn,
        checkOut,
        nights: pricing.nights,
        guests,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        roomRateCents: pricing.roomRateCents,
        roomSubtotalCents: pricing.roomSubtotalCents,
        rewardDiscountCents: pricing.rewardDiscountCents,
        taxesAndFeesCents: pricing.taxesAndFeesCents,
        totalChargeCents: pricing.totalChargeCents,
        pointsRedeemed: pricing.pointsRedeemed,
        pointsEarned: pricing.pointsEarned,
        status: 'UPCOMING',
        paymentBrand,
        paymentLast4,
      },
      include: {
        hotel: true,
        room: true,
      },
    })

    if (pricing.pointsRedeemed > 0) {
      await tx.pointTransaction.create({
        data: {
          userId,
          bookingId: booking.id,
          amount: -pricing.pointsRedeemed,
          type: 'REDEEMED',
          description: `Redeemed ${pricing.pointsRedeemed} pts for free night at ${hotel.name} (#${confirmationCode})`,
        },
      })
    }

    return booking
  })
}

export async function modifyBooking({
  bookingId,
  userId,
  roomId,
  checkIn,
  checkOut,
  guests,
}: {
  bookingId: string
  userId: string
  roomId: string
  checkIn: Date
  checkOut: Date
  guests: number
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { hotel: true },
  })

  if (!booking) throw new Error('Booking not found')
  if (booking.userId !== userId) throw new Error('Unauthorized')
  if (booking.status !== 'UPCOMING') {
    throw new Error('Only upcoming bookings can be modified')
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  })
  if (!room) throw new Error('Selected room not found')
  if (guests > room.maxGuests) {
    throw new Error(`Room maximum capacity is ${room.maxGuests} guests`)
  }

  // Overlap check excluding current booking
  const overlap = await checkOverlappingStay({
    userId,
    checkIn,
    checkOut,
    excludeBookingId: bookingId,
  })

  if (overlap.hasOverlap && overlap.conflictingBooking) {
    const err = new Error(
      `Overlapping stay detected with #${overlap.conflictingBooking.confirmationCode}`,
    )
    ;(err as unknown as { overlap: typeof overlap }).overlap = overlap
    throw err
  }

  const pricing = calculateBookingPrice({
    roomRateCents: room.nightlyRateCents,
    checkIn,
    checkOut,
    pointsToRedeem: booking.pointsRedeemed,
    userPoints: 999999, // Already validated on initial booking
  })

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      roomId,
      checkIn,
      checkOut,
      guests,
      nights: pricing.nights,
      roomRateCents: pricing.roomRateCents,
      roomSubtotalCents: pricing.roomSubtotalCents,
      rewardDiscountCents: pricing.rewardDiscountCents,
      taxesAndFeesCents: pricing.taxesAndFeesCents,
      totalChargeCents: pricing.totalChargeCents,
      pointsEarned: pricing.pointsEarned,
    },
    include: {
      hotel: true,
      room: true,
    },
  })

  return updated
}

export async function cancelBooking({
  bookingId,
  userId,
  simulateLateFee = false,
}: {
  bookingId: string
  userId: string
  simulateLateFee?: boolean
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { hotel: true },
  })

  if (!booking) throw new Error('Booking not found')
  if (booking.userId !== userId) throw new Error('Unauthorized')
  if (booking.status !== 'UPCOMING') {
    throw new Error('Only upcoming bookings can be cancelled')
  }

  const now = new Date()
  const daysUntilCheckIn =
    (booking.checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

  const isLate = simulateLateFee || daysUntilCheckIn < 7

  let cancellationFeeCents = 0
  if (isLate) {
    if (booking.nights === 1) {
      cancellationFeeCents = Math.round(booking.totalChargeCents * 0.25)
    } else {
      // 1 night room rate + 12% tax
      cancellationFeeCents = Math.min(
        booking.totalChargeCents,
        booking.roomRateCents + Math.round(booking.roomRateCents * 0.12),
      )
    }
  }

  const refundAmountCents = Math.max(
    0,
    booking.totalChargeCents - cancellationFeeCents,
  )

  return await prisma.$transaction(async (tx) => {
    // If points were redeemed, restore them to the user
    if (booking.pointsRedeemed > 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          rewardPoints: { increment: booking.pointsRedeemed },
        },
      })

      await tx.pointTransaction.create({
        data: {
          userId,
          bookingId: booking.id,
          amount: booking.pointsRedeemed,
          type: 'REFUNDED',
          description: `Refunded points for cancelled booking at ${booking.hotel.name} (#${booking.confirmationCode})`,
        },
      })
    }

    const cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationFeeCents,
        refundAmountCents,
      },
      include: {
        hotel: true,
        room: true,
      },
    })

    return cancelled
  })
}

export async function completeBookingStay(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { hotel: true },
  })

  if (!booking) throw new Error('Booking not found')
  if (booking.userId !== userId) throw new Error('Unauthorized')
  if (booking.status !== 'UPCOMING') {
    throw new Error('Only upcoming bookings can be marked completed')
  }

  return await prisma.$transaction(async (tx) => {
    // Award earned points to user
    await tx.user.update({
      where: { id: userId },
      data: {
        rewardPoints: { increment: booking.pointsEarned },
      },
    })

    await tx.pointTransaction.create({
      data: {
        userId,
        bookingId: booking.id,
        amount: booking.pointsEarned,
        type: 'EARNED',
        description: `Earned points for completed stay at ${booking.hotel.name} (#${booking.confirmationCode})`,
      },
    })

    const completed = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        hotel: true,
        room: true,
      },
    })

    return completed
  })
}

export async function getBookingByConfirmationCode(code: string) {
  const cleanCode = code.replace(/^#/, '').trim()
  const booking = await prisma.booking.findFirst({
    where: {
      confirmationCode: {
        equals: cleanCode,
        mode: 'insensitive',
      },
    },
    include: {
      hotel: true,
      room: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })
  return booking
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hotel: true,
      room: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })
  return booking
}

export async function getUserBookings(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      hotel: true,
      room: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return bookings
}
