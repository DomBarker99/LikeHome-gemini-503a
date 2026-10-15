import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phone: { type: 'string', required: false },
      preferredCity: { type: 'string', required: false },
      rewardPoints: { type: 'number', required: false, defaultValue: 0 },
    },
  },
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'likehome-default-development-secret-key-32-chars-long',
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.PORT
      ? `http://localhost:${process.env.PORT}`
      : 'http://localhost:3110'),
  trustedOrigins: [
    'http://localhost:3100',
    'http://localhost:3110',
    'http://localhost:3111',
    'http://127.0.0.1:3100',
    'http://127.0.0.1:3110',
    'http://127.0.0.1:3111',
  ],
})
