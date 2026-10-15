import { describe, it, expect } from 'vitest'
import { calculateCancellation } from '../../src/server/services/booking-service'

describe('Cancellation Policy & Fee Calculation (LH-10)', () => {
  const checkIn = new Date('2026-11-10T15:00:00Z')
  const roomRateCents = 16000 // $160
  const totalChargeCents = 71680 // $716.80 for 4 nights
  const nights = 4

  it('provides 100% refund ($0 fee) when cancelled 10 days before check-in', () => {
    const now = new Date('2026-10-31T15:00:00Z') // 10 days before
    const result = calculateCancellation({
      checkIn,
      now,
      roomRateCents,
      totalChargeCents,
      nights,
    })

    expect(result.isLate).toBe(false)
    expect(result.feeCents).toBe(0)
    expect(result.refundCents).toBe(totalChargeCents)
  })

  it('provides 100% refund on exact 7-day cutoff threshold', () => {
    const now = new Date('2026-11-03T15:00:00Z') // Exactly 7 days
    const result = calculateCancellation({
      checkIn,
      now,
      roomRateCents,
      totalChargeCents,
      nights,
    })

    expect(result.isLate).toBe(false)
    expect(result.feeCents).toBe(0)
    expect(result.refundCents).toBe(totalChargeCents)
  })

  it('incurs 1-night room rate fee when cancelled 3 days before check-in', () => {
    const now = new Date('2026-11-07T15:00:00Z') // 3 days before
    const result = calculateCancellation({
      checkIn,
      now,
      roomRateCents,
      totalChargeCents,
      nights,
    })

    expect(result.isLate).toBe(true)
    // 1 night room rate + 12% tax = $160 + $19.20 = $179.20
    expect(result.feeCents).toBe(17920)
    expect(result.refundCents).toBe(totalChargeCents - 17920)
  })

  it('incurs fee when simulateLateFee toggle is active regardless of date', () => {
    const now = new Date('2026-08-01T15:00:00Z') // Months in advance
    const result = calculateCancellation({
      checkIn,
      now,
      roomRateCents,
      totalChargeCents,
      nights,
      simulateLateFee: true,
    })

    expect(result.isLate).toBe(true)
    expect(result.feeCents).toBe(17920)
    expect(result.refundCents).toBe(totalChargeCents - 17920)
  })

  it('charges 25% cancellation fee for single-night stay', () => {
    const singleNightTotal = 17920 // $179.20
    const now = new Date('2026-11-09T15:00:00Z') // 1 day before
    const result = calculateCancellation({
      checkIn,
      now,
      roomRateCents: 16000,
      totalChargeCents: singleNightTotal,
      nights: 1,
    })

    expect(result.isLate).toBe(true)
    expect(result.feeCents).toBe(Math.round(singleNightTotal * 0.25))
    expect(result.refundCents).toBe(
      singleNightTotal - Math.round(singleNightTotal * 0.25),
    )
  })

  it('handles fully points-redeemed stay ($0 total charge)', () => {
    const now = new Date('2026-11-09T15:00:00Z') // 1 day before
    const result = calculateCancellation({
      checkIn,
      now,
      roomRateCents: 16000,
      totalChargeCents: 0,
      nights: 1,
    })

    expect(result.isLate).toBe(true)
    expect(result.feeCents).toBe(0)
    expect(result.refundCents).toBe(0)
  })
})
