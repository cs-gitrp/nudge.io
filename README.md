# nudge.io

`nudge.io` is a modern, responsive, and robust habit tracking application built using Next.js (App Router), React, Tailwind CSS, TypeScript, Prisma, and PostgreSQL. The application is designed to solve the classic timezone-ambiguity problem when tracking habits and streaks, ensuring a unified, accurate, and consistent experience regardless of where the user is located.

---

## Technical Stack & Overview

The repository is structured as a monorepo using npm workspaces:
- **`frontend`**: A Next.js web application utilizing React context, Tailwind CSS, Lucide icons, and server-side state hydration.
- **`backend`**: A reusable npm workspace containing the Prisma database client, local-day converters, and streak calculations.
- **Database**: PostgreSQL database hosted on Supabase, connected via Prisma.

---

## Setup & Run Instructions

Follow these steps to run the project locally:

1. **Install dependencies** (run at the repository root):
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory and configure the following variables:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<pooler-host>:<port>/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://<username>:<password>@<direct-host>:<port>/postgres"
   JWT_SECRET="your-long-secure-random-string"
   ```

3. **Run database migrations**:
   Apply migrations to your Supabase PostgreSQL instance:
   ```bash
   npm run prisma:migrate --workspace=backend
   ```

4. **Start the development servers**:
   Run both the frontend and backend workspaces concurrently in development mode:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Timezone & Local-Day Logic

### The Timezone Challenge
Standard habit tracking systems that store check-ins using simple UTC timestamps or native Date objects suffer from timezone-rollover issues. A check-in recorded on "Tuesday night" in New York might be stored in UTC as "Wednesday morning," artificially breaking or inflating streaks for the user depending on when and where they check in.

### The Solution: Local-Day Representation
To eliminate timezone ambiguity, `nudge.io` employs a strict separation of UTC audit times and local day representation:

1. **Check-In Storage Structure**:
   Each `CheckIn` model in `schema.prisma` contains:
   - `utcInstant` (`utc_instant` in DB): The exact UTC date-time of the check-in (used as an audit trail).
   - `localDate` (`local_date` in DB): A derived string in `"YYYY-MM-DD"` format representing the local calendar day of the check-in, resolved on the server using `Intl.DateTimeFormat` against the user's stored IANA timezone.

2. **String-based Streak Mathematics**:
   All streak calculations and consecutiveness checks operate strictly on plain `"YYYY-MM-DD"` strings rather than JavaScript Date objects. String comparison is exact, immune to DST shifts, and timezone-agnostic.
   
3. **Single Source of Truth**:
   The logic is isolated in pure, highly-testable helper modules:
   - [`backend/src/streak/local-day.ts`](file:///e:/chandan/nudge.io/backend/src/streak/local-day.ts): Converts instants to local days, manages relative calendar shifts, and validates timezone IDs.
   - [`backend/src/streak/streak.ts`](file:///e:/chandan/nudge.io/backend/src/streak/streak.ts): Derives current and longest streaks.
   - [`backend/src/streak/streak.test.ts`](file:///e:/chandan/nudge.io/backend/src/streak/streak.test.ts): Formally proves mathematical edge cases.

### DST and Worked Examples

#### The Spec's Worked Example
Consider a user registered in the `Asia/Kolkata` timezone (UTC+05:30):
* **Check-In A**: logged at `2026-03-10T14:30:00Z` -> converts to local `2026-03-10`
* **Check-In B**: logged at `2026-03-11T10:30:00Z` -> converts to local `2026-03-11` (Streak = 2)
* **Check-In C**: logged at `2026-03-11T21:30:00Z` -> rolls over to local `2026-03-12` (Streak = 3)
* **Check-In D**: logged at `2026-03-12T17:30:00Z` -> duplicate of local `2026-03-12` (DB unique constraint rejects, keeping streak at 3)

#### DST Transition Edge Case (America/New_York)
On a spring-forward DST transition day (e.g. March 8, 2026 in New York, where EST transitions to EDT):
* **EST (UTC-05:00)**: `2026-03-08T06:59:00Z` resolves to `01:59 EST` -> local `2026-03-08`.
* **EDT (UTC-04:00)**: `2026-03-08T07:01:00Z` resolves to `03:01 EDT` -> local `2026-03-08`.
Both transition instants resolve accurately to the same local calendar day (`2026-03-08`), preventing invalid double check-ins or gap computations.

---

## Database-Level Defense-in-Depth

To guarantee absolute data integrity, the application doesn't rely solely on application-level validations. In `schema.prisma`, the `CheckIn` model enforces a database-level composite unique constraint:

```prisma
model CheckIn {
  id         String   @id @default(uuid())
  habitId    String
  utcInstant DateTime @map("utc_instant")
  localDate  String   @map("local_date")

  @@unique([habitId, localDate])
}
```

This acts as a bulletproof defense against race conditions (e.g., a user double-clicking the check-in button or sending simultaneous API calls), throwing a Prisma `P2002` unique constraint violation which the API handler cleanly intercepts to return a `409 Conflict`.

---

## Known Limitations / Out of Scope

- **historical timezone migrations**: Changing the timezone in settings does not retroactively migrate historical check-ins to the new local-day bounds.
- **pagination**: Large lists of habits and check-in history lists are loaded in-full; pagination is out of scope for this stage.
- **Dockerization**: The monorepo setup is run directly on node/npm, and Docker configuration is not provided.
- **CI Pipelines**: Github Actions/CI automated scripts are not configured.
