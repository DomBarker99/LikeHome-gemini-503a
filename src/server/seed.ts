import fs from 'node:fs'
import path from 'node:path'
import { prisma } from './prisma'
import { auth } from './auth'

interface FlagshipRoom {
  id: string
  name: string
  description: string
  amenities: string[]
  maxGuests: number
  baseNightlyRateCents: number
  nightlyRateCents: number
  sortOrder: number
}

interface FlagshipHotel {
  id: string
  name: string
  city: string
  area: string
  address: string
  shortDescription: string
  description: string
  rating: number
  stars: number
  discountPercent: number
  amenities: string[]
  images: string[]
  latitude: number
  longitude: number
  checkInTime: string
  checkOutTime: string
  timezone: string
  featuredTopRated: boolean
  featuredDiscounted: boolean
  rooms: FlagshipRoom[]
}

interface WikidataHotel {
  id: string
  name: string
  city: string
  area: string
  country: string
  lat: number
  lng: number
  stars: number
  baseDollars: number
  region: string
  tz: string
}

interface ImageManifestItem {
  file: string
  type: 'exterior' | 'interior-room' | 'interior-lounge'
  region?: string
  description?: string
}

export async function seedDatabase(options?: { force?: boolean }) {
  console.log('[Seed] Checking database seed status...')

  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "hotel" LIMIT 1')
  } catch {
    console.log(
      '[Seed] Database tables do not exist yet. Running prisma db push...',
    )
    const { execSync } = await import('node:child_process')
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' })
  }

  const hotelCount = await prisma.hotel.count()
  if (hotelCount < 3000 || options?.force) {
    console.log(`[Seed] Found ${hotelCount} hotels. Seeding catalog...`)

    const cwd = process.cwd()
    const flagshipPath = path.resolve(cwd, 'seed-assets/flagship-hotels.json')
    const wikidataPath = path.resolve(cwd, 'seed-assets/wikidata-hotels.json')
    const manifestPath = path.resolve(cwd, 'seed-assets/image-manifest.json')

    const flagship: FlagshipHotel[] = JSON.parse(
      fs.readFileSync(flagshipPath, 'utf8'),
    )
    const wikidata: WikidataHotel[] = JSON.parse(
      fs.readFileSync(wikidataPath, 'utf8'),
    )
    const manifest: ImageManifestItem[] = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    )

    const exteriors = manifest.filter((m) => m.type === 'exterior')
    const rooms = manifest.filter((m) => m.type === 'interior-room')
    const lounges = manifest.filter((m) => m.type === 'interior-lounge')

    // Find all unique cities
    const uniqueCities = Array.from(new Set(wikidata.map((w) => w.city)))
    const cityIndexMap = new Map<string, number>()
    uniqueCities.forEach((city, index) => cityIndexMap.set(city, index))

    const hotelsToInsert = []
    const roomsToInsert = []

    // 1. Process 16 Flagship hotels
    for (const f of flagship) {
      const minRoomPrice = Math.min(...f.rooms.map((r) => r.nightlyRateCents))
      hotelsToInsert.push({
        id: f.id,
        name: f.name,
        city: f.city,
        area: f.area,
        address: f.address,
        country: 'United States',
        shortDescription: f.shortDescription,
        description: f.description,
        rating: f.rating,
        stars: f.stars,
        basePrice: minRoomPrice / 100,
        discountPercent: f.discountPercent || 0,
        amenities: f.amenities,
        images: f.images,
        latitude: f.latitude,
        longitude: f.longitude,
        checkInTime: f.checkInTime || '3:00 pm',
        checkOutTime: f.checkOutTime || '11:00 am',
        timezone: f.timezone || 'America/Los_Angeles',
        featuredTopRated: f.featuredTopRated,
        featuredDiscounted: f.featuredDiscounted,
      })

      for (const r of f.rooms) {
        roomsToInsert.push({
          id: r.id,
          hotelId: f.id,
          name: r.name,
          description: r.description,
          amenities: r.amenities,
          maxGuests: r.maxGuests,
          baseNightlyRateCents: r.baseNightlyRateCents,
          nightlyRateCents: r.nightlyRateCents,
          sortOrder: r.sortOrder,
        })
      }
    }

    // 2. Process 2,984 Wikidata hotels
    for (let i = 0; i < wikidata.length; i++) {
      const w = wikidata[i]
      const cityIdx = cityIndexMap.get(w.city) ?? 0

      // Non-repeating deterministic photo rotation
      const ext1 = exteriors[(cityIdx * 7 + i) % exteriors.length].file
      const r1 = rooms[(cityIdx * 5 + i) % rooms.length].file
      const r2 = rooms[(cityIdx * 5 + i + 4) % rooms.length].file
      const lounge = lounges[(cityIdx * 3 + i) % lounges.length].file
      const ext2 = exteriors[(cityIdx * 7 + i + 17) % exteriors.length].file

      const hotelImages = [ext1, r1, r2, lounge, ext2]

      const rating =
        w.stars >= 5
          ? Math.round((9.2 + ((i * 7) % 7) * 0.1) * 10) / 10
          : w.stars === 4
            ? Math.round((8.2 + ((i * 11) % 15) * 0.1) * 10) / 10
            : Math.round((7.4 + ((i * 13) % 15) * 0.1) * 10) / 10

      const discountPercent = i % 4 === 0 ? 15 + ((i * 3) % 4) * 5 : 0
      const featuredTopRated = rating >= 9.2 && i % 12 === 0
      const featuredDiscounted = discountPercent > 0 && i % 10 === 0

      const amenities = ['WiFi', 'Air conditioning']
      if (i % 2 === 0) amenities.push('Breakfast')
      if (i % 3 === 0) amenities.push('Pool')
      if (i % 4 === 0) amenities.push('Parking')
      if (i % 5 === 0) amenities.push('Pet friendly')

      const address = `${100 + ((i * 47) % 8900)} ${w.area} Blvd, ${w.city}, United States`
      const shortDesc = `A welcoming ${w.stars}-star stay in ${w.area}, ${w.city}, offering modern amenities and exceptional comfort.`
      const desc = `Located in the vibrant ${w.area} neighborhood of ${w.city}, ${w.name} provides stylish accommodations, easy access to local destinations, and seamless booking with LikeHome Rewards.`

      hotelsToInsert.push({
        id: w.id,
        name: w.name,
        city: w.city,
        area: w.area,
        address,
        country: w.country || 'United States',
        shortDescription: shortDesc,
        description: desc,
        rating,
        stars: w.stars,
        basePrice: w.baseDollars,
        discountPercent,
        amenities,
        images: hotelImages,
        latitude: w.lat,
        longitude: w.lng,
        checkInTime: '3:00 pm',
        checkOutTime: '11:00 am',
        timezone: w.tz || 'America/Los_Angeles',
        featuredTopRated,
        featuredDiscounted,
      })

      // 4 room tiers
      const standardRate =
        discountPercent > 0
          ? Math.round(w.baseDollars * 100 * (1 - discountPercent / 100))
          : w.baseDollars * 100

      const doubleRate =
        discountPercent > 0
          ? Math.round(w.baseDollars * 1.15 * 100 * (1 - discountPercent / 100))
          : Math.round(w.baseDollars * 1.15 * 100)

      const twinRate =
        discountPercent > 0
          ? Math.round(w.baseDollars * 0.95 * 100 * (1 - discountPercent / 100))
          : Math.round(w.baseDollars * 0.95 * 100)

      const kingRate =
        discountPercent > 0
          ? Math.round(w.baseDollars * 1.5 * 100 * (1 - discountPercent / 100))
          : Math.round(w.baseDollars * 1.5 * 100)

      roomsToInsert.push(
        {
          id: `${w.id}-queen`,
          hotelId: w.id,
          name: 'Standard Queen',
          description:
            'Quiet queen room featuring plush pillow-top mattress, fast WiFi, and rainfall shower.',
          amenities: ['WiFi', 'Air conditioning'],
          maxGuests: 2,
          baseNightlyRateCents: w.baseDollars * 100,
          nightlyRateCents: standardRate,
          sortOrder: 1,
        },
        {
          id: `${w.id}-double`,
          hotelId: w.id,
          name: 'Double Room',
          description:
            'Two full-size double beds with ergonomic desk, fast WiFi, and city views.',
          amenities: ['WiFi', 'Breakfast', 'Air conditioning'],
          maxGuests: 2,
          baseNightlyRateCents: Math.round(w.baseDollars * 1.15 * 100),
          nightlyRateCents: doubleRate,
          sortOrder: 2,
        },
        {
          id: `${w.id}-twin`,
          hotelId: w.id,
          name: 'Twin Room',
          description:
            'Two twin beds ideal for companions, private bath, and mini refrigerator.',
          amenities: ['WiFi', 'Air conditioning'],
          maxGuests: 2,
          baseNightlyRateCents: Math.round(w.baseDollars * 0.95 * 100),
          nightlyRateCents: twinRate,
          sortOrder: 3,
        },
        {
          id: `${w.id}-king`,
          hotelId: w.id,
          name: 'King Suite',
          description:
            'Spacious corner king suite with separate sitting parlor, Nespresso bar, and deep soaking tub.',
          amenities: [
            'WiFi',
            'Breakfast',
            'Pool',
            'Parking',
            'Air conditioning',
          ],
          maxGuests: 4,
          baseNightlyRateCents: Math.round(w.baseDollars * 1.5 * 100),
          nightlyRateCents: kingRate,
          sortOrder: 4,
        },
      )
    }

    // Insert hotels in batches of 500
    for (let i = 0; i < hotelsToInsert.length; i += 500) {
      const chunk = hotelsToInsert.slice(i, i + 500)
      await prisma.hotel.createMany({
        data: chunk,
        skipDuplicates: true,
      })
    }

    // Insert rooms in batches of 1000
    for (let i = 0; i < roomsToInsert.length; i += 1000) {
      const chunk = roomsToInsert.slice(i, i + 1000)
      await prisma.room.createMany({
        data: chunk,
        skipDuplicates: true,
      })
    }

    console.log(
      `[Seed] Successfully seeded ${hotelsToInsert.length} hotels and ${roomsToInsert.length} rooms!`,
    )
  }

  // 3. Demo User Setup
  const demoEmail = 'demo@likehome.dev'
  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  })

  if (!demoUser) {
    console.log('[Seed] Creating pre-seeded demo user (Alex Rivera)...')
    const authRes = await auth.api.signUpEmail({
      body: {
        name: 'Alex Rivera',
        email: demoEmail,
        password: 'LikeHome2026!',
      },
    })

    demoUser = await prisma.user.update({
      where: { id: authRes.user.id },
      data: {
        phone: '(555) 234-5678',
        preferredCity: 'Los Angeles',
        rewardPoints: 1250,
      },
    })

    // Saved payment card
    await prisma.paymentCard.create({
      data: {
        userId: demoUser.id,
        cardholderName: 'Alex Rivera',
        brand: 'VISA',
        last4: '4242',
        expMonth: 8,
        expYear: 2029,
        isDefault: true,
      },
    })

    // Pre-seeded upcoming booking #LH-20481
    // Figueroa Downtown: 2026-11-10 to 2026-11-14 (4 nights, 2 guests, Double room)
    const booking1 = await prisma.booking.create({
      data: {
        confirmationCode: 'LH-20481',
        userId: demoUser.id,
        hotelId: 'figueroa-downtown-la',
        roomId: 'figueroa-downtown-la-double',
        checkIn: new Date('2026-11-10T15:00:00.000Z'),
        checkOut: new Date('2026-11-14T11:00:00.000Z'),
        nights: 4,
        guests: 2,
        guestName: 'Alex Rivera',
        guestEmail: demoEmail,
        guestPhone: '(555) 234-5678',
        specialRequests: 'High floor preferred, away from elevator.',
        roomRateCents: 16000,
        roomSubtotalCents: 64000,
        rewardDiscountCents: 0,
        taxesAndFeesCents: 7680,
        totalChargeCents: 71680,
        pointsRedeemed: 0,
        pointsEarned: 400,
        status: 'UPCOMING',
        paymentBrand: 'VISA',
        paymentLast4: '4242',
      },
    })

    // Pre-seeded completed booking #LH-19204
    // Fairmont Nob Hill: 2026-08-12 to 2026-08-15 (3 nights, 2 guests)
    const booking2 = await prisma.booking.create({
      data: {
        confirmationCode: 'LH-19204',
        userId: demoUser.id,
        hotelId: 'fairmont-nob-hill-sf',
        roomId: 'fairmont-nob-hill-sf-double',
        checkIn: new Date('2026-08-12T15:00:00.000Z'),
        checkOut: new Date('2026-08-15T11:00:00.000Z'),
        nights: 3,
        guests: 2,
        guestName: 'Alex Rivera',
        guestEmail: demoEmail,
        guestPhone: '(555) 234-5678',
        roomRateCents: 21000,
        roomSubtotalCents: 63000,
        rewardDiscountCents: 0,
        taxesAndFeesCents: 7560,
        totalChargeCents: 70560,
        pointsRedeemed: 0,
        pointsEarned: 300,
        status: 'COMPLETED',
        paymentBrand: 'VISA',
        paymentLast4: '4242',
      },
    })

    // Point ledger entries totaling 1,250 points
    await prisma.pointTransaction.createMany({
      data: [
        {
          userId: demoUser.id,
          amount: 950,
          type: 'BONUS',
          description: 'Welcome bonus reward points',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
        },
        {
          userId: demoUser.id,
          bookingId: booking2.id,
          amount: 300,
          type: 'EARNED',
          description:
            'Earned points for stay at Nob Hill Crown Palace (#LH-19204)',
          createdAt: new Date('2026-08-15T12:00:00.000Z'),
        },
      ],
    })

    console.log(
      `[Seed] Pre-seeded demo customer ${demoEmail} and reservations #${booking1.confirmationCode}, #${booking2.confirmationCode}!`,
    )
  }

  console.log('[Seed] Database initialization complete.')
}
