# Architecture

This document explains how the **mobile app** (this repo) is structured. The full system also includes a **backend** (`isp-app-server`) and a **MikroTik router** — see **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** and **[BACKEND.md](BACKEND.md)**.

```
Mobile app (this repo) ──► isp-app-server (Express+Prisma, :5000) ──► MikroTik (8728) + PostgreSQL
```

---

## 1. File-based routing (expo-router)

The app uses **expo-router v5**, where every file inside `app/` is a route. Routes are grouped with parentheses `(group)` — these **do not** appear in the URL but let you share layouts.

### Route map

```
app/
├── _layout.tsx          → Root <Stack>: index, auth/*, (customer), (admin)
├── index.tsx            → Entry. If logged in, redirects by role:
│                           customer → /(customer), admin → /(admin)
│                           otherwise renders <WelcomeScreen>
├── auth/
│   ├── customer.tsx     → CustomerLoginScreen (phone → OTP flow)
│   └── admin.tsx        → AdminLoginScreen (email + password)
├── (customer)/          → Customer tab group (<Tabs>)
│   ├── _layout.tsx      → Bottom tabs: index, packages, support, account
│   ├── index.tsx        → HomeScreen
│   ├── packages.tsx     → PackagesScreen
│   ├── speedtest.tsx    → Speed test screen (outside tab bar, pushed)
│   ├── support.tsx      → Support tickets
│   └── account.tsx      → Profile, billing, settings, logout
└── (admin)/             → Admin stack group (<Stack>)
    ├── _layout.tsx      → Registers all admin screens (role-guarded)
    ├── index.tsx        → AdminDashboard (KPIs + quick actions)
    ├── customers.tsx    → Customer list with search + View Details
    ├── customer/[id].tsx→ Customer details + activity logs
    └── subscriptions.tsx / tickets.tsx / invoices.tsx / settings.tsx
                          → Placeholder screens (coming soon)
```

### Navigation between screens

```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/customers');            // push a route
router.push(`/customer/${user.id}`);  // dynamic route
router.back();                        // go back
router.replace('/(admin)');           // replace (used after login)
```

Dynamic params are read with `useLocalSearchParams`:

```tsx
const { id } = useLocalSearchParams<{ id: string }>();
```

### Role guard

`app/(admin)/_layout.tsx` returns `null` when the current user is not an admin. The entry screen (`app/index.tsx`) is responsible for routing each role to the correct group.

---

## 2. State management (`SimpleStore`)

The app uses a tiny custom store instead of a state library.

### Files

| File | Purpose |
|---|---|
| `src/utils/store.ts` | The `SimpleStore` class — plain JS state + pub/sub |
| `src/hooks/useStore.ts` | `useAppStore()` — React hook that subscribes a component to the store |
| `src/store/index.ts` | Re-exports `useAppStore` for clean imports |

### How it works

- `SimpleStore` keeps a private `state` object and a list of `listeners`.
- `setState(partial)` merges updates and notifies every listener.
- `useAppStore()` reads the current state into React state and re-renders on every store change.
- **Persistence:** `setTheme` / `setLanguage` persist to AsyncStorage; `initialize()` restores them on app start (called from the root layout).

### Store shape

```ts
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  connectionStatus: ConnectionStatus;
  expiryDate: string;
}
```

### Using it in a component

```tsx
const { theme, language, user, login, logout } = useAppStore();
```

---

## 3. Theming

Themes live in `src/utils/theme.ts`:

- `lightTheme` — default palette (blue primary `#2563EB`, white backgrounds)
- `darkTheme` — same shape, dark backgrounds (`#111827`, `#1F2937`)

Both export a `colors` object, `spacing`, `borderRadius`, and `fontSize` scales.

Every screen resolves the active theme the same way:

```tsx
const { theme } = useAppStore();
const colors = theme === 'light' ? lightTheme : darkTheme;

<View style={{ backgroundColor: colors.colors.background }}>
  <Text style={{ color: colors.colors.text }}>…</Text>
</View>
```

Shared components (`Card`, `Chip`, `StatusPill`, `Header`) resolve the theme internally, so you don't pass colors to them.

---

## 4. Internationalization (i18n)

Translations live in `src/utils/i18n.ts` under a `translations` object keyed by language (`en`, `bn`).

```tsx
const { language } = useAppStore();
const t = translations[language];

<Text>{t.packages}</Text>  // "Packages" / "প্যাকেজ"
```

> Note: most admin screens and some customer screens still use hardcoded English strings. Adding a new string to `i18n.ts` and using `t.*` is the way forward.

---

## 5. Shared components

| Component | File | Description |
|---|---|---|
| `Card` | `src/components/Card.tsx` | Themed surface with shadow; accepts `style` and `padding` props |
| `Chip` | `src/components/Chip.tsx` | Toggleable pill; variants `default / success / warning / error` |
| `Header` | `src/components/Header.tsx` | Blue app bar with logo, optional title, notification bell, avatar |
| `StatusPill` | `src/components/StatusPill.tsx` | Colored status badge for connection / ticket / invoice statuses |
| `AdminPlaceholder` | `src/components/AdminPlaceholder.tsx` | "Coming soon" screen with back button, used by unfinished admin sections |

---

## 6. Config & environment

`src/config/demoLogin.ts` centralizes demo credentials (see below). The real system credentials (JWT, database, MikroTik) live in the **backend's** `.env` — never in the mobile app.

- `isDemoLoginEnabled` — `true` in development, or when `EXPO_PUBLIC_DEMO_LOGIN === 'true'`
- `adminDemoCredentials` / `customerDemoCredentials` — read from `EXPO_PUBLIC_DEMO_*` env vars with sensible defaults

See [README → Environment variables](../README.md#-environment-variables) for the full table.
