import { createFileRoute } from '@tanstack/react-router'
import { seedDatabase } from '@/server/seed'

let isBootstrapped = false

async function ensureBootstrapped() {
  if (isBootstrapped) return
  await seedDatabase()
  isBootstrapped = true
}

export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await ensureBootstrapped()
          return Response.json({ status: 'ok', bootstrapped: true })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          return Response.json(
            { status: 'error', error: message },
            { status: 500 },
          )
        }
      },
    },
  },
})
