import { Link } from '@tanstack/react-router'

interface OverlappingStayModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: {
    id?: string
    confirmationCode: string
    hotelName: string
    checkIn: string | Date
    checkOut: string | Date
  } | null
}

export function OverlappingStayModal({
  isOpen,
  onClose,
  conflict,
}: OverlappingStayModalProps) {
  if (!isOpen || !conflict) return null

  const d1 = new Date(conflict.checkIn).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const d2 = new Date(conflict.checkOut).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3 text-[var(--status-warning)] mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Overlapping Stay Detected
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Reservation rule LH-08
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">
          You already have an active upcoming reservation that overlaps with
          these dates on your account:
        </p>

        {/* Conflicting stay card */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold text-[var(--accent-brand)]">
              #{conflict.confirmationCode.replace(/^#/, '')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
              UPCOMING
            </span>
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {conflict.hotelName}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            📅 {d1} – {d2}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {conflict.id ? (
            <Link
              to="/bookings/$bookingId"
              params={{ bookingId: conflict.id }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white text-center hover:opacity-90 shadow-sm transition-opacity"
            >
              View existing reservation →
            </Link>
          ) : (
            <Link
              to="/my-booking"
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white text-center hover:opacity-90 shadow-sm transition-opacity"
            >
              Go to MyBooking →
            </Link>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Dismiss & pick different dates
          </button>
        </div>
      </div>
    </div>
  )
}
