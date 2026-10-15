import { prisma } from '../prisma'

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredCity: true,
      rewardPoints: true,
      savedCards: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
      pointLedger: {
        orderBy: { createdAt: 'desc' },
      },
      bookings: {
        include: {
          hotel: true,
          room: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return user
}

export async function updateUserProfile({
  userId,
  name,
  phone,
  preferredCity,
}: {
  userId: string
  name: string
  phone?: string
  preferredCity?: string
}) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      phone,
      preferredCity,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredCity: true,
      rewardPoints: true,
    },
  })
  return updated
}

export async function addPaymentCard({
  userId,
  cardholderName,
  brand,
  cardNumber,
  expMonth,
  expYear,
  isDefault = false,
}: {
  userId: string
  cardholderName: string
  brand: string
  cardNumber: string
  expMonth: number
  expYear: number
  isDefault?: boolean
}) {
  const cleanNumber = cardNumber.replace(/\D/g, '')
  const last4 = cleanNumber.slice(-4) || '4242'

  return await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.paymentCard.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    const card = await tx.paymentCard.create({
      data: {
        userId,
        cardholderName,
        brand: brand.toUpperCase(),
        last4,
        expMonth,
        expYear,
        isDefault,
      },
    })
    return card
  })
}

export async function deletePaymentCard(cardId: string, userId: string) {
  const card = await prisma.paymentCard.findUnique({
    where: { id: cardId },
  })

  if (!card || card.userId !== userId) {
    throw new Error('Payment card not found or unauthorized')
  }

  return await prisma.paymentCard.delete({
    where: { id: cardId },
  })
}
