# Backend hardening plan

Based on a full code review of `isp-app-server` (Express + Prisma + node-routeros). Prioritized: **P0 = fix first (security)**, **P1 = reliability & performance**, **P2 = maintainability & ops**.

> Short answer to "backend ta more strong kora jay?": **yes, definitely** — it's a solid foundation already (JWT auth, MikroTik provisioning, sanitized responses), but it needs hardening before production.

---

## 🔴 P0 — Security (fix before going live)

### 1. CORS is wide open
`app.use(cors())` allows **every origin**.
```ts
// src/index.ts — restrict to your frontends
app.use(cors({ origin: ['https://admin.yourisp.com', ...] }));
```

### 2. No rate limiting on auth endpoints
Login/register can be brute-forced. Add `express-rate-limit`:
```ts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
app.use('/api/auth', authLimiter);
```

### 3. No security headers
Add `helmet`:
```ts
app.use(helmet());
```

### 4. PPPoE passwords stored in plaintext in the DB
`Customer.pppoePassword` is needed to provision the router, but should be **encrypted at rest** (AES-256-GCM with a key in `.env`), decrypt only when talking to MikroTik. Never return it to clients (already done via `sanitizeCustomer` ✅).

### 5. Register endpoint is public
Anyone can create a `STAFF` account. After initial setup, require an admin token or an `ADMIN_SETUP_KEY` env var.

### 6. Insecure JWT default
`jwt.ts` falls back to `'fallback-secret-key'` if `JWT_SECRET` is missing — dangerous. Fail fast:
```ts
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
```

### 7. Error messages leak internals
MikroTik errors (which include host/user) are sent to the client. Log details server-side, send a generic message to the client:
```ts
// errorHandler.ts
const safeMessage = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
```

---

## 🟠 P1 — Reliability & performance

### 8. New MikroTik connection per call ❌
Every service function opens **and closes** a new RouterOS connection. With the admin UI + app polling, this will hammer the router.

**Partial:** `connectMikroTik` now races the TCP connect against `MIKROTIK_TIMEOUT_MS` (5s), so unreachable hosts fail fast instead of hanging requests. Still to do — a shared persistent connection / pool:
```ts
// services/mikrotik.service.ts
let conn: RouterOSAPI | null = null;
export const getConnection = async () => {
  if (conn?.connected) return conn;
  conn = await connectMikroTik();
  return conn;
};
```
(Safe to do: the router itself only supports a handful of concurrent API sessions — check `/ip service print` `max-sessions`, currently 20.)

### 9. No caching on `/api/mikrotik/*`
Every call hits the router live. Add a 5–10 s TTL cache (in-memory) for `/active`, `/secrets`, `/status` so the router isn't polled on every keystroke.

### 10. Synchronous router calls in request path
`createCustomer` waits on router provisioning (up to 5 s) before responding. OK for an admin action, but as customer count grows:
- Move to a **job queue** (e.g. `bull` + Redis, or just an in-process queue with status tracking)
- Keep the DB write first + mark `provisioning: pending`, then sync the router in the background (the code already handles drift with warnings — extend that pattern)

### 11. Missing per-customer usage endpoint
**✅ Done** — `GET /api/customers/:id/live` runs `/ppp/active/print stats`, matches session by `pppoeUsername`, returns bytes-in/bytes-out, uptime, IP, MAC. Web admin details dialog shows it (30s auto-refresh + manual refresh). (See `MIKROTIK_INTEGRATION.md` §3.)

### 12. No graceful shutdown
Close Prisma + the router connection on `SIGTERM`/`SIGINT`:
```ts
process.on('SIGTERM', async () => { await prisma.$disconnect(); routerConn?.close(); server.close(); });
```

### 13. Cron job has no overlap guard / error isolation
`invoice.job` loops customers; if one throws, the rest are skipped (whole loop is in one try/catch) and a long run could overlap the next month.
- Wrap each customer in its own try/catch
- Add a `running` flag (or Redis lock) to prevent overlap
- Add retry for transient failures

### 14. Startup validation of env + DB
Fail fast on missing `DATABASE_URL` / `MIKROTIK_*`, and ping the DB (`prisma.$queryRaw\`SELECT 1\``) before listening.

---

## 🟢 P2 — Maintainability & ops

### 15. Add tests (none today)
No test framework in `package.json`. Add **Vitest + supertest**:
- Unit: `mikrotik.service` (mock `node-routeros`), `billing.service`, `jwt`
- Integration: auth flow, customer create (mock router), invoice pay
This is the single highest-value addition — the MikroTik logic is risky to change without tests.

### 16. Input validation
Manual `if (!name)` checks everywhere. Add **zod** schemas per route (register, login, customer create/update, mikrotik toggle) → 400 with field errors instead of ad-hoc checks.

### 17. Stronger Prisma typing
`where: any` in `customer.controller.ts` weakens type safety. Type the filters with Prisma's `Prisma.CustomerWhereInput`.

### 18. Structured logging + request IDs
Replace console.log with `pino` (JSON logs, levels, request IDs) so logs are greppable and can ship to a log aggregator.

### 19. Deep health endpoint
`GET /api/health` is shallow. Add `/api/health/detailed` that also checks DB (`SELECT 1`) and MikroTik (`checkMikroTikConnection()`), returning per-dependency status for uptime monitors.

### 20. `.env.example` + docs
The repo has `.env` but no `.env.example`. Commit one with all keys and placeholders so new environments are reproducible. (Backend runbook is in `DEPLOYMENT_UBUNTU.md`.)

### 21. Version & engines
Pin `engines: { node: ">=20" }` in `package.json`; add `prisma migrate deploy` to the deploy script; make sure migrations are committed.

---

## Suggested order of work

| Phase | Items | Result |
|---|---|---|
| **1. Security pass** | 1–7 | No obvious holes; safe to expose |
| **2. MikroTik reliability** | 8–11, 14 | Live usage feature + router can't be overwhelmed |
| **3. Tests** | 15 | Can now refactor confidently |
| **4. Polish** | 12–13, 16–21 | Ops-friendly, observable |

> Want me to implement a specific phase? I can start with **Phase 1 (security)** and the **live-usage endpoint (11)** since they're the highest value.
