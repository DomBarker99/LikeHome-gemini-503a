import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[var(--bg-surface)] py-12">
      <div className="max-w-[1120px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[var(--text-muted)]">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-1.5 font-bold text-base text-[var(--text-primary)]">
            <span className="text-[var(--accent-brand)]">⌂</span> LikeHome
          </div>
          <p>
            © 2026 LikeHome Technologies Inc. CMPE 165 Software Engineering.
          </p>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link
            to="/"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Home
          </Link>
          <Link
            to="/my-booking"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            MyBooking Lookup
          </Link>
          <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors">
            Terms of Service
          </span>
          <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors">
            Privacy Policy
          </span>
          <span className="cursor-pointer hover:text-[var(--text-primary)] transition-colors">
            Support
          </span>
        </div>
      </div>
    </footer>
  )
}
