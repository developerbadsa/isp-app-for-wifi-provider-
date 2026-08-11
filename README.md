# Rayhan ISP — Customer & Admin App

A mobile-first ISP self-service application built with **Expo (React Native)** and **TypeScript**. It provides a customer portal (packages, speed test, support tickets, account & billing) and an admin dashboard (KPIs, customer management with **user details and activity logs**).

---

## ✨ Features

### 👤 Customer side
| Feature | Route | Description |
|---|---|---|
| **Home dashboard** | `/(customer)` | Connection status, expiry date, quick actions (recharge, change package, speed test, tickets) |
| **Internet packages** | `/(customer)/packages` | Browse & buy mock packages, filter by speed / validity |
| **Speed test** | `/(customer)/speedtest` | Real download-speed test (ping + Mbps) using Cloudflare endpoints |
| **Support tickets** | `/(customer)/support` | Ticket list with open/closed filters |
| **Account** | `/(customer)/account` | Profile, payment history, language (EN/BN), dark mode, logout |

### 🛠️ Admin side
| Feature | Route | Description |
|---|---|---|
| **Dashboard** | `/(admin)` | KPI cards (subscribers, revenue, payments, past due), quick-action menu, recent activity |
| **Customers list** | `/(admin)/customers` | Searchable customer list with connection status and **View Details** |
| **Customer details** | `/(admin)/customer/[id]` | Full user profile, subscription & device info, plus a **timeline of activity logs** |
| Subscriptions / Tickets / Invoices / Settings | `/(admin)/subscriptions`, `/tickets`, `/invoices`, `/settings` | Placeholder screens (coming soon) |

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | [Expo SDK 53](https://docs.expo.dev) (React Native 0.79, React 19) |
| Navigation | [expo-router](https://docs.expo.dev/router/introduction) (file-based routing, v5) |
| Language | TypeScript (strict mode) |
| State | Custom lightweight store (`SimpleStore`) with AsyncStorage persistence |
| Styling | React Native `StyleSheet` + theme objects (`lightTheme` / `darkTheme`) |
| Icons | `@expo/vector-icons` (Ionicons) |
| Backend | `isp-app-server` — Express + Prisma + JWT + **node-routeros** (MikroTik bridge), running on port 5000 (see [docs/BACKEND.md](docs/BACKEND.md)) |

---

## 🚀 Quick start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- [Expo Go](https://expo.dev/go) on your phone, or an Android/iOS emulator

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npx expo start
```

Then press:
- `a` — Android emulator
- `i` — iOS simulator
- `w` — web browser
- Or scan the QR code with **Expo Go**

### 3. Log in with a demo account

| Role | Credentials |
|---|---|
| **Admin** | email: `admin@demo.isp` / password: `admin123` |
| **Customer** | phone: `01877104723` / OTP: `123456` |

In development (`__DEV__`), the login forms are **pre-filled** with these demo credentials — just tap **Login** / **Verify & Login**. In production builds, use the **Use Test Account** button or type them manually.

---

## 🔐 Environment variables

All variables are optional and read via Expo's `EXPO_PUBLIC_*` convention (see [`src/config/demoLogin.ts`](src/config/demoLogin.ts)):

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_DEMO_LOGIN` | `true` in dev | `"true"` forces demo login mode in production builds |
| `EXPO_PUBLIC_DEMO_ADMIN_EMAIL` | `admin@demo.isp` | Demo admin email |
| `EXPO_PUBLIC_DEMO_ADMIN_PASSWORD` | `admin123` | Demo admin password |
| `EXPO_PUBLIC_DEMO_CUSTOMER_PHONE` | `01877104723` | Demo customer phone |
| `EXPO_PUBLIC_DEMO_CUSTOMER_OTP` | `123456` | Demo customer OTP |

> ⚠️ These are **demo-only credentials** — do not use them in a real deployment.

---

## 📂 Project structure (overview)

```
├── app/                      # expo-router file-based routes
│   ├── _layout.tsx           # Root stack layout
│   ├── index.tsx             # Entry: redirects by role → WelcomeScreen
│   ├── auth/                 # customer.tsx, admin.tsx (login screens)
│   ├── (customer)/           # Customer tab group (home, packages, speedtest, support, account)
│   └── (admin)/              # Admin stack (dashboard, customers, customer/[id], placeholders)
├── src/
│   ├── components/           # Shared UI: Card, Chip, Header, StatusPill, AdminPlaceholder
│   ├── config/               # demoLogin.ts (env-driven demo credentials)
│   ├── hooks/                # useStore.ts (React binding for SimpleStore)
│   ├── screens/              # Reusable screens (Welcome, auth, customer)
│   ├── store/                # Re-exports the app store hook
│   ├── types/                # All TypeScript interfaces
│   └── utils/                # store, theme, i18n, mockData
├── docs/                     # Project documentation (see below)
├── app.json                  # Expo app config
└── eas.json                  # EAS Build profiles
```

---

## 📚 Documentation

The full docs live in [`docs/`](docs/):

### This repo (mobile app)
- **[Architecture](docs/ARCHITECTURE.md)** — routing, state management, theming, i18n, shared components
- **[Data model](docs/DATA_MODEL.md)** — every TypeScript type, mock data, and how to wire a real backend
- **[Admin module](docs/ADMIN_MODULE.md)** — deep dive on the admin dashboard, customers list, and the details + logs page
- **[Deployment](docs/DEPLOYMENT.md)** — web export, EAS builds, release notes

### Full system
- **[System overview](docs/SYSTEM_OVERVIEW.md)** — how the app, backend, MikroTik router, and database fit together
- **[Backend](docs/BACKEND.md)** — `isp-app-server` API reference, data model, env vars, MikroTik service
- **[MikroTik integration](docs/MIKROTIK_INTEGRATION.md)** — live router facts, usage data, security
- **[MikroTik pre-flight](docs/MIKROTIK_SETUP.md)** — router-side commands to gather integration info
- **[Backend hardening](docs/BACKEND_HARDENING.md)** — prioritized plan to make the backend production-ready

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Run on Android (`expo run:android`) |
| `npm run ios` | Run on iOS (`expo run:ios`) |
| `npm run web` | Start the dev server for web |
| `npm run build` | Export a static web build to `dist/` |
| `npm run lint` | Run ESLint (⚠️ see known issue below) |
| `npx tsc --noEmit` | Type-check the project |

---

## 🧪 Verification

```bash
# Type check
npx tsc --noEmit

# Production web export (also validates every route)
npm run build
```

---

## ⚠️ Known issues

1. **`npm run lint` fails with an ajv error.** The `overrides: { ajv: "8.12.0" }` pin in `package.json` is incompatible with `@eslint/eslintrc`. This is a pre-existing dependency issue, unrelated to app code. Workaround: temporarily remove the ajv override and re-run `npm install`, or rely on `tsc --noEmit` for checks.
2. **The mobile app still runs on mock data.** The real backend (`isp-app-server`, port 5000) is fully built and running, but this app hasn't been wired to it yet — see [docs/SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md) §3.
