# AI Observability Platform

A real-time, enterprise-grade AI Observability Platform for monitoring Traditional ML models and LLM-based systems.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ Overview │  ML Mon  │ LLM Mon  │  Alerts  │ Gov    │ │
│  ├──────────┴──────────┴──────────┴──────────┴────────┤ │
│  │  TanStack Query (cache/refetch) │ Socket.IO Client  │ │
│  │  Auth Context │ Filter Context │ Socket Context     │ │
│  └────────────────────┬────────────┬──────────────────┘ │
│                       │ REST API   │ WebSocket           │
├───────────────────────┼────────────┼────────────────────┤
│                    BACKEND (Express)                     │
│  ┌────────┬──────────┬──────────┬──────────┬──────────┐ │
│  │  Auth  │  Models  │ Metrics  │  Alerts  │  Gov     │ │
│  ├────────┴──────────┴──────────┴──────────┴──────────┤ │
│  │  Rule Engine  │  Aggregation  │  Socket.IO Server   │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  Mock Store (In-Memory) / MongoDB (Production)     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (optional — falls back to in-memory mock store)

### Start Backend
```bash
cd server
npm install
npm run dev
```
Server runs at `http://localhost:5000`

### Start Frontend
```bash
cd client
npm install
npm run dev
```
App runs at `http://localhost:5173`

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@observability.ai | password123 | Admin |
| analyst@observability.ai | password123 | Analyst |
| viewer@observability.ai | password123 | Viewer |

## Feature Matrix

### Frontend
- **Persistent Layout** — Sidebar + Topbar mount once, never reload
- **Global Filters** — Date range & environment shared across all pages
- **Overview Dashboard** — Risk gauge, metric cards, 24h trend charts
- **ML Monitoring** — Model selector, time-series charts, metric snapshots
- **LLM Monitoring** — Same framework, LLM-specific metrics (tokens, hallucinations, toxicity)
- **Alerts Management** — Paginated table, detail panel, resolve/acknowledge actions
- **Governance Logs** — Audit trail with server-side filtering and export
- **Real-Time Updates** — Single WebSocket connection with selective cache invalidation
- **Lazy Loading** — Route-based code splitting
- **Polling Fallback** — Auto-activates when WebSocket disconnects

### Backend
- **Modular Architecture** — Auth, Models, Metrics, Alerts, Governance, RealTime
- **Metric Ingestion** — Validate → Store → Evaluate Rules → Emit Events
- **Aggregation Engine** — Time-bucket aggregation for compact chart data
- **Alert Engine** — Threshold-based with deduplication
- **Risk Score** — Weighted computation (critical=40, high=25, medium=10, low=5)
- **Rate Limiting** — 500 req/15min per IP
- **Response Compression** — gzip via compression middleware
- **Overview Caching** — 15-second TTL with invalidation on events
- **Security** — Helmet, CORS, JWT auth, RBAC

## Integration Flows

### Login Flow
```
User → POST /api/auth/login → JWT token → Stored in localStorage
→ WebSocket connected → Overview page loads
```

### Metric Event Flow
```
Metric received → Validated → Stored in DB → Rule evaluated
→ Threshold breached? → Alert created → WebSocket: alertCreated
→ Frontend: TanStack cache updated → Affected components re-render
```

### Alert Resolution Flow
```
User clicks Resolve → PATCH /api/alerts/:id/resolve
→ Alert status updated → Audit log created
→ WebSocket: alertResolved → Dashboard synchronized
```

## Data Flow

### Real-Time Strategy
- One WebSocket connection per session
- Events: `metricUpdate`, `alertCreated`, `alertResolved`
- On event: Update TanStack Query cache (not full refetch)
- Fallback: 30-second interval polling on disconnect

### Efficiency Patterns
- Server-side pagination (20-50 per page, capped)
- Time-bucket metric aggregation
- Indexed queries (modelId+timestamp)
- Background refetch (no UI blocking)
- Chart memoization (React.memo + useMemo)
- Lazy chart loading (load 4 at a time, then on-demand)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 |
| Styling | Tailwind CSS 3 |
| Charts | ECharts 5 |
| Data Fetching | TanStack Query 5 |
| Real-Time | Socket.IO 4 |
| Routing | React Router 6 |
| Backend | Express 4 |
| Database | MongoDB (mock in-memory fallback) |
| Auth | JWT + bcrypt |
| Security | Helmet + CORS + Rate Limiting |
