import { useState } from 'react'

interface RoomOption {
  id: string
  name: string
  maxGuests: number
  nightlyRateCents: number
}

interface ChangeStayModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    roomId: string
    checkIn: string
    checkOut: string
    guests: number
  }) => Promise<void>
  availableRooms: RoomOption[]
  currentRoomId: string
  initialCheckIn: string
  initialCheckOut: string
  initialGuests: number
}

export function ChangeStayModal({
  isOpen,
  onClose,
  onSave,
  availableRooms,
  currentRoomId,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: ChangeStayModalProps) {
  const [roomId, setRoomId] = useState(currentRoomId)
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(initialGuests)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const selectedRoom =
    availableRooms.find((r) => r.id === roomId) || availableRooms[0]

  // Calculate live preview
  let nights = 1
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    nights = Math.max(
      1,
      Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
    )
  }

  const roomSubtotalCents = nights * selectedRoom.nightlyRateCents
  const taxesAndFeesCents = Math.round(roomSubtotalCents * 0.12)
  const totalCents = roomSubtotalCents + taxesAndFeesCents

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (guests > selectedRoom.maxGuests) {
      setError(`Selected room allows up to ${selectedRoom.maxGuests} guests`)
      return
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out date must be after check-in date')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        roomId,
        checkIn,
        checkOut,
        guests,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Change Reservation Stay
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-[var(--text-primary)] text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-[var(--status-error)] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
              Room Type
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            >
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (${(r.nightlyRateCents / 100).toFixed(0)}/nt · Up to{' '}
                  {r.maxGuests} guests)
                </option>
              ))}
            </select>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
              />
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            >
              <option value={1}>1 guest</option>
              <option value={2}>2 guests</option>
              <option value={3}>3 guests</option>
              <option value={4}>4 guests</option>
            </select>
          </div>

          {/* Price Recalculation Preview */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50 dark:bg-neutral-900 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                ${(selectedRoom.nightlyRateCents / 100).toFixed(0)} × {nights}{' '}
                {nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                ${(roomSubtotalCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Taxes & fees (12%)</span>
              <span className="font-semibold text-[var(--text-primary)]">
                ${(taxesAndFeesCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between font-bold text-sm">
              <span>New total charge</span>
              <span className="text-base text-[var(--accent-brand)]">
                ${(totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save stay changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
