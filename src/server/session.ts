import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'
import { prisma } from './prisma'

export async function getServerSession() {
  try {
    const rawHeaders = getRequestHeaders()
    const headers =
      rawHeaders instanceof Headers ? rawHeaders : new Headers(rawHeaders)

    const session = await auth.api.getSession({
      headers,
    })

    if (!session?.user) return null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        preferredCity: true,
        rewardPoints: true,
      },
    })

    return {
      session: session.session,
      user: user || session.user,
    }
  } catch (err) {
    console.error('[getServerSession error]:', err)
    return null
  }
}
