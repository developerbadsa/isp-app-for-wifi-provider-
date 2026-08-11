# Backend — `isp-app-server`

The backend API for the ISP system. Located at `isp-app-system/isp-app-server` (sibling of this repo, outside this project's root).

**Stack:** Node.js + Express 4 + TypeScript + Prisma (PostgreSQL) + JWT + `node-routeros` + `node-cron`

---

## 1. Quick start

```bash
cd isp-app-server
npm install

# 1. Configure env — copy .env keys (see section 5)
# 2. Generate Prisma client + migrate
npm run prisma:generate
npm run prisma:migrate

# Dev (nodemon, hot reload)
npm run dev

# Production
npm run build
npm start
```

Health check: `GET /api/health` → `{"status":"UP",...}`

---

## 2. Project structure

```
isp-app-server/
├── prisma/
│   └── schema.prisma        # Data model (PostgreSQL)
├── src/
│   ├── index.ts             # Express app, middleware, route mounting, cron start
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── invoice.controller.ts
│   │   ├── mikrotik.controller.ts
│   │   ├── package.controller.ts
│   │   └── ticket.controller.ts
│   ├── routes/              # Express routers (auth, customer, dashboard, invoice, mikrotik, package, ticket)
│   ├── services/
│   │   ├── mikrotik.service.ts   # node-routeros bridge to the router
│   │   └── billing.service.ts    # invoice generation logic
│   ├── jobs/
│   │   └── invoice.job.ts        # monthly invoice cron
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT protect + adminOnly
│   │   ├── errorHandler.ts
│   │   └── logger.middleware.ts  # request logger
│   └── utils/
│       ├── jwt.ts                # token sign/verify (7d expiry)
│       └── prisma.ts             # Prisma client singleton
└── .env                          # PORT, DATABASE_URL, JWT_SECRET, MIKROTIK_*
```

---

## 3. API reference

All routes except `/api/health`, `/api/auth/login`, `/api/auth/register` require `Authorization: Bearer <JWT>`.

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public ⚠️ | Create staff/admin user |
| POST | `/api/auth/login` | Public | Login → returns JWT (7 days) |
| GET | `/api/auth/me` | Any logged-in | Current user profile |

### Customers
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/customers` | Any | List (filter: `status`, `zone`, `search`, pagination `page`/`limit`; `limit=0` = all) |
| GET | `/api/customers/:id/live` | Any | **Live MikroTik usage** for one customer (matched by `pppoeUsername`): online/offline, uptime, IP, MAC, bytes-in/out. Degrades gracefully when the router is unreachable (`reachable: false`) |
| GET | `/api/customers/:id` | Any | Full customer + package, invoices, tickets |
| POST | `/api/customers` | Admin | **Creates PPPoE secret on MikroTik first**, then inserts DB row |
| PUT | `/api/customers/:id` | Admin | Update; status change **syncs to MikroTik** (suspend/activate) |
| DELETE | `/api/customers/:id` | Admin | Delete |

**Response safety:** `pppoePassword` is always stripped before sending to the client (`sanitizeCustomer`).

### MikroTik (all admin-only)
| Method | Route | Description |
|---|---|---|
| GET | `/api/mikrotik/status` | Connection check → identity, version, board, uptime, CPU |
| GET | `/api/mikrotik/secrets` | All PPPoE secrets (`/ppp/secret/print`) |
| GET | `/api/mikrotik/active` | Active sessions (`/ppp/active/print`) |
| POST | `/api/mikrotik/toggle` | Body `{ username, disabled }` — enable/disable + drop active session |
| POST | `/api/mikrotik/secrets` | Body `{ name, password, profile }` — create/update secret |

### Dashboard, invoices, packages, tickets
| Method | Route | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Counts + monthly revenue |
| GET | `/api/invoices` | Invoice list |
| POST | `/api/invoices/generate/:customerId` | Generate invoice for one customer |
| POST | `/api/invoices/:id/pay` | Mark invoice paid (creates Payment record) |
| GET/POST/PUT/DELETE | `/api/packages` | Package CRUD (writes are admin-only) |
| GET/POST/PUT | `/api/tickets` | Ticket CRUD |

---

## 4. Database model (Prisma)

```prisma
User      { id, name, email @unique, passwordHash, role: STAFF|ADMIN }
Customer  { id, name, phone @unique, pppoeUsername @unique, pppoePassword,
            zone?, status: ACTIVE|SUSPENDED|OVERDUE, packageId → Package,
            invoices[], tickets[] }
Package   { id, name @unique, speedMbps, price, validityDays, customers[] }
Invoice   { id, amount, dueDate, paidAt?, status, customerId → Customer, payments[] }
Payment   { id, amount, method, paidAt, note?, invoiceId → Invoice }
Ticket    { id, ..., customerId?, assigneeId? → User, messages }
```

> 💡 This maps almost 1:1 to the mobile app's `src/types/index.ts` (`CustomerUser`, `Package`, `Invoice`, `Ticket`). The mobile `CustomerUser` is richer (MAC, IP, uptime, logs) — those extra fields should come from MikroTik live data, not the DB.

---

## 5. Environment variables (`.env`)

| Key | Required | Notes |
|---|---|---|
| `PORT` | no (default 5000) | Express port |
| `NODE_ENV` | no | `development` / `production` |
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `JWT_SECRET` | **yes** | Signing secret — keep strong & private |
| `JWT_EXPIRES_IN` | no | (jwt.ts hardcodes `7d` today) |
| `MIKROTIK_HOST` | yes | Router IP (currently `192.168.110.199`) |
| `MIKROTIK_PORT` | no (default 8728) | RouterOS API port |
| `MIKROTIK_USERNAME` | yes | Router API user |
| `MIKROTIK_PASSWORD` | yes | Router API password |
| `MIKROTIK_TIMEOUT_MS` | no (default 5000) | Router call timeout |
| `MIKROTIK_TLS` | no | `true` → connect to api-ssl (8729) |

---

## 6. MikroTik integration points

All in `src/services/mikrotik.service.ts` (uses `node-routeros`):

| Function | RouterOS command | Used by |
|---|---|---|
| `checkMikroTikConnection` | `/system/identity/print`, `/system/resource/print` | `GET /api/mikrotik/status` |
| `getPPPoESecrets` | `/ppp/secret/print` | `GET /api/mikrotik/secrets` |
| `getActivePPPoESessions` | `/ppp/active/print` | `GET /api/mikrotik/active` |
| `getPPPoESessionStats` | `/ppp/active/print stats` | `GET /api/customers/:id/live` (bytes-in/out) |
| `createPPPoESecret` | `/ppp/profile/print`, `/ppp/secret/add|set` | Customer create + `POST /api/mikrotik/secrets` |
| `togglePPPoESecret` | `/ppp/secret/set`, `/ppp/active/remove` | Customer status sync + `POST /api/mikrotik/toggle` |

Profile matching logic in `createPPPoESecret`: exact profile name → `${speed}M` (e.g. `50M`) → create `50M` profile → fallback `default`.

> 🔒 **Fail-fast connect:** `connectMikroTik` races the TCP connect against `MIKROTIK_TIMEOUT_MS` (default 5000), so an unreachable router host returns an error in ~5s instead of hanging the request for the OS TCP timeout.

---

## 7. Background job

`src/jobs/invoice.job.ts` — `node-cron` runs **1st of every month at 08:00 Asia/Dhaka** and generates invoices for all `ACTIVE` customers.

---

## 8. Deployment

- Dev: `npm run dev` (nodemon)
- Prod: `npm run build` → `npm start` (or PM2: `pm2 start dist/index.js --name isp-backend`)
- Full VPS setup: `deploy-ubuntu.sh` + `DEPLOYMENT_UBUNTU.md` in `isp-app-system/`
- Reverse proxy: Nginx (`/api` → localhost:5000)

See **[BACKEND_HARDENING.md](BACKEND_HARDENING.md)** for the prioritized improvement plan.
