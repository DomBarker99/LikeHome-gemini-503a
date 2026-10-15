import { describe, it, expect } from 'vitest'
import {
  hasStayOverlap,
  normalizeStayDates,
} from '../../src/server/services/booking-service'

describe('Overlapping Stay Prevention (LH-08)', () => {
  const existingCheckIn = new Date('2026-11-10T15:00:00Z')
  const existingCheckOut = new Date('2026-11-14T11:00:00Z')

  it('detects exact matching stay overlap', () => {
    const { checkIn: newIn, checkOut: newOut } = normalizeStayDates(
      '2026-11-10',
      '2026-11-14',
    )
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('detects stay inside existing stay', () => {
    const { checkIn: newIn, checkOut: newOut } = normalizeStayDates(
      '2026-11-11',
      '2026-11-13',
    )
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('detects partial overlap starting before and ending during existing stay', () => {
    const { checkIn: newIn, checkOut: newOut } = normalizeStayDates(
      '2026-11-08',
      '2026-11-12',
    )
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('detects partial overlap starting during and ending after existing stay', () => {
    const { checkIn: newIn, checkOut: newOut } = normalizeStayDates(
      '2026-11-12',
      '2026-11-16',
    )
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('permits back-to-back stays where check-out equals next check-in (using date-only strings)', () => {
    // Check-out on Nov 10 at 11am, next check-in on Nov 10 at 3pm
    const prior = normalizeStayDates('2026-11-06', '2026-11-10')
    expect(
      hasStayOverlap(
        existingCheckIn,
        existingCheckOut,
        prior.checkIn,
        prior.checkOut,
      ),
    ).toBe(false)

    // Check-out on Nov 14 at 11am, subsequent check-in on Nov 14 at 3pm
    const subsequent = normalizeStayDates('2026-11-14', '2026-11-18')
    expect(
      hasStayOverlap(
        existingCheckIn,
        existingCheckOut,
        subsequent.checkIn,
        subsequent.checkOut,
      ),
    ).toBe(false)
  })

  it('permits non-overlapping stays in different months', () => {
    const future = normalizeStayDates('2026-12-01', '2026-12-05')
    expect(
      hasStayOverlap(
        existingCheckIn,
        existingCheckOut,
        future.checkIn,
        future.checkOut,
      ),
    ).toBe(false)
  })

  it('correctly orders check-in and check-out normalized hours', () => {
    const dates = normalizeStayDates('2026-11-10', '2026-11-14')
    expect(dates.checkIn.getUTCHours()).toBe(15) // 3:00 PM
    expect(dates.checkOut.getUTCHours()).toBe(11) // 11:00 AM
    expect(dates.checkIn < dates.checkOut).toBe(true)
  })
})
