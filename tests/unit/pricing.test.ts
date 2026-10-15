import { describe, it, expect } from 'vitest'
import { calculateBookingPrice } from '../../src/server/services/booking-service'

describe('calculateBookingPrice', () => {
  it('calculates standard 4-night stay without points redemption', () => {
    const checkIn = new Date('2026-11-10T15:00:00Z')
    const checkOut = new Date('2026-11-14T11:00:00Z')
    const roomRateCents = 16000 // $160/night

    const result = calculateBookingPrice({
      roomRateCents,
      checkIn,
      checkOut,
      pointsToRedeem: 0,
      userPoints: 1250,
    })

    expect(result.nights).toBe(4)
    expect(result.roomSubtotalCents).toBe(64000) // $640.00
    expect(result.actualFreeNights).toBe(0)
    expect(result.rewardDiscountCents).toBe(0)
    expect(result.taxesAndFeesCents).toBe(7680) // 12% of $640 = $76.80
    expect(result.totalChargeCents).toBe(71680) // $716.80
    expect(result.pointsEarned).toBe(400) // 4 * 100
  })

  it('calculates stay with 1 free night redeemed (1,000 points = 1 free night)', () => {
    const checkIn = new Date('2026-11-10T15:00:00Z')
    const checkOut = new Date('2026-11-14T11:00:00Z')
    const roomRateCents = 16000

    const result = calculateBookingPrice({
      roomRateCents,
      checkIn,
      checkOut,
      pointsToRedeem: 1000,
      userPoints: 1250,
    })

    expect(result.nights).toBe(4)
    expect(result.actualFreeNights).toBe(1)
    expect(result.pointsRedeemed).toBe(1000)
    expect(result.rewardDiscountCents).toBe(16000) // -$160
    // Taxable subtotal = $640 - $160 = $480
    expect(result.taxesAndFeesCents).toBe(5760) // 12% of $480 = $57.60
    expect(result.totalChargeCents).toBe(53760) // $537.60
    expect(result.pointsEarned).toBe(400)
  })

  it('caps points redemption at total stay nights and available points', () => {
    const checkIn = new Date('2026-11-10T15:00:00Z')
    const checkOut = new Date('2026-11-12T11:00:00Z') // 2 nights
    const roomRateCents = 10000

    // User has 5,000 points and requests 5,000 points (5 nights), but stay is only 2 nights
    const result = calculateBookingPrice({
      roomRateCents,
      checkIn,
      checkOut,
      pointsToRedeem: 5000,
      userPoints: 5000,
    })

    expect(result.nights).toBe(2)
    expect(result.actualFreeNights).toBe(2)
    expect(result.pointsRedeemed).toBe(2000)
    expect(result.rewardDiscountCents).toBe(20000)
    expect(result.totalChargeCents).toBe(0)
  })
})
