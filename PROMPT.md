# Agent Task Prompt — Build, Populate, Verify & Deploy LikeHome End-to-End

Copy and paste the prompt below to start any agent inside `/Users/dominicbarker/LikeHome-bench`:

---

```text
You are starting inside `/Users/dominicbarker/LikeHome-bench`, which is a shared, read-only benchmark template. Another coding agent is running this benchmark concurrently on the same machine.

### Step 0 — Mandatory Multi-Agent Workspace & Resource Isolation
1. Do NOT modify files, run `npm ci`, or build directly inside `/Users/dominicbarker/LikeHome-bench`.
2. Generate a unique run identifier `RUN_ID="<your-model-or-agent-name>-$(openssl rand -hex 2)"` (e.g., `claude-7f3a` or `codex-4b9c`).
3. Copy `/Users/dominicbarker/LikeHome-bench` to your own dedicated workspace `/Users/dominicbarker/LikeHome-runs/likehome-${RUN_ID}` and perform all work inside `/Users/dominicbarker/LikeHome-runs/likehome-${RUN_ID}` (using `/tmp/likehome-${RUN_ID}/` for any temporary scratch files).
4. Strict boundary rule: Do NOT read, search, or copy from `/Users/dominicbarker/LikeHome`, `/Users/dominicbarker/Desktop`, any sibling folder inside `/Users/dominicbarker/LikeHome-runs/`, or any existing `LikeHome*` GitHub repo / Railway project. You must build the entire application from scratch from the starter template.
5. Because another agent may be running concurrently:
   - Probe for an unused local TCP port in `5435..5499` for your Docker Compose PostgreSQL container (`likehome-${RUN_ID}-postgres`).
   - Probe for an unused local TCP port in `3100..3199` for your local dev/Playwright server.
   - Create your own new GitHub repository named `DomBarker99/LikeHome-${RUN_ID}`.
   - Create your own new Railway project named `LikeHome-${RUN_ID}`.

### Step 1 — Read the Project Specifications
Inside your copied workspace (`/Users/dominicbarker/LikeHome-runs/likehome-${RUN_ID}`), read:
- `AGENTS.md` and `README.md`
- `context/LikeHome-Lofi-Prototype-Handoff.pdf` (all 17 pages — visual layout & theme authority)
- `context/course-requirements-sow.md` (`LH-01` through `LH-13`)
- `context/team-backlog-and-rules.md` (12 screens, business rules, interactive street map spec, and seed data instructions)
- `seed-assets/` (`flagship-hotels.json`, `wikidata-hotels.json`, `image-manifest.json`, and the 60 WebP photos in `seed-assets/images/hotels/`)

### Step 2 — Build the Full-Stack Application from Scratch
- Stack: TanStack Start + React 19 + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL + Better Auth + Leaflet (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
- Database catalog: Seed all 3,000 hotels (16 flagship hotels from `seed-assets/flagship-hotels.json` + 2,984 real hotels from `seed-assets/wikidata-hotels.json`) and 12,000 rooms (4 rooms per hotel), copying the 60 WebP photos from `seed-assets/images/hotels/` into `public/images/hotels/` with deterministic regional photo rotation so adjacent hotels in city search results do not repeat thumbnails. Auto-bootstrap the schema and seed data idempotently on server startup using bulk `createMany({ skipDuplicates: true })` so both local and Railway databases populate automatically in seconds.
- Pre-seed the demo customer (`demo@likehome.dev` / `LikeHome2026!`, 1,250 reward points, saved VISA `4242`, upcoming booking `#LH-20481`, completed booking `#LH-19204`).
- Implement all 12 screens from the Lofi Prototype Handoff PDF with Light/Dark theme support:
  - Home (`/`), Search Results (`/search` with 7 filters, 4 sorts, 24/page pagination), Hotel Detail (`/hotels/$hotelId` with gallery, room cards, sticky reservation bar, secondary photo carousel, policies)
  - Real interactive Leaflet + OpenStreetMap street maps in both the small Map Preview Card (`/search` and `/hotels/$hotelId`) and the Expanded Interactive Street Map Modal (`MapPreviewModal` with non-overlapping price pills, neighborhood cluster pills, "Filter to visible map area", and hotel preview sidebar)
  - Sign In (`/sign-in`) & Sign Up (`/sign-up`) with `redirectTo` preservation and 1-click Demo Customer fill
  - Booking Checkout (`/booking`) with saved/new card payment, LikeHome Rewards redemption (`1,000 pts = 1 free room night`, `+100 pts/night` earned), and the blocking Overlapping Stay Popup (`LH-08`)
  - Booking Confirmed (`/bookings/$bookingId/confirmed`), MyBooking Lookup & List (`/my-booking`), Booking Detail (`/bookings/$bookingId` with Change Stay, Complete Stay demo button, and 7-day Cancellation cutoff + fee simulation), and Account (`/account`).

### Step 3 — Verification & Quality Gates
- Add Vitest unit tests (`tests/unit/`), PostgreSQL integration tests (`tests/integration/`), and a comprehensive Playwright Chromium E2E test (`tests/e2e/`) that walks through the entire class demo flow.
- Visually inspect rendered pages and map modals using Playwright screenshots to verify there are no layout collisions, overlapping pills, or missing images.
- Ensure `npm run format:check`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e` all pass with zero warnings/errors, and wire `.github/workflows/ci.yml`.

### Step 4 — GitHub & Railway Deployment
- Create your new GitHub repository `DomBarker99/LikeHome-${RUN_ID}`, push the baseline `main`, and merge your implementation via a feature-branch Pull Request with passing GitHub Actions CI.
- Create your new Railway project `LikeHome-${RUN_ID}`, provision a Railway PostgreSQL database, configure `DATABASE_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`, deploy `main`, generate a public domain, and verify both `/health` and the live deployed web app end-to-end.
```
