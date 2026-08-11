# Data model

All shared types live in `src/types/index.ts`. All mock data lives in `src/utils/mockData.ts`.

---

## 1. Types

### Core enums (string unions)

```ts
type UserRole = 'customer' | 'admin';
type Language = 'en' | 'bn';

type ConnectionStatus = 'connected' | 'expiring' | 'past_due' | 'suspended';
type TicketStatus    = 'pending' | 'resolved' | 'cancelled';
type TicketPriority  = 'low' | 'medium' | 'high' | 'urgent';
type InvoiceStatus   = 'paid' | 'open' | 'overdue';
```

### `User` — logged-in identity

```ts
interface User {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
  email?: string;
  loginId?: string;
  clientCode?: string;
  avatar?: string;
}
```

Used by the app store. Created at login time in `CustomerLoginScreen` / `AdminLoginScreen`.

### `Package` — internet package

```ts
interface Package {
  id: string;
  name: string;
  speed: number;      // Mbps
  validity: number;   // days
  price: number;      // BDT
  isPopular?: boolean;
  isNew?: boolean;
  features: string[];
}
```

### `Ticket` — support ticket

```ts
interface Ticket {
  id: string;
  number: string;                 // e.g. "#234"
  title: string;
  category: 'billing' | 'technical' | 'other';
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
  customerId?: string;
  customerName?: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  content: string;
  isCustomer: boolean;
  timestamp: string;
  attachments?: string[];
}
```

### `Invoice` — billing

```ts
interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  amount: number;
}
```

### `Notification`

```ts
interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'maintenance' | 'billing' | 'general';
}
```

### `CustomerUser` — admin view of a customer (added for the admin module)

```ts
interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loginId: string;        // e.g. "SKY001234"
  clientCode: string;     // e.g. "C001234"
  zone: string;           // e.g. "Dhaka North"
  subzone?: string;       // e.g. "Gulshan"
  address?: string;
  packageName: string;
  speed: number;
  price: number;
  status: ConnectionStatus;
  expiryDate: string;
  joiningDate: string;
  uptime: string;         // e.g. "99.8%"
  mac?: string;
  ip?: string;
  deviceVendor?: string;
  lastLogin?: string;     // ISO datetime
}
```

### `ActivityLog` — customer activity (used on the details page)

```ts
type ActivityLogType = 'login' | 'logout' | 'payment' | 'package' | 'connection' | 'ticket' | 'admin';
type ActivityLogLevel = 'success' | 'warning' | 'error' | 'info';

interface ActivityLog {
  id: string;
  userId: string;       // references CustomerUser.id
  type: ActivityLogType;
  title: string;
  detail?: string;
  timestamp: string;    // ISO datetime
  level: ActivityLogLevel;
}
```

---

## 2. Mock data

| Export | Type | Purpose |
|---|---|---|
| `mockPackages` | `Package[]` | Basic / Standard / Turbo packages |
| `mockTickets` | `Ticket[]` | Sample support tickets |
| `mockInvoices` | `Invoice[]` | Sample invoices |
| `mockNotifications` | `Notification[]` | Sample notifications |
| `mockCustomerProfile` | object | Profile shown on the customer account screen |
| `mockUsers` | `CustomerUser[]` | 6 customers for the admin list & details pages |
| `mockActivityLogs` | `ActivityLog[]` | 24 log entries across all users (John Doe has 8) |

### How the admin screens consume them

- `app/(admin)/customers.tsx` filters `mockUsers` by search text and renders each row.
- `app/(admin)/customer/[id].tsx` looks up `mockUsers.find(u => u.id === id)` and `mockActivityLogs.filter(log => log.userId === id)`, sorted newest-first.

---

## 3. Mapping to the real backend (Prisma/PostgreSQL)

The real system has a backend (`isp-app-server`, Express + Prisma + PostgreSQL) — see **[BACKEND.md](BACKEND.md)**. Its Prisma models map to these types almost 1:1:

| Mobile type | Prisma model | Notes |
|---|---|---|
| `User` | `User` | Backend uses `email` + `passwordHash` + `role` (STAFF/ADMIN) — the mobile app currently has its own demo login |
| `CustomerUser` | `Customer` | Backend stores `name, phone, pppoeUsername, pppoePassword, zone, status, packageId, onuRxPower, onuTxPower` — **no** MAC/IP/uptime in DB; those come live from MikroTik |

> **ONU optical power (`onuRxPower` / `onuTxPower`, dBm):** recorded manually (admin reads the ONU web UI, e.g. `-18.5`), color-coded in the admin details dialog. MikroTik **cannot** provide dBm (it sees only the Ethernet/PPPoE side — optical readings live on the OLT↔ONU fiber link). A future OLT/SNMP integration can auto-fill these fields.
| `Package` | `Package` | `speedMbps`, `price`, `validityDays` — same fields |
| `Invoice` | `Invoice` + `Payment` | Backend splits payments into their own table |
| `Ticket` | `Ticket` | Same concept |
| `ActivityLog` | *(not in DB)* | **Needs a new table** (`activity_logs`) or derived from MikroTik `/log` + polling history — see [MIKROTIK_INTEGRATION.md](MIKROTIK_INTEGRATION.md) §3 |

> The mobile `CustomerUser` is deliberately richer than the DB row: MAC, IP, uptime, last-login and live usage are **router data**, fetched via `GET /api/mikrotik/active` (matched by `pppoeUsername`).

---

## 4. Wiring the mobile app to the backend

The app currently runs 100% on mock data. `@supabase/supabase-js` is installed but unused; the real backend is `isp-app-server` on `localhost:5000`. To go live with the backend:

1. **Add a Supabase client** (e.g. `src/config/supabase.ts`):

   ```ts
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
   );
   ```

2. **Replace mock reads with queries**, e.g. for the customers list:

   ```ts
   const { data } = await supabase.from('customers').select('*');
   ```

3. **Keep the type contracts.** `CustomerUser`, `ActivityLog`, etc. are designed to map 1:1 to database tables (`customers`, `activity_logs`), so swapping the data source should not require UI changes.

4. **Planned table shapes** (suggested):

   - `customers` — mirrors `CustomerUser`
   - `activity_logs` — mirrors `ActivityLog` (`user_id` FK → `customers.id`)
   - `packages`, `tickets`, `invoices`, `notifications` — mirror their interfaces

> Suggested next step: add a small data-access layer (e.g. `src/api/`) so screens never import mock data directly. See [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) §3 for the screen → endpoint mapping.
