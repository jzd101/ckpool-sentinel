# CKPool Sentinel Web Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern 2026 Next.js full-stack web dashboard that polls CKPool Bitcoin mining stats every 5 minutes, persists time-series history into SQLite, and displays interactive multi-timeframe charts with a cyberpunk dark glassmorphic UI.

**Architecture:** A Next.js 15 App Router application with a local SQLite database (`data/stats.db`) acting as a proxy and persistence engine. Server-side sync functions poll `raw.stats.ckpool.org` every 5 minutes and on manual force-refresh, normalizing hashrate strings into numeric TH/s. The client renders an animated dark-mode crypto terminal using Tailwind CSS, Framer Motion, Lucide icons, and Recharts.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide React, better-sqlite3 / sqlite3, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-08-ckpool-dashboard-design.md`](file:///Users/jzd101/Documents/ckpool3/docs/superpowers/specs/2026-10-08-ckpool-dashboard-design.md)

---

## Global Constraints
- Target URL: `https://raw.stats.ckpool.org/users/bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h`
- Upstream has no CORS headers; all upstream calls must route through Next.js server handlers.
- Auto-sync interval: 5 minutes (300 seconds).
- Persistent storage: SQLite at `data/stats.db`.
- UI theme: Modern Dark Crypto Terminal (Deep Obsidian background, Glassmorphism, Bitcoin Amber, Cyber Cyan, and Emerald Green glow accents).

---

## Review Focus
- Upstream endpoint unreachable / network timeout: Server must return cached SQLite snapshot and client must show graceful alert without crashing.
- Non-standard hashrate units (e.g. `0`, `null`, `500G`, `1.8T`, `2.1P`): Parser must correctly normalize all values into numeric TH/s.
- Cold start with empty database: Immediate sync on first launch to ensure initial data is displayed.
- Timer drift across tab backgrounding: Countdown must compute delta from `Date.now()` vs `lastSyncTimestamp` rather than naive `setInterval` counter.
- Chart rendering with sparse data: Recharts must gracefully render 1 point or multiple points without layout breaks.

---

### Task 1: Project Scaffolding & Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `vitest.config.ts`

**Interfaces:**
- Produces: Base Next.js 15 project runnable with `npm run dev` and testable with `npx vitest run`.

- [ ] **Step 1: Initialize package.json and install dependencies**
Dependencies: `next`, `react`, `react-dom`, `better-sqlite3`, `recharts`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`.
DevDependencies: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/better-sqlite3`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`.

- [ ] **Step 2: Create Next.js configuration and tsconfig.json**
Setup standard Next.js 15 typescript configuration with `@/*` path aliases.

- [ ] **Step 3: Setup Tailwind CSS and globals.css with dark crypto theme variables**
Configure custom radial glow gradients, dark obsidian palette, and glassmorphism utilities.

- [ ] **Step 4: Verify project compiles**
Run: `npm run build` or `npx next --version`
Expected: Next.js CLI functional and configs valid.

- [ ] **Step 5: Commit scaffolding**
```bash
git add .
git commit -m "chore: scaffold next.js 15 project with tailwind and dependencies"
```

---

### Task 2: Hashrate Parsing & Normalization Engine

**Files:**
- Create: `src/lib/hashrate.ts`
- Test: `tests/hashrate.test.ts`

**Interfaces:**
- Produces:
  - `parseHashrateToTh(val: string | number | null | undefined): number`
  - `formatHashrateTh(thValue: number): string`
  - `formatNumberWithCommas(num: number): string`

- [ ] **Step 1: Write failing unit tests in `tests/hashrate.test.ts`**
Cover: `"1.8T"` -> `1.8`, `"500G"` -> `0.5`, `"100M"` -> `0.0001`, `"1.25P"` -> `1250`, `"0"` -> `0`, `null` -> `0`, and formatting functions.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/hashrate.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `src/lib/hashrate.ts`**
Implement parsing regex handling P, T, G, M, k multipliers and formatting helpers.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/hashrate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/hashrate.ts tests/hashrate.test.ts
git commit -m "feat: add hashrate parsing and formatting helpers with unit tests"
```

---

### Task 3: SQLite Database Layer

**Files:**
- Create: `src/lib/db.ts`, `src/lib/types.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Consumes: `src/lib/types.ts`
- Produces:
  - `getDb(): Database`
  - `insertSnapshot(snapshot: NewSnapshotInput): SnapshotRecord`
  - `getLatestSnapshot(): SnapshotRecord | null`
  - `getSnapshotsByTimeframe(timeframe: '1h' | '24h' | '7d' | '30d' | 'all'): SnapshotRecord[]`

- [ ] **Step 1: Define types in `src/lib/types.ts`**
Interfaces: `RawCKPoolUserStats`, `RawWorkerStats`, `SnapshotRecord`, `NewSnapshotInput`, `DashboardApiResponse`.

- [ ] **Step 2: Write failing unit test in `tests/db.test.ts`**
Test table creation, inserting a snapshot, retrieving latest, and querying by timeframe with an in-memory or temp SQLite instance.

- [ ] **Step 3: Run test to verify it fails**
Run: `npx vitest run tests/db.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement `src/lib/db.ts`**
Initialize SQLite table `snapshots` with indexes on timestamp, support automatic directory creation (`data/`), and query filters.

- [ ] **Step 5: Run test to verify it passes**
Run: `npx vitest run tests/db.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/lib/types.ts src/lib/db.ts tests/db.test.ts
git commit -m "feat: implement sqlite persistence layer with tests"
```

---

### Task 4: Upstream Sync Service & API Routes

**Files:**
- Create: `src/lib/sync.ts`, `src/app/api/sync/route.ts`, `src/app/api/stats/route.ts`
- Test: `tests/sync.test.ts`

**Interfaces:**
- Consumes: `src/lib/db.ts`, `src/lib/hashrate.ts`, `src/lib/types.ts`
- Produces:
  - `syncCKPoolStats(force?: boolean): Promise<{ success: boolean; data: SnapshotRecord; cached: boolean }>`
  - API endpoint `POST /api/sync`: triggers sync and returns snapshot.
  - API endpoint `GET /api/stats?timeframe=24h`: returns latest snapshot + history.

- [ ] **Step 1: Write test for sync service in `tests/sync.test.ts`**
Mock upstream fetch and test successful synchronization, parsing, database persistence, and fallback when upstream fails.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/sync.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/lib/sync.ts`**
Fetch from `https://raw.stats.ckpool.org/users/bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h`, parse fields with `parseHashrateToTh`, insert into SQLite, handle errors.

- [ ] **Step 4: Implement `src/app/api/sync/route.ts` and `src/app/api/stats/route.ts`**
Next.js Route Handlers exposing JSON responses.

- [ ] **Step 5: Run test to verify it passes**
Run: `npx vitest run tests/sync.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/lib/sync.ts src/app/api/sync/route.ts src/app/api/stats/route.ts tests/sync.test.ts
git commit -m "feat: implement ckpool sync engine and next.js api endpoints"
```

---

### Task 5: Header Component & Real-time Countdown Timer

**Files:**
- Create: `src/components/Header.tsx`
- Test: Verify component renders address, copy feedback, and countdown timer.

**Interfaces:**
- Consumes: Next sync timestamp, `onForceRefresh: () => Promise<void>`, `isRefreshing: boolean`
- Produces: Header UI with live pulse status, Bitcoin address badge with 1-click copy, circular/bar countdown widget (5m), and Force Refresh button.

- [ ] **Step 1: Implement `src/components/Header.tsx`**
Includes:
- CKPool Sentinel branding with glowing Bitcoin rig icon.
- Bitcoin Address `bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h` with copy tooltip and animation.
- Pulsing Green "ONLINE" indicator.
- 5-Minute countdown timer (minutes & seconds: `MM:SS`) with progress indicator.
- "Force Refresh" button with Lucide `RotateCw` spinner on active fetch.

- [ ] **Step 2: Commit**
```bash
git add src/components/Header.tsx
git commit -m "feat: create modern header with address copy and 5m countdown timer"
```

---

### Task 6: Key Metric Stat Cards

**Files:**
- Create: `src/components/StatCards.tsx`

**Interfaces:**
- Consumes: `SnapshotRecord` (latest data)
- Produces: 4 Glassmorphism stat cards:
  1. Hashrate Power (1m real-time vs 5m smoothed)
  2. Mining Shares (Total shares count & current best share)
  3. All-Time Best Share (Record difficulty score)
  4. Workers & Status (Active worker count & Last share relative time)

- [ ] **Step 1: Implement `src/components/StatCards.tsx`**
Includes:
- Glassmorphic card styling with backdrop-blur, subtle border highlights.
- Ambient neon glow accents (Amber, Cyan, Green).
- Animated number displays and formatted units.
- Sub-text showing delta and contextual indicators.

- [ ] **Step 2: Commit**
```bash
git add src/components/StatCards.tsx
git commit -m "feat: create key metric overview stat cards with glassmorphism"
```

---

### Task 7: Main Hashrate Time-series Chart

**Files:**
- Create: `src/components/HashrateChart.tsx`

**Interfaces:**
- Consumes: `history: SnapshotRecord[]`, `activeTimeframe: string`, `onTimeframeChange: (tf: string) => void`
- Produces: Multi-timeframe interactive Recharts Area/Line chart.

- [ ] **Step 1: Implement `src/components/HashrateChart.tsx`**
Includes:
- Timeframe selector buttons: `1H`, `24H`, `7D`, `30D`, `ALL` with glowing pill effect on active selection.
- Recharts `ResponsiveContainer`, `AreaChart`, SVG LinearGradients (Cyan for 1m, Amber for 5m, Green for 1h).
- Custom Glassmorphism Tooltip component showing formatted timestamps and exact TH/s.
- Graceful rendering even with 1 initial data point (renders current level line).

- [ ] **Step 2: Commit**
```bash
git add src/components/HashrateChart.tsx
git commit -m "feat: create interactive hashrate time-series chart with timeframe switcher"
```

---

### Task 8: Source Timeframe Comparison & Worker Node Details

**Files:**
- Create: `src/components/TimeframeComparison.tsx`, `src/components/WorkerList.tsx`

**Interfaces:**
- Consumes: `SnapshotRecord` (latest snapshot and parsed worker JSON)
- Produces:
  - Timeframe Comparison card: Visual comparison bars of CKPool native timeframes (`1m`, `5m`, `1hr`, `1d`, `7d`).
  - Worker Node Details: Detailed card/table showing worker name, individual hashrate, shares, and activity.

- [ ] **Step 1: Implement `src/components/TimeframeComparison.tsx`**
Horizontal progress/meters comparing 1m vs 5m vs 1hr vs 1d vs 7d with visual deviation indicator.

- [ ] **Step 2: Implement `src/components/WorkerList.tsx`**
Renders worker nodes extracted from `raw_json.worker` with status badges, worker shares, and last share time.

- [ ] **Step 3: Commit**
```bash
git add src/components/TimeframeComparison.tsx src/components/WorkerList.tsx
git commit -m "feat: add timeframe comparison meters and worker nodes component"
```

---

### Task 9: Dashboard Page Integration & Auto-Polling Logic

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: All components from Tasks 5-8, `/api/stats`, `/api/sync`
- Produces: Full interactive dashboard page with client-side polling, background auto-sync every 5 minutes, error banners, and loading skeleton states.

- [ ] **Step 1: Implement `src/app/page.tsx`**
- Set up state for current data, loading, error, and active timeframe.
- Auto-sync interval: Check every 1 second for countdown ticking, trigger background sync when 300 seconds elapse.
- Hook up "Force Refresh" button to trigger immediate sync.
- Wire timeframe switcher to reload `/api/stats?timeframe=...`.

- [ ] **Step 2: Polish global CSS animations & styles**
Add neon glow shadows, backdrop blur, custom scrollbar, and gradient background animations in `src/app/globals.css`.

- [ ] **Step 3: Commit**
```bash
git add src/app/page.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: integrate complete dashboard page with 5m polling and modern effects"
```

---

### Task 10: Verification, Build & End-to-End Validation

**Files:**
- Test all components and execute production build.

- [ ] **Step 1: Run all unit tests**
Run: `npx vitest run`
Expected: ALL PASS.

- [ ] **Step 2: Verify live sync with upstream CKPool**
Execute a sync call to `https://raw.stats.ckpool.org/users/bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h` and verify data is stored in `data/stats.db`.

- [ ] **Step 3: Run production build**
Run: `npm run build`
Expected: Compiled successfully with zero errors.

- [ ] **Step 4: Launch local server and test dashboard endpoints**
Run: `npm run start` in test background or dev server, verify `GET /api/stats` returns 200 with populated metrics.

- [ ] **Step 5: Final commit**
```bash
git add .
git commit -m "chore: complete dashboard verification and production build"
```
