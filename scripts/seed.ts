import { seedDatabase } from '../src/server/seed'

seedDatabase()
  .then(() => {
    console.log('[Seed] Database successfully seeded!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[Seed] Error seeding database:', err)
    process.exit(1)
  })
