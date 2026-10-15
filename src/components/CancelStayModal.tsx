import { useState } from 'react'

interface CancelStayModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmCancel: (simulateLateFee: boolean) => Promise<void>
  booking: {
    id: string
    confirmationCode: string
    hotel: { name: string }
    checkIn: string | Date
    nights: number
    roomRateCents: number
    totalChargeCents: number
    pointsRedeemed: number
  }
}

export function CancelStayModal({
  isOpen,
  onClose,
  onConfirmCancel,
  booking,
}: CancelStayModalProps) {
  const [simulateLateFee, setSimulateLateFee] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const now = new Date()
  const checkInDate = new Date(booking.checkIn)
  const daysUntilCheckIn =
    (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

  const isLate = simulateLateFee || daysUntilCheckIn < 7

  let feeCents = 0
  if (isLate) {
    if (booking.nights === 1) {
      feeCents = Math.round(booking.totalChargeCents * 0.25)
    } else {
      feeCents = Math.min(
        booking.totalChargeCents,
        booking.roomRateCents + Math.round(booking.roomRateCents * 0.12),
      )
    }
  }

  const refundCents = Math.max(0, booking.totalChargeCents - feeCents)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirmCancel(simulateLateFee)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Cancel Reservation #{booking.confirmationCode}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-[var(--text-primary)] text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cancellation policy summary */}
        <div className="space-y-4 text-sm text-[var(--text-primary)]">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Cancellation Policy: Free cancellation (100% refund, $0 fee) when
            cancelled 7 or more days prior to check-in. Cancellations within 7
            days incur a 1-night room rate fee.
          </p>

          {/* Refund breakdown card */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50 dark:bg-neutral-900 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Original total charge</span>
              <span className="font-semibold text-[var(--text-primary)]">
                ${(booking.totalChargeCents / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">
                Cancellation fee ({isLate ? '< 7 days' : '>= 7 days'})
              </span>
              <span
                className={`font-bold ${
                  feeCents > 0
                    ? 'text-[var(--status-error)]'
                    : 'text-[var(--status-success)]'
                }`}
              >
                ${(feeCents / 100).toFixed(2)}
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between font-bold text-sm">
              <span>Estimated refund to card</span>
              <span className="text-base text-[var(--status-success)]">
                ${(refundCents / 100).toFixed(2)}
              </span>
            </div>

            {booking.pointsRedeemed > 0 && (
              <div className="pt-1 text-[11px] text-[var(--accent-brand)] font-medium">
                ★ {booking.pointsRedeemed.toLocaleString()} redeemed reward
                points will be refunded to your balance.
              </div>
            )}
          </div>

          {/* Demo test toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={simulateLateFee}
              onChange={(e) => setSimulateLateFee(e.target.checked)}
              className="mt-0.5 rounded text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]"
            />
            <div>
              <span className="font-bold text-[var(--text-primary)] block">
                Simulate within-7-days late cancellation (apply 1-night fee)
              </span>
              <span className="text-[var(--text-muted)] block mt-0.5">
                Class demo / grading toggle to test fee deduction regardless of
                today's date.
              </span>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Keep reservation
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--status-error)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm cancellation'}
          </button>
        </div>
      </div>
    </div>
  )
}
