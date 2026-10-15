import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

interface SearchBarProps {
  initialLocation?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  className?: string
  compact?: boolean
}

export function SearchBar({
  initialLocation = '',
  initialCheckIn = '2026-11-10',
  initialCheckOut = '2026-11-14',
  initialGuests = 2,
  className = '',
  compact = false,
}: SearchBarProps) {
  const navigate = useNavigate()
  const [location, setLocation] = useState(initialLocation)
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(initialGuests)

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    const form =
      e?.currentTarget ||
      (typeof document !== 'undefined'
        ? document.querySelector<HTMLFormElement>('form[action="/search"]')
        : null)
    const formData = form ? new FormData(form) : null
    const locVal = ((formData?.get('location') as string) || location).trim()

    navigate({
      to: '/search',
      search: {
        location: locVal || undefined,
        checkIn: (formData?.get('checkIn') as string) || checkIn || undefined,
        checkOut:
          (formData?.get('checkOut') as string) || checkOut || undefined,
        guests: Number(formData?.get('guests')) || (guests > 0 ? guests : 2),
        page: 1,
      },
    })
  }

  return (
    <form
      action="/search"
      method="GET"
      onSubmit={handleSearch}
      className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-lg p-2.5 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center ${className}`}
    >
      {/* Location */}
      <div
        className={`flex flex-col justify-center px-3 py-1.5 rounded-xl border border-transparent focus-within:border-[var(--accent-brand)] ${compact ? 'md:col-span-4' : 'md:col-span-4'}`}
      >
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Location
        </label>
        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where to? (e.g. Los Angeles)"
          className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] placeholder:text-neutral-400 focus:outline-none"
        />
      </div>

      {/* Check-in */}
      <div className="flex flex-col justify-center px-3 py-1.5 rounded-xl border border-transparent focus-within:border-[var(--accent-brand)] md:col-span-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Check-in
        </label>
        <input
          type="date"
          name="checkIn"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
        />
      </div>

      {/* Check-out */}
      <div className="flex flex-col justify-center px-3 py-1.5 rounded-xl border border-transparent focus-within:border-[var(--accent-brand)] md:col-span-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Check-out
        </label>
        <input
          type="date"
          name="checkOut"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
        />
      </div>

      {/* Guests */}
      <div className="flex flex-col justify-center px-3 py-1.5 rounded-xl border border-transparent focus-within:border-[var(--accent-brand)] md:col-span-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Guests
        </label>
        <select
          name="guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
        >
          <option
            value={1}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            1 guest
          </option>
          <option
            value={2}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            2 guests
          </option>
          <option
            value={3}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            3 guests
          </option>
          <option
            value={4}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            4+ guests
          </option>
        </select>
      </div>

      {/* Search Button */}
      <div className="md:col-span-2 flex items-center justify-end">
        <button
          type="submit"
          className="w-full h-11 bg-[var(--accent-brand)] hover:opacity-90 text-white font-bold text-sm rounded-xl px-5 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <span>🔍</span>
          <span>Search</span>
        </button>
      </div>
    </form>
  )
}
