# System overview

The ISP system is made of **three components** that work together:

```
┌─────────────────────┐        ┌──────────────────────┐        ┌──────────────────┐
│  Mobile app (Expo)  │  HTTPS │   isp-app-server     │  LAN   │  MikroTik Router │
│  isp-app-for-wifi-  │ ─────► │  (Express + Prisma)  │ ─────► │  RouterOS 7 CHR  │
│  provider-          │  JSON  │  Node.js, port 5000  │ 8728   │  PPPoE server    │
└─────────────────────┘        └──────────┬───────────┘        └──────────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │ PostgreSQL  │
                                   │  (Prisma)   │
                                   └─────────────┘
```

| Component | Location | Role |
|---|---|---|
| **Mobile app** (this repo) | `isp-app-for-wifi-provider-` | Expo / React Native app — customer portal + admin dashboard |
| **Backend API** | `isp-app-system/isp-app-server` | Express + Prisma + JWT. Talks to the DB and to MikroTik (`node-routeros`) |
| **Web admin (optional)** | `isp-app-system/frontend-webapp` | React (shadcn/ui) web admin — alternative admin UI |
| **Router** | MikroTik CHR, RouterOS **7.21.5** | PPPoE server, rate limiting (profiles `5M`/`10M`/`20M`/`50M`) |
| **Database** | PostgreSQL | Customers, packages, invoices, tickets, users |

---

## 1. How data flows (today vs. target)

### Today — mobile app is standalone (mock data)
The Expo app runs **100% on mock data** (`src/utils/mockData.ts`): login is demo-credential based, customers/packages/logs are hardcoded. It does **not** talk to the backend yet.

### Target — full stack
1. Mobile app calls `isp-app-server` (`/api/auth/login` → JWT, then `/api/customers`, `/api/customers/:id`, `/api/mikrotik/*`)
2. Backend serves **real data** from PostgreSQL and **live data** from MikroTik
3. Admin actions (suspend, package change, new customer) are **provisioned on the router** by the backend automatically

### Already built in the backend (verified by code review)
- JWT auth (`POST /api/auth/login`, `/register`, `GET /me`)
- Customer CRUD with `pppoeUsername` / `pppoePassword` + **automatic MikroTik PPPoE provisioning on create**
- **Status sync** — suspend/activate a customer in the DB → toggles the PPPoE secret on the router
- MikroTik endpoints: status, PPPoE secrets, active sessions, toggle user, create secret
- Dashboard stats, invoices (+ monthly cron job), tickets, packages
- MikroTik bridge via `node-routeros` (API protocol, port 8728)

---

## 2. Networking & deployment

### Backend config (from `.env`, values masked)
| Key | Value | Meaning |
|---|---|---|
| `PORT` | `5000` | Express port |
| `DATABASE_URL` | *(set)* | PostgreSQL connection (Prisma) |
| `JWT_SECRET` | *(set)* | Token signing secret |
| `MIKROTIK_HOST` | `192.168.110.199` | Router IP the backend connects to ⚠️ *verify against `/ip address print`* |
| `MIKROTIK_PORT` | `8728` | RouterOS API port |
| `MIKROTIK_USERNAME` | `admin` | API login user |
| `MIKROTIK_PASSWORD` | *(set)* | API password |

> ⚠️ The router's `/ip service set api address=192.168.88.10/32` restricts the API to one IP — that IP **must** be the machine running the backend, otherwise the backend is locked out.

### Production topology (from `DEPLOYMENT_UBUNTU.md`)
```
Client ──► Nginx (80/443)
              ├── /     → frontend-webapp static build
              └── /api  → backend (localhost:5000) ──► MikroTik (8728)
```
- PM2 manages the backend process (`isp-backend`)
- Deployment script: `deploy-ubuntu.sh` in `isp-app-system/`

---

## 3. Where the mobile app fits

The mobile app should eventually replace (or complement) the web admin. The screens map like this:

| Mobile app screen | Backend endpoint |
|---|---|
| Admin login | `POST /api/auth/login` |
| Customer login (phone+OTP) | not in backend yet — needs a customer OTP flow or mapping to `POST /api/auth/login` |
| Customers list | `GET /api/customers?search=&status=` |
| Customer details | `GET /api/customers/:id` |
| Customer live usage | `GET /api/mikrotik/active` (filter by `pppoeUsername`) — **needs a per-customer endpoint** |
| Dashboard KPIs | `GET /api/dashboard/stats` |
| Packages | `GET /api/packages` |
| Tickets | `GET /api/tickets` |
| Invoices | `GET /api/invoices` |

See **[BACKEND.md](BACKEND.md)** for the full API reference and **[MIKROTIK_INTEGRATION.md](MIKROTIK_INTEGRATION.md)** for router specifics.
