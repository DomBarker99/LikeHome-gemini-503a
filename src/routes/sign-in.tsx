import { useState, useSyncExternalStore } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

const emptySubscribe = () => () => {}
const useHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

interface SignInSearchParams {
  redirectTo?: string
}

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): SignInSearchParams => ({
    redirectTo: (search.redirectTo as string) || undefined,
  }),
  component: SignInComponent,
})

function SignInComponent() {
  const { redirectTo } = Route.useSearch()
  const router = useRouter()

  const hydrated = useHydrated()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFillDemo = () => {
    setEmail('demo@likehome.dev')
    setPassword('LikeHome2026!')
    setError(null)
    const emailEl = document.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )
    const passEl = document.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )
    if (emailEl) emailEl.value = 'demo@likehome.dev'
    if (passEl) passEl.value = 'LikeHome2026!'
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const submittedEmail = ((formData.get('email') as string) || email).trim()
    const submittedPassword = (formData.get('password') as string) || password

    try {
      const res = await authClient.signIn.email({
        email: submittedEmail,
        password: submittedPassword,
      })

      if (res.error) {
        setError(res.error.message || 'Invalid email or password')
        return
      }

      await router.invalidate()
      window.location.href = redirectTo || '/'
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-hydrated={hydrated ? 'true' : 'false'}
      className="py-12 flex justify-center"
    >
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
        {/* Top Tab Switcher */}
        <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1">
          <Link
            to="/sign-in"
            search={{ redirectTo }}
            className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            search={{ redirectTo }}
            className="flex-1 py-2 text-center text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Create account
          </Link>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Sign in to access your saved reservations and rewards
          </p>
        </div>

        {/* 1-Click Demo Fill Button */}
        <button
          type="button"
          onClick={handleFillDemo}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-[var(--accent-brand)] hover:bg-purple-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⚡</span>
          <span>Fill Demo Customer (demo@likehome.dev)</span>
        </button>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-[var(--status-error)]">
            {error}
          </div>
        )}

        <form method="POST" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Email address
            </label>
            <input
              type="email"
              name="email"
              defaultValue={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              defaultValue={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-md transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
