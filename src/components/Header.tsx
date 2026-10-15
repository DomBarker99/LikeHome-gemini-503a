import { Link, useRouter } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'
import { authClient } from '@/lib/auth-client'

interface HeaderProps {
  user?: {
    id: string
    name: string
    email: string
    rewardPoints?: number | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.invalidate()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md">
      <div className="max-w-[1120px] mx-auto h-full px-4 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-black tracking-tight text-[var(--accent-brand)] hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl leading-none">⌂</span>
          <span>LikeHome</span>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/my-booking"
            className="px-3.5 py-1.5 rounded-lg text-sm font-semibold border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-neutral-400 transition-colors"
          >
            MyBooking
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/account"
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-[var(--accent-brand)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                <span>Account</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-xs font-bold">
                  {(user.rewardPoints ?? 0).toLocaleString()} pts
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/sign-in"
              className="px-4 py-1.5 rounded-lg text-sm font-bold bg-[var(--accent)] text-white dark:text-black dark:bg-white hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
