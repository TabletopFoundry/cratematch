# 🎲 CrateMatch

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

**A personalized board game subscription MVP with content-based curation, collection intelligence, and transparent recommendation explanations.**

CrateMatch matches subscribers with a monthly board game tailored to their taste profile and existing collection — not a random pick from a warehouse. It combines a multi-step taste quiz, preference-weighted scoring, and explainable recommendation logic to deliver one game each month that actually fits your table.

> **Status:** This is a fully functional MVP with SQLite persistence, 65 seeded board games, and end-to-end flows from onboarding through delivery feedback.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Taste Onboarding** | 15-game rating quiz, theme/mechanic preferences, player count & complexity sliders, live radar chart |
| **Recommendation Engine** | Content-based scoring with theme overlap, mechanic affinity, complexity fit, and collection-aware duplicate prevention |
| **Monthly Box Preview** | Personalized match with transparent "why this game?" explanations, confidence scores, and backup alternatives |
| **Collection Intelligence** | Gap analysis, complementary recommendations, owned-game tracking, and duplicate prevention |
| **Subscription Tiers** | Three plans (Discovery / Explorer / Collector) with mock checkout flow |
| **Post-Delivery Feedback** | 1–5 star ratings, tag-based feedback, and comment collection for future recommendation tuning |
| **Community Feed** | Mock unboxings, subscriber stats, and featured reviews |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10

### Setup

```bash
# Clone and install
git clone <repo-url>
cd cratematch
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app auto-seeds 65 real board games on first run.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # REST endpoints (checkout, onboarding, feedback, etc.)
│   ├── box/                # Monthly box preview page
│   ├── collection/         # Collection management dashboard
│   ├── community/          # Mock community feed
│   ├── feedback/           # Post-delivery feedback page
│   ├── onboarding/         # Taste profile wizard
│   └── plans/              # Subscription tier comparison
├── components/             # Reusable UI components
│   ├── onboarding-wizard   # Multi-step taste quiz
│   ├── taste-radar-chart   # Recharts-powered preference visualization
│   ├── collection-manager  # Search, add/remove games
│   └── ...                 # Header, footer, error boundaries, etc.
├── lib/
│   ├── catalog/            # Game data, plan definitions, static content
│   ├── db/                 # SQLite connection, queries, mappers
│   ├── recommendations.ts  # Content-based recommendation engine
│   ├── server-data.ts      # Server-side data orchestration
│   └── types.ts            # Shared TypeScript interfaces
data/
└── cratematch.db           # SQLite database (auto-created, gitignored)
docs/
├── PRD.md                  # Product Requirements Document
├── CODE_REVIEW.md          # Code quality audit
├── UX_REVIEW.md            # UX audit findings
└── IMPROVEMENTS.md         # Improvement roadmap
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | [Next.js](https://nextjs.org/) (App Router) | 16 |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict mode) | 5.x |
| UI | [Tailwind CSS](https://tailwindcss.com/) | 4 |
| Database | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | — |
| Charts | [Recharts](https://recharts.org/) | 3.x |
| Runtime | [React](https://react.dev/) | 19 |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint checks |

---

## 🗄️ Data Persistence

The app uses SQLite for local demo state. On first run, it seeds:

- **65 real board games** with metadata (themes, mechanics, player counts, complexity, prices)
- **Demo subscriber profile** with quiz answers, selected plan, collection, and box history

All data is stored in `data/cratematch.db` (gitignored). Delete it to reset to a fresh state.

---

## 🗺️ Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, how-it-works, pricing, testimonials, FAQ |
| `/onboarding` | Multi-step taste profile wizard |
| `/plans` | Subscription tier comparison + mock checkout |
| `/box` | This month's personalized match with explainability |
| `/collection` | Collection intelligence dashboard |
| `/feedback` | Post-delivery rating and feedback |
| `/community` | Mock community unboxings and reviews |

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on setting up your development environment, code style conventions, and the PR process.

---

## 📄 License

This project is for demonstration and educational purposes.
