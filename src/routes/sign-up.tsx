import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

interface SignUpSearchParams {
  redirectTo?: string
}

export const Route = createFileRoute('/sign-up')({
  validateSearch: (search: Record<string, unknown>): SignUpSearchParams => ({
    redirectTo: (search.redirectTo as string) || undefined,
  }),
  component: SignUpComponent,
})

function SignUpComponent() {
  const { redirectTo } = Route.useSearch()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await authClient.signUp.email({
        name,
        email,
        password,
        phone: phone.trim() || undefined,
      } as any)

      if (res.error) {
        setError(
          res.error.message ||
            'Could not create account. Email may already be in use.',
        )
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
    <div className="py-12 flex justify-center">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
        {/* Top Tab Switcher */}
        <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1">
          <Link
            to="/sign-in"
            search={{ redirectTo }}
            className="flex-1 py-2 text-center text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            search={{ redirectTo }}
            className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs"
          >
            Create account
          </Link>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            Create an account
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Join LikeHome Rewards and earn 100 points on every night
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-[var(--status-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Alex Rivera"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="alex@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-md transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
