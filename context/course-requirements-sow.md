# CMPE 165 — LikeHome Instructor Statement of Work (SOW) & Rubric Requirements

## Project Overview

**LikeHome** is an online hotel reservation web application for **CMPE 165 (Software Engineering)**. Customers can search and inspect hotels without signing in, create an account or sign in when ready to reserve, book rooms with simulated payment methods, manage or modify upcoming reservations, cancel stays under a defined cancellation policy, and earn/redeem **LikeHome Rewards** points.

---

## Functional Requirements (`LH-01` – `LH-13`)

| ID | Requirement | Mandatory Acceptance Criteria |
| --- | --- | --- |
| **LH-01** | **Account Registration** | Guests can register a new account with name, email, phone, and password. Duplicate emails are rejected with a clear validation message. |
| **LH-02** | **Sign In / Sign Out & Auth Redirect** | Customers can sign in and sign out. If an unauthenticated guest clicks **Reserve selected room** on a hotel page, their selected hotel, room, check-in/check-out dates, and guest count are preserved via `redirectTo` through `/sign-in` or `/sign-up` so they land directly on `/booking` after authenticating. |
| **LH-03** | **Search Hotels without Sign-In** | Unauthenticated visitors can search hotels by city/area/hotel name, check-in date, check-out date, and guest count, or browse Featured / Discounted / Top-Rated shelves on the Home screen. |
| **LH-04** | **Filter & Sort Search Results** | Search results support multi-criteria filtering (`Price Under $180/night`, `Rating 9.0+`, `Free WiFi`, `Breakfast`, `Discounted`, `Pool`, `Parking`) and sorting (`Recommended`, `Price: low to high`, `Price: high to low`, `Rating: high to low`) with pagination (`24` hotels per page). |
| **LH-05** | **Hotel Detail & Room Selection** | Hotel page displays a photo gallery carousel, amenities card, address and check-in/check-out times, room cards with capacity (`Up to N guests`), per-night and total price (including 12% taxes & fees), an always-visible sticky reservation bar, an interactive street map card, secondary photo strip, and hotel policies. |
| **LH-06** | **Change Stay (Modify Reservation)** | Customers can modify an **Upcoming** reservation's room type, check-in/check-out dates, and guest count. Changing the stay recalculates the nightly subtotal, 12% taxes & fees, and total charge, and updates the booking record in PostgreSQL. |
| **LH-07** | **Simulated Payment & Saved Cards** | Customers can pay using a saved payment card or enter a new card (`cardholderName`, `brand`, `cardNumber`, `expMonth`, `expYear`) with an option to save it to their account. Only the last 4 digits (`last4`) and non-sensitive metadata are stored—never raw CVV or full PAN. |
| **LH-08** | **Overlapping Stay Prevention** | A customer cannot book or modify an upcoming reservation so that its date range `[checkIn, checkOut)` overlaps another active (`UPCOMING`) reservation on the same account. Attempting an overlapping booking must surface a blocking **Overlapping Stay Popup** showing the conflicting reservation code, hotel name, and dates, with a link to inspect the existing booking. |
| **LH-09** | **MyBooking Lookup & Reservations List** | Customers can look up a reservation by confirmation code (`#LH-20481` or `LH-20481`) on `/my-booking` and view their full list of **Upcoming**, **Completed**, and **Cancelled** reservations on `/my-booking` and `/account`. |
| **LH-10** | **Cancellation Policy & Fee Calculation** | Free cancellation (100% refund, `$0` fee) when cancelled **7 or more days** before check-in. Cancelling **fewer than 7 days** before check-in incurs a cancellation fee equal to **one night's room rate** (or 25% of total for single-night stays), and the remaining amount is refunded. Include a demo toggle/option to preview and execute within-7-day late cancellation with the fee during live class demos. |
| **LH-11** | **Account Profile & Preferences** | Authenticated users can update their profile details (`name`, `phone`, `preferredCity`), manage saved payment methods (add/delete cards), and view their reward point transactions ledger on `/account`. |
| **LH-12** | **LikeHome Rewards Program** | Paid stays earn **`100 points per night`** (`nights * 100`). Customers can redeem **`1,000 points = 1 free room night`** at checkout (capped at total stay nights and user's point balance). Cancelling a booking refunds any redeemed points and reverses any pending earned points. Include a **Complete stay** demo action on upcoming bookings so graders can see stays transition to `COMPLETED` and award points. |
| **LH-13** | **Responsive Theme & Quality Gates** | Supports persistent **Light** and **Dark** themes matching the Lofi Prototype Handoff color tokens, passes Prettier, ESLint (`--max-warnings=0`), TypeScript (`tsc --noEmit`), Vitest unit & PostgreSQL integration tests, and Playwright Chromium E2E tests. |
