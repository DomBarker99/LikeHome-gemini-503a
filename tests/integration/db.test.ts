import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/server/prisma'
import { seedDatabase } from '../../src/server/seed'
import {
  checkOverlappingStay,
  createBooking,
  modifyBooking,
  cancelBooking,
  completeBookingStay,
} from '../../src/server/services/booking-service'
import { getUserProfile } from '../../src/server/services/user-service'

describe('PostgreSQL Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is populated with catalog and demo user
    await seedDatabase()
  }, 30000)

  afterAll(async () => {
    // Clean up test-created bookings
    await prisma.booking.deleteMany({
      where: {
        guestEmail: 'integration-test@likehome.dev',
      },
    })
    await prisma.$disconnect()
  })

  it('verifies 3,000 hotels and 12,000 rooms exist in the database', async () => {
    const [hotelCount, roomCount] = await Promise.all([
      prisma.hotel.count(),
      prisma.room.count(),
    ])

    expect(hotelCount).toBe(3000)
    expect(roomCount).toBe(12000)
  })

  it('retrieves flagship hotel Figueroa Downtown with its 4 authored rooms', async () => {
    const hotel = await prisma.hotel.findUnique({
      where: { id: 'figueroa-downtown-la' },
      include: { rooms: true },
    })

    expect(hotel).not.toBeNull()
    expect(hotel?.name).toBe('Hotel Figueroa Downtown')
    expect(hotel?.city).toBe('Los Angeles')
    expect(hotel?.rooms.length).toBe(4)
    expect(hotel?.rooms.some((r) => r.name === 'Double room')).toBe(true)
  })

  it('verifies demo user Alex Rivera with 1,250 points and pre-seeded bookings', async () => {
    const user = await getUserProfile(
      (await prisma.user.findUnique({ where: { email: 'demo@likehome.dev' } }))!
        .id,
    )

    expect(user).not.toBeNull()
    expect(user?.name).toBe('Alex Rivera')
    expect(user?.rewardPoints).toBe(1250)
    expect(user?.savedCards.length).toBeGreaterThan(0)
    expect(user?.savedCards[0].last4).toBe('4242')

    // Pre-seeded upcoming booking #LH-20481
    const upcoming = user?.bookings.find(
      (b) => b.confirmationCode === 'LH-20481',
    )
    expect(upcoming).toBeDefined()
    expect(upcoming?.status).toBe('UPCOMING')
    expect(upcoming?.hotelId).toBe('figueroa-downtown-la')

    // Pre-seeded completed booking #LH-19204
    const completed = user?.bookings.find(
      (b) => b.confirmationCode === 'LH-19204',
    )
    expect(completed).toBeDefined()
    expect(completed?.status).toBe('COMPLETED')
    expect(completed?.hotelId).toBe('fairmont-nob-hill-sf')
  })

  it('enforces overlapping stay prevention (LH-08) against #LH-20481', async () => {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@likehome.dev' },
    })
    expect(demoUser).not.toBeNull()

    // LH-20481 is 2026-11-10 to 2026-11-14
    // Attempting a booking from 2026-11-12 to 2026-11-15 must detect overlap
    const overlap = await checkOverlappingStay({
      userId: demoUser!.id,
      checkIn: new Date('2026-11-12T15:00:00Z'),
      checkOut: new Date('2026-11-15T11:00:00Z'),
    })

    expect(overlap.hasOverlap).toBe(true)
    expect(overlap.conflictingBooking?.confirmationCode).toBe('LH-20481')
  })

  it('creates, completes, and earns points on a new reservation lifecycle', async () => {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@likehome.dev' },
    })
    expect(demoUser).not.toBeNull()

    const initialPoints = demoUser!.rewardPoints

    // Non-overlapping stay in December
    const newBooking = await createBooking({
      userId: demoUser!.id,
      hotelId: 'sunset-marquis-la',
      roomId: 'sunset-marquis-la-double',
      checkIn: new Date('2026-12-10T15:00:00Z'),
      checkOut: new Date('2026-12-12T11:00:00Z'), // 2 nights
      guests: 2,
      guestName: 'Integration Tester',
      guestEmail: 'integration-test@likehome.dev',
      guestPhone: '(555) 999-0000',
      paymentBrand: 'VISA',
      paymentLast4: '4242',
    })

    expect(newBooking.status).toBe('UPCOMING')
    expect(newBooking.nights).toBe(2)
    expect(newBooking.pointsEarned).toBe(200)

    // Complete the stay (demo action)
    const completed = await completeBookingStay(newBooking.id, demoUser!.id)
    expect(completed.status).toBe('COMPLETED')

    // Verify points awarded
    const refreshedUser = await prisma.user.findUnique({
      where: { id: demoUser!.id },
    })
    expect(refreshedUser?.rewardPoints).toBe(initialPoints + 200)

    // Clean up points
    await prisma.user.update({
      where: { id: demoUser!.id },
      data: { rewardPoints: initialPoints },
    })
  })

  it('modifies an upcoming stay and recalculates charges (LH-06)', async () => {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@likehome.dev' },
    })
    expect(demoUser).not.toBeNull()

    const tempBooking = await createBooking({
      userId: demoUser!.id,
      hotelId: 'pasadena-arroyo-la',
      roomId: 'pasadena-arroyo-la-twin',
      checkIn: new Date('2026-12-20T15:00:00Z'),
      checkOut: new Date('2026-12-22T11:00:00Z'), // 2 nights
      guests: 1,
      guestName: 'Modify Test',
      guestEmail: 'integration-test@likehome.dev',
      guestPhone: '(555) 999-0000',
      paymentBrand: 'VISA',
      paymentLast4: '4242',
    })

    // Modify stay to King Suite and 3 nights
    const modified = await modifyBooking({
      bookingId: tempBooking.id,
      userId: demoUser!.id,
      roomId: 'pasadena-arroyo-la-king',
      checkIn: new Date('2026-12-20T15:00:00Z'),
      checkOut: new Date('2026-12-23T11:00:00Z'), // 3 nights
      guests: 2,
    })

    expect(modified.nights).toBe(3)
    expect(modified.roomId).toBe('pasadena-arroyo-la-king')
    expect(modified.totalChargeCents).toBeGreaterThan(
      tempBooking.totalChargeCents,
    )
  })

  it('cancels upcoming stay with 7-day simulated fee calculation (LH-10)', async () => {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@likehome.dev' },
    })
    expect(demoUser).not.toBeNull()

    const bookingToCancel = await createBooking({
      userId: demoUser!.id,
      hotelId: 'beverly-terrace-la',
      roomId: 'beverly-terrace-la-double',
      checkIn: new Date('2026-12-28T15:00:00Z'),
      checkOut: new Date('2026-12-31T11:00:00Z'), // 3 nights
      guests: 2,
      guestName: 'Cancel Test',
      guestEmail: 'integration-test@likehome.dev',
      guestPhone: '(555) 999-0000',
      paymentBrand: 'VISA',
      paymentLast4: '4242',
    })

    const cancelled = await cancelBooking({
      bookingId: bookingToCancel.id,
      userId: demoUser!.id,
      simulateLateFee: true,
    })

    expect(cancelled.status).toBe('CANCELLED')
    expect(cancelled.cancellationFeeCents).toBeGreaterThan(0)
    expect(cancelled.refundAmountCents).toBe(
      bookingToCancel.totalChargeCents - cancelled.cancellationFeeCents!,
    )
  })
})
