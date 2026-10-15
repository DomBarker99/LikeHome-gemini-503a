import { useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import {
  getCurrentUserFn,
  getUserProfileFn,
  updateProfileFn,
  addCardFn,
  deleteCardFn,
} from '@/server/functions'

export const Route = createFileRoute('/account')({
  loader: async ({ location }) => {
    const session = await getCurrentUserFn()
    if (!session?.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirectTo: location.href,
        },
      })
    }

    const profile = await getUserProfileFn()
    return {
      user: session.user,
      profile,
    }
  },
  component: AccountComponent,
})

function AccountComponent() {
  const { user, profile } = Route.useLoaderData()
  const router = useRouter()

  // Profile Form State
  const [name, setName] = useState(profile?.name || user.name || '')
  const [phone, setPhone] = useState(profile?.phone || user.phone || '')
  const [preferredCity, setPreferredCity] = useState(
    profile?.preferredCity || user.preferredCity || '',
  )
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  // Add Card State
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardholderName, setCardholderName] = useState(profile?.name || '')
  const [cardBrand, setCardBrand] = useState('VISA')
  const [cardNumber, setCardNumber] = useState('')
  const [expMonth, setExpMonth] = useState(8)
  const [expYear, setExpYear] = useState(2029)
  const [isDefault, setIsDefault] = useState(false)
  const [cardSaving, setCardSaving] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      await updateProfileFn({
        data: {
          name,
          phone: phone.trim() || undefined,
          preferredCity: preferredCity.trim() || undefined,
        },
      })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
      router.invalidate()
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardSaving(true)
    try {
      await addCardFn({
        data: {
          cardholderName,
          brand: cardBrand,
          cardNumber,
          expMonth,
          expYear,
          isDefault,
        },
      })
      setShowAddCard(false)
      setCardNumber('')
      router.invalidate()
    } finally {
      setCardSaving(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to remove this saved payment method?'))
      return
    await deleteCardFn({ data: cardId })
    router.invalidate()
  }

  const savedCards = profile?.savedCards || []
  const pointLedger = profile?.pointLedger || []
  const bookings = profile?.bookings || []

  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Account & Rewards Profile
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage your personal details, rewards ledger, and saved cards
        </p>
      </div>

      {/* LikeHome Rewards Card & Ledger */}
      <section className="space-y-4">
        <div className="p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-purple-500/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-brand)] text-white text-2xl font-black flex items-center justify-center shadow-sm">
              ★
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-brand)]">
                LikeHome Rewards
              </span>
              <h2 className="text-xl font-black text-[var(--text-primary)]">
                Member Points Balance
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                1,000 points = 1 free room night at checkout
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-3xl md:text-4xl font-black text-[var(--accent-brand)] block">
              {(profile?.rewardPoints ?? 0).toLocaleString()} pts
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
              Earn 100 points per completed night
            </span>
          </div>
        </div>

        {/* Chronological Points Transaction Ledger */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            Rewards Points Ledger
          </h3>

          {pointLedger.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-3">
              No reward point transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-semibold">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 pl-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pointLedger.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    >
                      <td className="py-2.5 pr-3 text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'EARNED' || tx.type === 'BONUS'
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : tx.type === 'REDEEMED'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                        {tx.description}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            tx.amount > 0
                              ? 'text-[var(--status-success)]'
                              : 'text-[var(--accent-brand)]'
                          }
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Profile Form */}
      <section className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          Profile Details
        </h2>

        {profileSuccess && (
          <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/10 text-xs font-bold text-[var(--status-success)]">
            ✓ Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Email address
              </label>
              <input
                type="email"
                value={profile?.email || user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-neutral-100 dark:bg-neutral-900 text-sm font-semibold text-[var(--text-muted)] cursor-not-allowed"
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
                placeholder="(555) 234-5678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Preferred city
              </label>
              <input
                type="text"
                value={preferredCity}
                onChange={(e) => setPreferredCity(e.target.value)}
                placeholder="e.g. Los Angeles, San Francisco"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-brand)]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>

      {/* Saved Payment Cards */}
      <section className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Saved Payment Cards
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Only non-sensitive metadata and last 4 digits are stored
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCard(!showAddCard)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-neutral-400 transition-colors cursor-pointer"
          >
            {showAddCard ? 'Cancel' : '+ Add card'}
          </button>
        </div>

        {/* Add Card Form */}
        {showAddCard && (
          <form
            onSubmit={handleAddCard}
            className="p-4 rounded-xl border border-[var(--border)] bg-neutral-50 dark:bg-neutral-900 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Add Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                  Cardholder name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                  Brand
                </label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="VISA">VISA</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">American Express</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                  Card number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  placeholder="4242 •••• •••• 4242"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                  Exp month
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={expMonth}
                  onChange={(e) => setExpMonth(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                  Exp year
                </label>
                <input
                  type="number"
                  min={2026}
                  max={2040}
                  value={expYear}
                  onChange={(e) => setExpYear(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-[var(--accent-brand)]"
                  />
                  <span>Make default card</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={cardSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--accent-brand)] text-white hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
              >
                {cardSaving ? 'Adding...' : 'Save card'}
              </button>
            </div>
          </form>
        )}

        {/* Cards List */}
        {savedCards.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-2">
            No saved cards. Add a card above for faster checkouts.
          </p>
        ) : (
          <div className="space-y-2.5">
            {savedCards.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {c.brand} •••• {c.last4}
                      </span>
                      {c.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-muted)]">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                      {c.cardholderName} · Exp {c.expMonth}/{c.expYear}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCard(c.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--status-error)] hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking History Section */}
      <section className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Booking History ({bookings.length})
          </h2>
          <Link
            to="/my-booking"
            className="text-xs font-bold text-[var(--accent-brand)] hover:underline"
          >
            MyBooking full view →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-2">
            No booking history yet.
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                to="/bookings/$bookingId"
                params={{ bookingId: b.id }}
                className="p-3.5 rounded-xl border border-[var(--border)] hover:border-neutral-400 transition-all flex items-center justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--accent-brand)]">
                      #{b.confirmationCode.replace(/^#/, '')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'UPCOMING'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : b.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors mt-1">
                    {b.hotel.name}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    ${(b.totalChargeCents / 100).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                    View stay →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
