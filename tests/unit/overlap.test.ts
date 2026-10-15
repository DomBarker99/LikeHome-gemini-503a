import { describe, it, expect } from 'vitest'

function hasStayOverlap(
  checkIn1: Date,
  checkOut1: Date,
  checkIn2: Date,
  checkOut2: Date,
): boolean {
  // Overlap condition: checkIn1 < checkOut2 && checkOut1 > checkIn2
  return checkIn1 < checkOut2 && checkOut1 > checkIn2
}

describe('Overlapping Stay Prevention (LH-08)', () => {
  const existingCheckIn = new Date('2026-11-10T15:00:00Z')
  const existingCheckOut = new Date('2026-11-14T11:00:00Z')

  it('detects exact matching stay overlap', () => {
    const newIn = new Date('2026-11-10T15:00:00Z')
    const newOut = new Date('2026-11-14T11:00:00Z')
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('detects stay inside existing stay', () => {
    const newIn = new Date('2026-11-11T15:00:00Z')
    const newOut = new Date('2026-11-13T11:00:00Z')
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('detects partial overlap starting before and ending during existing stay', () => {
    const newIn = new Date('2026-11-08T15:00:00Z')
    const newOut = new Date('2026-11-12T11:00:00Z')
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('detects partial overlap starting during and ending after existing stay', () => {
    const newIn = new Date('2026-11-12T15:00:00Z')
    const newOut = new Date('2026-11-16T11:00:00Z')
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, newIn, newOut),
    ).toBe(true)
  })

  it('permits back-to-back stays where check-out equals next check-in', () => {
    // Check-out on Nov 10 at 11am, next check-in on Nov 10 at 3pm
    const priorIn = new Date('2026-11-06T15:00:00Z')
    const priorOut = new Date('2026-11-10T11:00:00Z')
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, priorIn, priorOut),
    ).toBe(false)

    // Check-out on Nov 14 at 11am, subsequent check-in on Nov 14 at 3pm
    const subsequentIn = new Date('2026-11-14T15:00:00Z')
    const subsequentOut = new Date('2026-11-18T11:00:00Z')
    expect(
      hasStayOverlap(
        existingCheckIn,
        existingCheckOut,
        subsequentIn,
        subsequentOut,
      ),
    ).toBe(false)
  })

  it('permits non-overlapping stays in different months', () => {
    const futureIn = new Date('2026-12-01T15:00:00Z')
    const futureOut = new Date('2026-12-05T11:00:00Z')
    expect(
      hasStayOverlap(existingCheckIn, existingCheckOut, futureIn, futureOut),
    ).toBe(false)
  })
})
