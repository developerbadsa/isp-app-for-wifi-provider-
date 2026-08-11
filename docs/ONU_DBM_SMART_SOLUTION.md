# ONU dBm — Smart / Auto Monitoring Solution (Optical Power)

> **Problem:** Manual dBm entry kaj kore, kintu **smart na** — ISP ra age thekei automatic OLT-based monitoring tools use kore (Ravi Monitor, NetSense, Net Manager). Amader-o sei level e jaite hobe: **ONU er optical power (dBm) automatic** — OLT/ONU theke nijei asbe, admin kichu likhte hobe na.

---

## 1. TL;DR

| Question | Answer |
|---|---|
| dBm kothay thake? | ONU er laser receiver e (fiber/optical layer) |
| MikroTik theke pawa jabe? | ❌ **Na** — router sudhu Ethernet/PPPoE layer dekhe, optical data nei |
| Tahole kotha theke asbe? | **OLT** (primary) / **TR-069 ACS** (backup) / **Manual** (fallback) |
| Smart mane ki? | Auto-poll → auto-store → **auto-alert** (customer complain er age) |
| Kon source primary? | **OLT integration** — ek-i jaigay sob ONU er dBm |

---

## 2. The 3 Auto Sources (research confirmed)

| # | Source | Kivabe kaj kore | Level |
|---|---|---|---|
| **1. OLT integration** ⭐ | OLT (Huawei/ZTE) ek-i jaigay **sob ONU dekhe** — `display ont optical-info` (Huawei CLI) ba SNMP OID diye prottek ONU er Rx/Tx power ashe. Ravi Monitor, NetSense ei-i kore | **Ei-i standard solution** — ISP er tools gulo sob ei route |
| **2. TR-069 (GenieACS)** | ONU nije theke cloud ACS server e **report kore** (CWMP) — brand er upor depend na, OLT access lagbe na. GenieACS open-source | **Backup path** — jader OLT access nai |
| **3. Manual** | Admin ONU web UI (192.168.100.1) theke dekhe likhe | **Sudhu fallback** — primary na |

### 2.1 OLT Integration (PRIMARY — this is the smart path)

OLT holo fiber network er "controller" — prottek PON port e koto ONU ache, kon ONU er signal koto — **sob oi ek jaigay**. Tai OLT e connection thakle **kono ONU te manually login kora lagbe na**.

**Huawei GPON OLT (CLI):**
```bash
# Sob ONU er optical info (ek command e sob):
display ont optical-info 0 all
# Output: ONT Rx power / Tx power / OLT Rx / Temperature / Voltage / Current
# Per ONU:
display ont optical-info 0 1        # frame 0, PON port 0, ONU id 1
display ont info 0 1                # ONU status + SN
display ont register-info 0 1       # registration time, SN, distance
```

**ZTE GPON OLT (CLI):**
```bash
show gpon onu optical-info gpon-onu_1/1/1:1     # PON port : ONU id
show gpon onu base-info gpon-onu_1/1/1:1
show gpon onu list gpon-onu_1/1/1               # sob ONU list
```

**SNMP (vendor MIB / OID):** SNMP enabled thakle vendor-specific OIDs diye poll kora jay (Huawei: `display ont optical-info` er SNMP equivalent OIDs; ZTE/Nokia alada MIB). **Recommendation:** CLI first (universal, stable), SNMP later — CLI-i ekhon cholbe.

### 2.2 TR-069 / GenieACS (BACKUP — no OLT access)

- ONU te TR-069/CWMP enable korle ONU nije theke **ACS server** e report kore (optical power, status, uptime — brand-neutral parameters).
- **GenieACS** = free, open-source ACS (MongoDB backend, REST API). Ekta ACS deploy kore prottek tenant er ONU gulo oi ACS e point korale **sob brand** report korbe — OLT lagbe na.
- Tradeoff: prottek ONU te ACS address configure korte hobe (manual ba zero-touch provisioning), ar ei data onno tools theke ante hobe.

### 2.3 Manual (FALLBACK — keep it)

- ONU web UI (192.168.100.1) → Optical Module Info → admin `Edit Customer` e likhe.
- **Already built** in the app (color badge + `onuRxPower`/`onuTxPower` fields). Ei-ta universal fallback — sob scenario e kaj korbe.

---

## 3. Smart Architecture (SaaS-ready, pluggable)

```
┌─────────────────────────────────────────────────────────────┐
│  Per-tenant OltConfig (DB, encrypted creds)                 │
│    brand: MANUAL | HUAWEI | ZTE | OTHER                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  OltAdapter interface   │  ← strategy pattern
              │  testConnection(config) │
              │  listOnus(config)       │
              │  getOnuOpticalPower(    │
              │    config, onuKey)      │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  huaweiAdapter       zteAdapter        manualAdapter
  (CLI/SSH/SNMP)      (CLI/SSH/SNMP)    (returns null — UI entry)
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              ┌───────────────────────────┐
              │  Sync job (cron, per-org) │  ← every 5–15 min
              │  poll each ONU →          │
              │  upsert OnuReading row    │
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │  Panel / Alerts           │
              │  • Customer details: dBm  │
              │  • Honeycomb network view │
              │  • ⚡ AUTO-ALERT:          │
              │    dBm < -27 → ticket+SMS │
              └───────────────────────────┘
```

**Core rule (same as the whole app):** *Every dBm shown must have a real source* — `OnuReading.source = ADAPTER | MANUAL`, plus `recordedAt`. No fabricated values.

---

## 4. 🔑 The Missing Piece: Customer ↔ ONU Mapping

OLT ONU chine **PON port + ONU ID** ba **SN (serial number)** diye — **PPPoE username diye na**! Ei mapping chara dBm anle kon customer er seta bujha jabe na.

| Mapping way | Kivabe | Status |
|---|---|---|
| **Manual mapping (admin)** | OLT theke ONU list dekh → customer er sathe bind (ONU SN / PON port+ID) | Ekhon-i possible, low effort |
| **Auto via MAC/SN** | PPPoE session er `caller-id` (MAC) ↔ OLT er ONU MAC/SN match → auto-bind | Smart, but requires both sides to report MAC consistently |
| **Auto via provisioning** | OLT theke ONU provision korar somoy DB te SN save kore rakha | Best long-term — provisioning flow e integrate |

**Design:** `Customer` e `onuSn` / `ponLocation` (e.g. `0/1:3` = frame/port:id) nullable field add — mapping storage.

---

## 5. ⚡ Auto-Alert Flow (the real value)

```
Sync job → OnuReading (rxPowerDbm = -28.4)
    │
    ▼
Alert engine (per org):
  • dBm < -27  → 🔴 PROBLEM  → auto-create Ticket (priority: high) + SMS to admin
  • -27..-25   → 🟠 WEAK     → warning row (no ticket yet)
  • -25..-20   → 🟡 ACCEPTABLE
  • -20..-8    → 🟢 GOOD
  • > -8       → 🔴 OVERLOAD  → auto-ticket (ONU damage risk)
    │
    ▼
Admin panel: alert badge + ticket list + customer details e red badge
```

**Benefit:** Customer "net off" bole phone korar **age** field team signal problem dekhe fiber thik korte jay — this is the difference between a tool and a *smart* tool.

**Color thresholds (documented with customer's ranges):**

| dBm range | Status | Badge |
|---|---|---|
| `> -8` | Overload (damage risk) | 🔴 Red |
| `-8 to -20` | Good | 🟢 Green |
| `-20 to -25` | Acceptable | 🟡 Yellow |
| `-25 to -27` | Weak | 🟠 Orange |
| `< -27` | Problematic (disconnect/slow) | 🔴 Red |

---

## 6. Prisma Schema Sketch

```prisma
enum OltBrand { MANUAL HUAWEI ZTE OTHER }

model OltConfig {
  id                String     @id @default(cuid())
  orgId             String     @unique
  brand             OltBrand   @default(MANUAL)
  host              String?
  port              Int?
  username          String?
  encryptedPassword String?    // AES-256-GCM — same crypto helper as MikrotikConfig
  encryptionIv      String?
  encryptionTag     String?
  isActive          Boolean    @default(true)
  updatedAt         DateTime   @updatedAt
  org               Organization @relation(fields: [orgId], references: [id])
}

model OnuReading {
  id          String            @id @default(cuid())
  orgId       String
  customerId  String
  rxPowerDbm  Float?
  txPowerDbm  Float?
  source      OnuReadingSource  @default(MANUAL)  // ADAPTER | MANUAL
  recordedAt  DateTime          @default(now())
  customer    Customer          @relation(fields: [customerId], references: [id])
  @@index([orgId, customerId, recordedAt])
}
```

Customer mapping fields (nullable, add in same migration):
```prisma
model Customer {
  // existing fields...
  onuSn        String?  // ONU serial number
  ponLocation  String?  // e.g. "0/1:3" = frame 0 / PON port 1 / ONU id 3
}
```

---

## 7. Implementation Phases

| Phase | What | Effort |
|---|---|---|
| **P1 — Framework** | `OltAdapter` interface + registry, `OltConfig`/`OnuReading` models + migration, manual adapter (existing UI), mapping fields on Customer | Small |
| **P2 — Huawei adapter** | SSH/CLI client → `display ont optical-info` parse → per-ONU Rx/Tx. Test against a **real Huawei OLT** when first tenant has one | Medium |
| **P3 — Sync + alerts** | Cron job (per-org, 5–15 min) → upsert readings; alert engine (thresholds → ticket + SMS) | Medium |
| **P4 — ZTE/other adapters** | Same pattern, vendor CLI differences | Per vendor |
| **P5 — TR-069 (GenieACS)** | Only if tenants need it (no OLT access) — separate deploy | Large, optional |

**Rule:** adapter er implementation **real device chara test kora jabe na** — vendor CLI quirks guess kora jay na. Framework + manual ekhon, first real adapter jokhon kono tenant er asol OLT ache.

---

## 8. What We Need (open questions — answer before building P2+)

1. **Apnar kono tenant/lab e OLT ache?** Kon brand (Huawei MA5608T / ZTE C320 / Nokia)?
2. OLT e **SSH/telnet access** ache (CLI) — naki sudhu SNMP?
3. ONU gulo kon brand er (BD te common: Huawei HG8310M, ZTE F670L, Nokia G-140W, Fiberhome)?
4. ONU te **TR-069** already enabled ache ki na (GenieACS path er jonno)?
5. Per customer **mapping** ki vabe hobe — admin manual, na auto via MAC/SN?

> Jotokhon P2-P5 er jonno real OLT/ONU access nai, **manual entry ei cholbe** (already built) — framework P1 ta ready rakha hobe.

---

## 9. Related Docs

- [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) — Goal 2 (live intelligence) + Goal 4 (SaaS) e ei solution er place
- [`MULTI_TENANT_PLAN.md`](./MULTI_TENANT_PLAN.md) — OltConfig/OnuReading schema + per-tenant design
- [`MIKROTIK_INTEGRATION.md`](./MIKROTIK_INTEGRATION.md) — router-side live usage (bytes/speed) — MikroTik theke ja pawa jay oi sob
