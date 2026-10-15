# Team Open Ocean — Backlog (`OO-00`–`OO-24`), Business Rules & Lofi UI Spec

Read `context/LikeHome-Lofi-Prototype-Handoff.pdf` alongside this document. The PDF is the visual authority for the 12 screens, component hierarchy, and theme tokens.

---

## 1. Visual Design & Theme Tokens (from Lofi Prototype Handoff PDF)

Implement the CSS variables in `src/styles.css` so toggling `data-theme="light"` and `data-theme="dark"` on `<html>` switches the entire UI seamlessly:

### Light Mode (`:root`, `html[data-theme="light"]`)
- `--bg-page`: `#fafafa`
- `--bg-surface`: `#ffffff`
- `--bg-rail`: `#c4b5fd` (soft violet side rails visible on desktop outside the centered `1120px` content frame)
- `--text-primary`: `#18181b`
- `--text-muted`: `#71717a`
- `--border`: `#e4e4e7`
- `--accent`: `#18181b`
- `--accent-brand`: `#6d28d9`
- `--status-success`: `#16a34a`
- `--status-warning`: `#d97706`
- `--status-error`: `#dc2626`

### Dark Mode (`html[data-theme="dark"]`)
- `--bg-page`: `#0b0b0f`
- `--bg-surface`: `#13131a`
- `--bg-rail`: `#2e1065`
- `--text-primary`: `#f4f4f5`
- `--text-muted`: `#a1a1aa`
- `--border`: `#27272a`
- `--accent`: `#f4f4f5`
- `--accent-brand`: `#8b5cf6`
- `--status-success`: `#22c55e`
- `--status-warning`: `#f59e0b`
- `--status-error`: `#ef4444`

### Global Frame (`src/routes/__root.tsx`)
- Sticky top header (`h-16`) with:
  - Left: `⌂ LikeHome` brand link to `/`
  - Right: Theme toggle button (`☀`/`☾`), `MyBooking` nav button (`/my-booking`), and either `Sign in` (`/sign-in`) when logged out or `Account (N pts)` (`/account`) + `Sign out` when logged in.
- Centered `1120px` main canvas (`max-w-[1120px]`) flanked on large viewports by subtle dashed-border side rails (`--bg-rail`).
- Global footer with `© 2026 LikeHome`, `Terms`, `Privacy`, `Support`, and quick links.

---

## 2. The 12 Lofi Screens & Route Map

1. **Screen 1 — Home (`/`)**:
   - Hero section (`Find a place that feels like home.`) with the unified 4-column `SearchBar` (`Location`, `Check-in`, `Check-out`, `Guests` + `Search` button).
   - Quick destination filter pills (`All destinations`, `Los Angeles`, `San Francisco`, `New York`, `Chicago`, `Miami`, `Seattle`, `Austin`, `Boston`).
   - Horizontal scrollable shelf: **Featured discounted hotels** (cards showing `-XX%` discount badge, photo, rating, city/area, crossed-out original price, discounted nightly rate).
   - Horizontal scrollable shelf: **Top-rated stays** (cards showing `Top rated · ★ 9.x` badge, photo, city/area, nightly rate).
2. **Screen 2 — Search Results (`/search`)**:
   - Top `SearchBar` pre-filled with active query params.
   - Left sidebar (`md:col-span-3`):
     - **Interactive Street Map Preview Card** (`Map · click to expand`) above Filters.
     - **Filters card** with checkboxes: `Price (Under $180 / night)`, `Rating (★ 9.0+)`, `Free WiFi`, `Breakfast`, `Discounted`, `Pool`, `Parking`, plus a `Reset all filters` action when active.
   - Right column (`md:col-span-9`):
     - Header count (`N hotels found in "..."`) + Sort dropdown (`Recommended`, `Price: low to high`, `Price: high to low`, `Rating: high to low`).
     - Horizontal `HotelCard` rows (photo thumbnail on left, title, `★ rating · area, city`, short description, amenity tags, nightly price on right).
     - Pagination controls (`24` hotels per page, `Previous` / `Next` + page indicator).
3. **Screen 3 — Expanded Interactive Street Map Modal (`src/components/MapPreviewModal.tsx`)**:
   - Must use **real interactive Leaflet + OpenStreetMap street tiles** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, no API keys or watermarks), with dark-mode tile filter in dark theme.
   - Small preview card (`h-48`) on `/search` and `/hotels/$hotelId` renders real street tiles with spatially separated price pills (`$144`, `$160`, etc.) and a bottom-anchored `Map · click to expand` / `Map` button.
   - Clicking the preview card opens the Expanded Street Map Modal (`max-w-5xl`):
     - Interactive pan, scroll-wheel zoom, `+`/`-` zoom controls.
     - Dynamic pixel-distance marker clustering so price pills never overlap (`N stays · $Price+` cluster pills that zoom into the cluster when clicked, and individual `$Price` pills that highlight purple when selected).
     - **Filter to visible map area** button (appears after panning/zooming) + **Reset map view** button.
     - Right-hand inspector sidebar showing the selected hotel's photo, area/city badge, rating, nightly rate, coordinates, `Open hotel page` button, and a scrollable list of stays in the current map view.
4. **Screen 4 — Hotel Detail (`/hotels/$hotelId`)**:
   - Top `SearchBar` to adjust dates/guests.
   - Hotel title, `★ rating · N-star hotel`, subtitle & neighborhood.
   - 12-column upper grid:
     - 8 columns: Main photo gallery carousel with prev/next buttons (`‹` / `›`), bottom-right photo counter (`1 / N`), and clickable thumbnail strip.
     - 4 columns: **Amenities** card (`✓` list) + address + check-in/check-out times.
   - **Choose a room** section: horizontal room cards showing room name, `Up to N guests`, amenity pills, description, total price (`$XXX.XX total`), per-night breakdown (`$XXX / night · incl. taxes & fees`), and `Selected` / `Select` button.
   - **Sticky reservation bar** (`sticky bottom-0 z-30` full-bleed bar): displays `Room Name · CheckIn–CheckOut · N guests · $Total total` and the primary CTA **`Reserve selected room`**.
     - If signed in → navigates to `/booking`.
     - If signed out → navigates to `/sign-in?redirectTo=/booking?...` so auth preserves the exact reservation selection.
   - Lower 2-column grid:
     - Left: Real Leaflet street map card centered on the hotel (`Map` button opens the expanded street map modal).
     - Right: `Other hotel pics` secondary carousel with `Top-left` badge and `›` cycle button.
   - Bottom full-width card: **Hotel info: description, check-in / check-out times, policies** (Check-in/Check-out, 7-day Cancellation policy, LikeHome Rewards summary).
5. **Screen 5 — Sign In (`/sign-in`) & Screen 6 — Sign Up (`/sign-up`)**:
   - Centered auth card (`max-w-md`) with top tab switcher (`Sign in` | `Create account`) preserving `redirectTo`.
   - `/sign-in` includes a 1-click **`Fill Demo Customer (demo@likehome.dev)`** helper button for fast grading/testing.
6. **Screen 7 — Booking / Checkout (`/booking`)**:
   - Step 1: **Guest info** (`Guest full name`, `Email for confirmation`, `Phone number`, optional `Special requests`).
   - Step 2: **Payment details**:
     - Select an existing saved card (`VISA •••• 4242`) or `Use a new card` (Cardholder name, Brand, Card number, Exp month/year, `Save card for future stays`).
     - **LikeHome Rewards redemption card (`PointsCard`)**: shows user's current points balance (`1,250 pts`), lets them select `0`..`N` free nights (`1,000 pts = 1 free room night`), and shows points to be earned (`+100 pts/night`).
   - Right sidebar: Hotel summary card, itemized price breakdown (`$Rate × N nights`, free-night reward discount if redeemed, `Taxes & fees (12%)`, `Total`), and **`Confirm and pay`** button.
7. **Screen 8 — Overlapping Stay Popup (Modal on `/booking`)**:
   - Triggered automatically when `Confirm and pay` detects an overlapping `UPCOMING` booking on the user's account.
   - Shows conflicting booking confirmation code (`#LH-20481`), hotel name, dates, and actions to **View existing booking** or **Dismiss & pick different dates**.
8. **Screen 9 — Booking Confirmed (`/bookings/$bookingId/confirmed`)**:
   - Confirmation banner with booking code (`#LH-XXXXX`), hotel/room/dates/guests summary, payment method used, net points earned/redeemed, and buttons to **Manage this booking** (`/bookings/$bookingId`) or **Go to MyBooking** (`/my-booking`).
9. **Screen 10 — MyBooking Lookup & List (`/my-booking`)**:
   - Confirmation code search bar (`#LH-20481`) that jumps directly to `/bookings/$bookingId`.
   - Lists all customer bookings (when signed in) with status badges (`Upcoming`, `Completed`, `Cancelled`), dates, total paid, and `Open reservation` links.
10. **Screen 11 — Booking Detail & Change/Cancel Stay (`/bookings/$bookingId`)**:
    - Displays booking status badge, confirmation code, hotel/room details, itemized receipt, and reward points summary.
    - **Change stay** panel (for `UPCOMING` bookings): allows changing room type, check-in date, check-out date, and guests; shows live recalculated total and **`Save stay changes`** button (enforcing overlap check and capacity check).
    - **Demo action**: **`Complete stay (award points)`** button on `UPCOMING` bookings to transition status to `COMPLETED` and credit earned points (`nights * 100`) to the user's balance.
    - **Cancel booking** panel & confirmation modal (Screen 11b):
      - Calculates whether check-in is `>= 7 days` away (100% refund, `$0` fee) or `< 7 days` away (1-night cancellation fee, partial refund).
      - Includes a checkbox **`Simulate within-7-days late cancellation (apply 1-night fee)`** inside the cancel modal so graders can test and verify both free and fee-bearing cancellations regardless of today's wall-clock date.
11. **Screen 12 — Account (`/account`)**:
    - Profile form (`Full name`, `Phone`, `Preferred city` + `Save profile`).
    - **LikeHome Rewards** balance card + chronological points ledger (`EARNED`, `REDEEMED`, `REFUNDED` entries).
    - **Saved payment cards** list with `Add card` and `Remove` actions.
    - **Booking history** tabs/list linking to each reservation.

---

## 3. Database & Catalog Population (`seed-assets/`)

To make the application feel like a real production travel platform without requiring you to scrape data or generate images:
- **`seed-assets/images/hotels/photo-01.webp` … `photo-60.webp`**: Copy these 60 photorealistic WebP images into `public/images/hotels/`.
- **`seed-assets/image-manifest.json`**: Describes each of the 60 photos (`exterior` by US region, `interior-room`, `interior-lounge`).
- **`seed-assets/flagship-hotels.json`**: Contains 16 authored flagship hotels (including `figueroa-downtown-la`, `sunset-marquis-la`, `beverly-garden-la`, `santa-monica-breeze-la`, `pasadena-arroyo-la`, `fairmont-nob-hill-sf`, `soho-cast-iron-ny`, etc.) with 4 rooms each. Keep these 16 flagship hotels at the front of the catalog so featured shelves and page-1 city searches highlight them first.
- **`seed-assets/wikidata-hotels.json`**: Contains 2,984 real US/international hotels sourced from Wikidata/OpenStreetMap with real coordinates, cities, neighborhoods, and star ratings.
- **Total Seeded Catalog**: Combine the 16 flagship hotels + 2,984 Wikidata hotels = **3,000 hotels** and **12,000 rooms** (4 room tiers per hotel: `Standard Queen`, `Double Room`, `Twin Room`, `King Suite`).
- **Deterministic Non-Repeating Photo Rotation**: Assign each hotel a 5-photo gallery (`[exteriorMain, room1, room2, lounge, exteriorAlt]`) rotated deterministically by `(cityIndex, globalIndex)` so adjacent hotels in the same city search results never display the same thumbnail photo.
- **Fast Auto-Bootstrap (`createMany`)**: Ensure your database initialization/seeding uses bulk `createMany({ skipDuplicates: true })` (and idempotent schema creation or migration deployment) so both local Docker Postgres and Railway Postgres populate all 3,000 hotels / 12,000 rooms + the demo user in under 3 seconds on first boot.

### Pre-Seeded Demo Customer Account
Seed this exact demo account automatically so manual demos and E2E tests work out of the box:
- **Email**: `demo@likehome.dev`
- **Password**: `LikeHome2026!`
- **Name**: `Alex Rivera`
- **Starting Reward Points**: `1250` (`1,250 pts`)
- **Saved Payment Card**: `VISA` ending in `4242` (`Alex Rivera`, exp `08/2029`, default)
- **Pre-seeded Reservations**:
  - `#LH-20481`: `UPCOMING` stay at `figueroa-downtown-la` (`2026-11-10` to `2026-11-14`, 2 guests, Double room) — used to test overlapping-stay detection and stay modification/cancellation.
  - `#LH-19204`: `COMPLETED` stay at `fairmont-nob-hill-sf` (`2026-08-12` to `2026-08-15`, 2 guests).
