import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('lh-theme') as 'light' | 'dark' | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('lh-theme', next)
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--text-primary)] transition-colors cursor-pointer flex items-center justify-center text-base"
      title={theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
  )
}
