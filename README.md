# CKPool Sentinel | Bitcoin Solo Mining Live Dashboard

A modern, high-tech web dashboard for real-time monitoring and historical analysis of Bitcoin solo mining statistics on [CKPool](https://raw.stats.ckpool.org).

![UI Preview](https://img.shields.io/badge/UI-Dark%20Crypto%20Terminal-amber)
![Next.js 15](https://img.shields.io/badge/Next.js-15%20(React%2019)-000000?logo=next.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/Database-SQLite%20WAL-003B57?logo=sqlite)

---

## 🌟 Key Features

* **Automated 1-Minute Sync**: Automatically synchronizes stats from `raw.stats.ckpool.org` every 1 minute and persists snapshots to a local SQLite database (`data/stats.db`).
* **CORS Proxy**: Next.js server route handlers bypass upstream CORS restrictions cleanly.
* **Interactive Time-series Charts**: Recharts area curves featuring custom neon SVG glow gradients, interactive tooltips, and timeframe switching (`1H`, `24H`, `7D`, `30D`, `ALL`).
* **Pool Source Comparison**: Visual comparison meters for CKPool's 5 native timeframes (`1m`, `5m`, `1hr`, `1d`, `7d`) with mining stability calculation.
* **Worker Node Telemetry**: Real-time worker cards showing individual hashrates, shares, best share, and last seen timestamps.
* **Modern Dark Crypto Terminal UI**:
  * Glassmorphism with translucent slate blur panels (`backdrop-blur-xl`).
  * Neon accents: Bitcoin Amber (`#F7931A`), Electric Cyan (`#00F2FE`), Emerald Green (`#10B981`).
  * 1-Minute circular countdown timer widget and instant **Force Refresh** button.
  * 1-Click Bitcoin address copy-to-clipboard.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Charts**: [Recharts](https://recharts.org/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Database**: SQLite with `better-sqlite3` (WAL mode enabled)
* **Testing**: [Vitest](https://vitest.dev/)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) v18.18+ or v22+
* npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/jzd101/solo-minier.git
cd solo-minier

# Install dependencies
npm install
```

### Running the Dashboard

```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
npm test
```

---

## 📡 API Endpoints

* `GET /api/stats?timeframe=24h`: Returns latest snapshot, active workers, next sync countdown, and historical records for the selected timeframe (`1h`, `24h`, `7d`, `30d`, `all`).
* `POST /api/sync`: Forces an immediate sync from CKPool and updates the database.
