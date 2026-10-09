# CKPool Sentinel | Bitcoin Solo Mining Realtime Monitor

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Vitest](https://img.shields.io/badge/Tests-30%20Passed-22c55e?style=for-the-badge&logo=vitest)](https://vitest.dev/)

**CKPool Sentinel** is a production-grade, high-performance web dashboard engineered for Bitcoin solo miners pointing their rigs (Bitaxe, NerdMiner, Avalon, Antminer, etc.) to [CKPool](https://raw.stats.ckpool.org). It transforms raw upstream JSON statistics into an interactive, real-time command center featuring automated ingestion, persistent database historical tracking, and a sleek dark-mode crypto terminal aesthetic.

---

## 📸 Key Capabilities & Architecture

### 1. 🔑 Custom Wallet Onboarding Gateway & Persistent Storage
* **First-Visit Setup Gate**: Enforces wallet configuration before granting access to the telemetry dashboard, functioning like a streamlined login screen.
* **Format Validation**: Automatically validates Bitcoin address formats (Native SegWit `bc1...`, Taproot, Script `3...`, and Legacy `1...`).
* **Zero-Auth Persistence**: Miner wallet addresses are saved locally in the browser (`localStorage`), preserving preferences permanently across sessions and tab reloads.
* **In-Dashboard Address Editor**: Conveniently switch, inspect, or edit the active Bitcoin address directly via a modal inside the dashboard header at any time.
* **Isolated Client Caching**: Client-side history and snapshot storage are partitioned per wallet address, guaranteeing clean separation between different mining addresses.

### 2. ⚡ Automated Background Sync & Fault-Tolerant Engine
* **Upstream Sync Every 60 Seconds**: Ingests fresh telemetry from `https://raw.stats.ckpool.org/users/{address}` every minute.
* **Non-Blocking Background Dispatch**: Uses Next.js 15 `after()` to offload synchronization tasks without blocking incoming HTTP response streams.
* **Resilient Multi-Tier Storage**:
  * **Primary**: High-throughput SQLite with Write-Ahead Logging (`WAL` mode) and indexed addresses.
  * **Automatic Migration**: Self-healing table migrations ensure schema updates without breaking existing data.
  * **Serverless / Vercel Fallback**: Seamless fallback to in-memory caching and `/tmp` JSON backups when running in read-only serverless runtimes.
  * **Disaster Recovery**: Automatically falls back to cached records if the upstream CKPool endpoint experiences latency or downtime.

### 3. 📈 Interactive Hashrate Analytics & Timeline Synthesis
* **Neon Visual Graphs**: Smooth Recharts area curves powered by multi-stop SVG gradients (Amber, Cyan, Emerald) and custom hover tooltips.
* **Multi-Timeframe Windowing**: Effortlessly filter telemetry across `1H`, `24H`, `7D`, `30D`, and `ALL`.
* **Mining Stability Index**: Dynamically contrasts instantaneous hashrate (`1m`, `5m`) against long-term moving averages (`1hr`, `1d`, `7d`) to gauge rig stability.
* **Audit Trail History**: Detailed tabular ingestion log recording exact timestamps, shares, best share difficulty, and worker node counts.

### 4. 🛠️ Worker Rig Telemetry
* **Individual Node Status**: Granular breakdowns for every connected ASIC/miner node under your address.
* **Realtime Metrics**: Inspect individual hashrates, worker names, share distributions, and relative last-seen times.

### 5. 🎨 Dark Cyberpunk Terminal Design System
* **Glassmorphism Panels**: Modern translucent slate panels with high-contrast borders and backdrop blurs (`backdrop-blur-xl`).
* **Circular Sync Dial**: Visual SVG countdown timer displaying seconds remaining until the next automatic poll.
* **Force Refresh**: Instant trigger button to manually query the CKPool pool upstream.
* **Clipboard Helpers**: 1-click address copy utilities throughout the interface.

---

## 🏗️ Project Architecture

```
ckpool-sentinel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stats/route.ts      # REST API: Fetches dashboard data by timeframe & address
│   │   │   └── sync/route.ts       # POST/GET API: Triggers manual sync for an address
│   │   ├── globals.css             # Tailwind layers, glassmorphism styles, glowing utilities
│   │   ├── layout.tsx              # Root HTML wrapper and metadata definitions
│   │   └── page.tsx                # Main client page (Gate vs Dashboard view controller)
│   ├── components/
│   │   ├── HashrateChart.tsx       # Recharts time-series area visualization
│   │   ├── Header.tsx              # Brand banner, active address badge, sync dial, edit trigger
│   │   ├── HistoryTable.tsx        # Tabular snapshot records & ingestion audit
│   │   ├── StatCards.tsx           # Primary KPI stat cards (Current Hash, Shares, Best Difficulty)
│   │   ├── TimeframeComparison.tsx # Comparative hashrate meter across 5 CKPool intervals
│   │   ├── WalletGateModal.tsx     # Gateway onboarding screen & edit address modal dialog
│   │   └── WorkerList.tsx          # Real-time telemetry cards for each active miner rig
│   └── lib/
│       ├── constants.ts            # Shared constants, default fallback wallet, storage keys
│       ├── db.ts                   # SQLite database layer, schema migrations, WAL, memory fallback
│       ├── hashrate.ts             # String parsing (H, K, M, G, T, P, E) to normalized TH/s
│       ├── sync.ts                 # CKPool HTTP client, upstream data fetcher, rate limits
│       ├── timeline.ts             # Timeframe history generation and synthetic data aggregator
│       └── types.ts                # TypeScript domain models and API contracts
└── tests/
    ├── db.test.ts                  # SQLite insertion, filtering, address isolation tests
    ├── hashrate.test.ts            # Unit tests for unit conversion and parsing
    ├── sync.test.ts                # Upstream sync, error handling, custom address testing
    ├── timeline.test.ts            # Synthetic chart timeline interpolation tests
    └── wallet.test.ts              # Bitcoin address format validation tests
```

---

## 💻 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 15.1 (App Router)** | Full-stack React framework with edge/serverless API handlers |
| **React 19** | Component architecture, Client Components, and hooks |
| **TypeScript 5.7** | Strict static typing across domain models and API responses |
| **Tailwind CSS 3.4** | Utility-first styling with custom glassmorphism extensions |
| **better-sqlite3** | Embedded high-speed SQLite engine with WAL mode |
| **Recharts** | Declarative charting library for time-series hashrate data |
| **Lucide React** | Consistent, modern vector iconography |
| **Vitest 3.0** | Lightning-fast test runner with mock and coverage utilities |

---

## 🚦 Getting Started

### Prerequisites

* **Node.js**: `v18.18+` or `v20+` / `v22+`
* **Package Manager**: `npm`, `pnpm`, or `yarn`

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/jzd101/ckpool-sentinel.git
cd ckpool-sentinel

# Install required packages
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser. If you are launching for the first time, you will be greeted by the **Wallet Setup Gateway**. Enter your Bitcoin miner address to enter the dashboard.

### 3. Production Build

```bash
# Build optimized production bundle
npm run build

# Start the production server
npm start
```

---

## 🧪 Testing Suite

The project includes automated unit and integration tests powered by **Vitest**. All tests pass without external network dependencies:

```bash
npm test
```

Test coverage includes:
* **Bitcoin Address Validation** (`tests/wallet.test.ts`): Bech32, Legacy, P2SH, and error handling.
* **Database & Multi-Address Partitioning** (`tests/db.test.ts`): Snapshot insertions, timeframe cutoffs, address isolation, and memory failovers.
* **CKPool Synchronizer** (`tests/sync.test.ts`): Dynamic URL formatting, cache windowing, network timeout fallbacks.
* **Hashrate Unit Parsing** (`tests/hashrate.test.ts`): String conversions from `H/s` up to `EH/s` into normalized `TH/s`.
* **Timeline Synthesis** (`tests/timeline.test.ts`): Historical sampling and fallback point generators.

---

## 🔌 API Reference

### 1. Fetch Dashboard Telemetry

```http
GET /api/stats?timeframe={1h|24h|7d|30d|all}&address={btc_address}
```

**Query Parameters:**
* `timeframe` *(optional)*: `1h`, `24h` (default), `7d`, `30d`, or `all`.
* `address` *(optional)*: Bitcoin miner wallet address. Defaults to the configured pool address if omitted.

**Response Structure (200 OK):**
```json
{
  "latest": {
    "id": 142,
    "timestamp": 1728460000,
    "address": "bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h",
    "hashrate_1m": 1.80,
    "hashrate_5m": 1.84,
    "hashrate_1hr": 1.75,
    "hashrate_1d": 1.24,
    "hashrate_7d": 1.11,
    "workers_count": 2,
    "shares": 1819992546,
    "bestshare": 694365556.35,
    "bestever": 694365556,
    "lastshare": 1728460000,
    "parsedWorkers": [
      {
        "workername": "bc1qw...rig1",
        "hashrate1m": "1.8T",
        "shares": 1819990968,
        "bestshare": 694365556.35
      }
    ]
  },
  "history": [ ... ],
  "snapshots": [ ... ],
  "timeframe": "24h",
  "lastUpdated": 1728460000,
  "nextSyncInSeconds": 48,
  "address": "bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h"
}
```

### 2. Trigger Immediate Sync

```http
POST /api/sync
```

**Query Parameter or JSON Body:**
```json
{
  "address": "bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... },
  "cached": false
}
```

---

## 🌐 Deployment Options

### Vercel / Serverless
This application is fully compatible with Vercel out of the box. Database operations automatically write to `/tmp/stats.db` and utilize in-memory caching to accommodate serverless environments.
```bash
npx vercel
```

### Docker / Linux VPS
For persistent long-term storage, run the application in a persistent Node.js environment or Docker container. SQLite database files are saved in `./data/stats.db` by default. You can configure a custom location via environment variables:
```bash
export DB_PATH=/var/data/ckpool_stats.db
npm start
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Feel free to fork, customize, and point it to your own solo mining rigs! Happy mining and good luck finding that block! ⚡⛏️
