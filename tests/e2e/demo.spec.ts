import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function signInAsDemo(page: any) {
  await page.goto('/sign-in')
  await page
    .locator('[data-hydrated="true"]')
    .first()
    .waitFor({ state: 'attached' })
  await page.getByRole('button', { name: /Fill Demo Customer/i }).click()
  await page.getByRole('button', { name: /^Sign in$/i }).click()
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 })
}

test.describe('LikeHome Class Demo & Core E2E Walkthrough', () => {
  test.beforeEach(async () => {
    // Reset non-seeded reservations so tests are fully idempotent
    await prisma.booking.deleteMany({
      where: {
        confirmationCode: {
          notIn: ['LH-20481', 'LH-19204'],
        },
      },
    })
  })
  test('Step 1: Search for hotels in Los Angeles, filter results, and inspect interactive street map', async ({
    page,
  }) => {
    // 1. Visit Home
    await page.goto('/')
    await expect(page).toHaveTitle(/LikeHome/)
    await expect(page.locator('h1')).toContainText(
      /Find a place that feels like home/i,
    )

    // 2. Search for Los Angeles
    const destinationInput = page.locator('input[name="location"]')
    await destinationInput.fill('Los Angeles')

    const searchButton = page.getByRole('button', { name: /Search/i })
    await searchButton.click()

    // 3. Verify search results page
    await expect(page).toHaveURL(/\/search\?.*location=Los\+Angeles/i)
    await expect(page.locator('text=found in "Los Angeles"')).toBeVisible()

    // Verify hotel cards rendered
    const hotelCards = page.locator('article, .group')
    await expect(hotelCards.first()).toBeVisible()

    // Ensure client hydration is complete
    await page.locator('[data-hydrated="true"]').waitFor({ state: 'attached' })

    // 4. Open and inspect interactive street map modal (Screen 3)
    const mapExpandBtn = page.getByRole('button', {
      name: /Map · click to expand/i,
    })
    await expect(mapExpandBtn).toBeVisible()
    await mapExpandBtn.click()

    // Leaflet container should be visible inside modal
    const leafletContainer = page.locator('.leaflet-container')
    await expect(leafletContainer.first()).toBeVisible()

    // Close modal
    const closeBtn = page.getByLabel('Close map modal')
    await closeBtn.click()
    await expect(closeBtn).not.toBeVisible()
  })

  test('Step 2 & 3: View hotel detail, reserve room, authenticate via 1-click Demo Customer, and arrive at Checkout', async ({
    page,
  }) => {
    // 1. Navigate to flagship hotel detail (Screen 4)
    await page.goto('/hotels/figueroa-downtown-la')
    await expect(page.locator('h1')).toContainText(/Hotel Figueroa Downtown/i)

    // Verify rooms section exists
    await expect(page.locator('text=Choose a room')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Double room' }),
    ).toBeVisible()

    // 2. Click Reserve on sticky bar while logged out -> triggers auth redirect to /sign-in
    await page.getByRole('link', { name: /Reserve selected room/i }).click()

    // 3. Should land on Sign In page with redirectTo parameter preserved (Screen 5)
    await expect(page).toHaveURL(/\/sign-in\?redirectTo=/i)
    await page
      .locator('[data-hydrated="true"]')
      .first()
      .waitFor({ state: 'attached' })

    // 4. Click 1-Click Demo Fill button and sign in
    await page.getByRole('button', { name: /Fill Demo Customer/i }).click()
    await page.getByRole('button', { name: /^Sign in$/i }).click()

    // 5. Preserved redirect leads directly to Booking Checkout (Screen 7)
    await expect(page).toHaveURL(/\/booking\?/, { timeout: 10000 })
    await expect(page.locator('h1')).toContainText(/Confirm and Pay/i)
  })

  test('Step 4: Complete checkout with points display & saved card, and verify confirmation', async ({
    page,
  }) => {
    // 1. Sign in first
    await signInAsDemo(page)

    // 2. Go to booking checkout with non-overlapping dates in December 2026
    await page.goto(
      '/booking?hotelId=santa-monica-breeze-la&roomId=santa-monica-breeze-la-double&checkIn=2026-12-15&checkOut=2026-12-18&guests=2',
    )

    await expect(page.locator('h1')).toContainText(/Confirm and Pay/i)

    // Verify guest info is pre-filled for Alex Rivera
    await expect(
      page.locator(
        'input[name="guestName"], input#guestName, input[value="Alex Rivera"]',
      ),
    ).toBeVisible()

    // Verify rewards banner shows 1,250 points
    await expect(page.getByRole('main').getByText('1,250 pts')).toBeVisible()

    // Verify saved card option exists (VISA 4242)
    await expect(page.locator('text=4242')).toBeVisible()

    // Confirm booking
    const confirmBtn = page.getByRole('button', { name: /Confirm and pay/i })
    await confirmBtn.click()

    // 3. Lands on Confirmation Page (Screen 9)
    await page.waitForURL(/\/bookings\/.*\/confirmed/, { timeout: 10000 })
    await expect(page.locator('h1')).toContainText(/Reservation Confirmed!/i)
    await expect(page.locator('text=Santa Monica Ocean Breeze')).toBeVisible()
  })

  test('Step 5: Enforce overlapping stay prevention LH-08 blocking popup', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page)

    // 2. Attempt booking that conflicts with #LH-20481 (2026-11-10 to 2026-11-14)
    // Trying dates 2026-11-12 to 2026-11-15
    await page.goto(
      '/booking?hotelId=sunset-marquis-la&roomId=sunset-marquis-la-double&checkIn=2026-11-12&checkOut=2026-11-15&guests=2',
    )

    // Click Confirm and Pay
    const confirmBtn = page.getByRole('button', { name: /Confirm and pay/i })
    await confirmBtn.click()

    // 3. Overlapping Stay Modal (Screen 8) must appear
    const modal = page.locator('text=Overlapping Stay Detected')
    await expect(modal).toBeVisible()
    await expect(page.locator('text=LH-20481')).toBeVisible()

    // Can dismiss the modal
    const dismissBtn = page.getByRole('button', {
      name: /Dismiss & pick different dates/i,
    })
    await dismissBtn.click()
    await expect(modal).not.toBeVisible()
  })

  test('Step 6: MyBooking list, booking details, change stay modal, and cancellation fee simulation', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page)

    // 2. Visit MyBooking (Screen 10)
    await page.goto('/my-booking')
    await expect(page.locator('h1')).toContainText(/MyBooking/i)
    await expect(page.locator('text=LH-20481')).toBeVisible()
    await expect(page.locator('text=LH-19204')).toBeVisible()

    // 3. Click into upcoming booking #LH-20481 (Screen 11)
    await page
      .getByRole('link', { name: /Open reservation/i })
      .last()
      .click()
    await expect(page.locator('h1')).toContainText(/Hotel Figueroa Downtown/i)
    await expect(page.locator('text=LH-20481').first()).toBeVisible()

    // 4. Test Change Stay modal (Screen 11a)
    const changeBtn = page.getByRole('button', { name: /Change stay/i })
    await expect(changeBtn).toBeVisible()
    await changeBtn.click()

    const changeModal = page.locator('text=Change Reservation Stay')
    await expect(changeModal).toBeVisible()
    // Close modal
    await page.getByRole('button', { name: /Cancel$/i }).click()
    await expect(changeModal).not.toBeVisible()

    // 5. Test Cancel Stay modal with 7-day fee simulation (Screen 11b)
    const cancelBtn = page.getByRole('button', {
      name: /Cancel reservation/i,
    })
    await expect(cancelBtn).toBeVisible()
    await cancelBtn.click()

    const cancelModal = page.getByRole('heading', {
      name: /Cancel Reservation/i,
    })
    await expect(cancelModal).toBeVisible()
    await expect(page.locator('text=Free cancellation')).toBeVisible()

    // Toggle fee simulation checkbox
    const simCheckbox = page.locator('input[type="checkbox"]').last()
    if (await simCheckbox.isVisible()) {
      await simCheckbox.check()
      await expect(
        page.locator('text=Simulate within-7-days late cancellation'),
      ).toBeVisible()
    }

    // Close cancel modal without cancelling pre-seeded booking
    await page.getByRole('button', { name: /Keep reservation/i }).click()
    await expect(cancelModal).not.toBeVisible()
  })
})
