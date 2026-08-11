# Admin module

Everything the **admin role** can do, how it works, and how to extend it.

---

## 1. Access

- Log in at **Admin Login** (`/auth/admin`) with the demo credentials:
  - email: `admin@demo.isp` / password: `admin123`
- The entry screen (`app/index.tsx`) redirects admins to `/(admin)`.
- `app/(admin)/_layout.tsx` guards the group — if the logged-in user is not an admin, nothing renders.

## 2. Screen map

| Route | File | Description |
|---|---|---|
| `/(admin)` | `app/(admin)/index.tsx` | Dashboard: 4 KPI cards, quick-action menu, recent activity feed |
| `/(admin)/customers` | `app/(admin)/customers.tsx` | **Customer list** — searchable, status pills, View Details |
| `/(admin)/customer/[id]` | `app/(admin)/customer/[id].tsx` | **Customer details** — profile, subscription, device info, activity logs |
| `/(admin)/subscriptions` | `app/(admin)/subscriptions.tsx` | Placeholder (coming soon) |
| `/(admin)/tickets` | `app/(admin)/tickets.tsx` | Placeholder (coming soon) |
| `/(admin)/invoices` | `app/(admin)/invoices.tsx` | Placeholder (coming soon) |
| `/(admin)/settings` | `app/(admin)/settings.tsx` | Placeholder (coming soon) |

> 💡 The dashboard's quick-action menu (`app/(admin)/index.tsx`) is a plain array of `{ title, icon, route }` — add or reorder entries there.

---

## 3. Customers list (`/customers`)

**Purpose:** browse and search all customers, then drill into a single customer's details.

### UI
- Search bar — matches against **name, phone, login ID, and client code** (case-insensitive). A clear (✕) button empties the search.
- Live count of filtered results ("6 customers").
- Each row is a `Card` with:
  - initial avatar
  - name, login ID, phone
  - package summary (`Standard • 50 Mbps • ৳950`)
  - `StatusPill` (CONNECTED / EXPIRING / PAST DUE / SUSPENDED)
  - expiry date
  - **View Details** button (the whole row header is also tappable)

### Implementation notes
- Data source: `mockUsers` from `src/utils/mockData.ts`.
- Navigation: `router.push(\`/customer/${user.id}\`)`.
- Empty state: shows a "No customers found" message when the search matches nothing.

---

## 4. Customer details (`/customer/[id]`)

**Purpose:** show everything about one customer — who they are, what they pay for, and a timeline of everything that happened to their account.

### Header
- Custom blue nav bar with a **back arrow** (returns to the customers list) and the title *Customer Details*.
- If the `id` param doesn't match any customer, a "Customer not found" empty state is shown.

### Sections (top → bottom)

| Section | Fields |
|---|---|
| **Profile** | Avatar + name + login ID + status pill; phone, email, client code, login ID, zone/subzone, address, joining date |
| **Subscription** | Package (`Standard • 50 Mbps`), monthly bill, expiry date, uptime, last login |
| **Device / Network** | MAC address, current IP, device vendor |
| **Activity Logs** | Timeline of log entries, newest first, with count badge |

### Activity Logs detail

Each log entry renders:

- a colored circular icon (by `type`):
  | type | icon | color |
  |---|---|---|
  | login | log-in | green |
  | logout | log-out | grey |
  | payment | credit card | blue |
  | package | swap arrows | orange |
  | connection | wifi | red |
  | ticket | help circle | orange |
  | admin | shield check | grey |
- title, optional detail line, formatted timestamp (`Jan 15, 15:00`)
- a status dot colored by `level` (`success` green / `warning` orange / `error` red / `info` grey)

The icon/color mapping lives in `LOG_ICONS` and `LEVEL_COLORS` at the top of `app/(admin)/customer/[id].tsx` — extend those maps if you add new log types.

### Implementation notes
- Route param: `useLocalSearchParams<{ id: string }>()`
- Lookups: `mockUsers.find(...)` and `mockActivityLogs.filter(...)` sorted by `timestamp` descending
- Timestamps in the mock data are UTC (`Z`); the UI formats them in the device's local timezone.

---

## 5. Placeholder screens

`subscriptions`, `tickets`, `invoices`, and `settings` render `AdminPlaceholder` (`src/components/AdminPlaceholder.tsx`) — a shared "coming soon" screen with a back button. To build one out:

1. Create the real screen in `app/(admin)/<name>.tsx` (replace the placeholder import).
2. If it needs a details route, add it to `app/(admin)/_layout.tsx` (e.g. `<Stack.Screen name="tickets/[id]" />`).

---

## 6. Adding a new admin feature

1. **Types first** — add/update interfaces in `src/types/index.ts`.
2. **Data** — extend `src/utils/mockData.ts` or (better) query your backend.
3. **Route** — create the screen file under `app/(admin)/` and register it in `app/(admin)/_layout.tsx`.
4. **Navigation** — add a menu entry in `app/(admin)/index.tsx` (`menuItems` array) if it belongs on the dashboard.
5. **Verify** — run `npx tsc --noEmit`, then `npm run build` (exports every route; catches missing routes).

---

## 7. Known limitations

- All data is **mocked** — no write operations (suspend, recharge, package change) exist yet.
- The dashboard KPI numbers and recent activity feed are hardcoded.
- Admin screens use hardcoded English strings (i18n not applied there yet).
