# MikroTik integration

Everything we know about the live router, how the backend talks to it, and how to get **usage data** into the mobile app.

---

## 1. Router facts (verified from live output)

| Fact | Value |
|---|---|
| RouterOS version | **7.21.5 (long-term)** |
| Platform | **CHR** (Cloud Hosted Router) on QEMU/Ubuntu VM, x86_64 |
| RAM / disk | 512 MiB / ~89 MiB |
| API service | ✅ **enabled**, port **8728**, protocol tcp |
| `www-ssl` (REST) | disabled — not needed (backend uses API protocol) |
| PPPoE profiles | `5M`, `10M`, `20M`, `50M` |
| PPPoE secrets | `testuser`, `user2`, `user5m-1..10`, `user10m-1..10`, `test_pppoe_...`, `rayhan-pppoe` (20M), `Dulufa` (20M) |
| Active session (at check time) | `testuser` — MAC `52:54:00:62:32:A3`, IP `10.10.10.99`, uptime `20h25m9s` |

### ⚠️ Two things to verify on the router
1. **Router's own IP** — run `/ip address print`. The backend's `.env` points at `MIKROTIK_HOST=192.168.110.199` — confirm that's this router.
2. **API access restriction** — the command `/ip service set api address=192.168.88.10/32` was run. `192.168.88.10` must be the **backend machine's IP**, or the backend will be locked out. To fix:
   ```bash
   /ip service set api address=<backend-server-ip>/32
   ```
   (To allow any LAN client while testing, use `0.0.0.0/0` — but restrict again afterwards.)

---

## 2. How the backend connects

- Library: **`node-routeros`** (API protocol, not REST)
- Config: `MIKROTIK_HOST`, `MIKROTIK_PORT` (8728), `MIKROTIK_USERNAME` (admin), `MIKROTIK_PASSWORD`
- Every service function opens a connection, runs commands, closes it (`keepalive: true`, 5s timeout)
- Commands used: `/system/identity/print`, `/system/resource/print`, `/ppp/secret/print`, `/ppp/active/print`, `/ppp/profile/print`, `/ppp/secret/add|set`, `/ppp/active/remove`

---

## 3. Getting **usage** ("leasure koto passe")

### ✅ Live session usage (current session only)
On RouterOS 7 the cumulative bytes for active sessions come from the **stats** flag:

```bash
/ppp active print stats
```

> The plain `/ppp active print` shows only name/service/caller-id/address/uptime (exactly what your earlier output showed). Adding `stats` returns **bytes-in / bytes-out / packets** per active user.

**✅ Implemented** in the backend (`getPPPoESessionStats` sends `/ppp/active/print` with `=stats=yes`):

```
GET /api/customers/:id/live           → usage for ONE customer (matches session by pppoeUsername)
```

Returns `{ username, online, reachable, uptime, ip, mac, bytesIn, bytesOut }` and degrades gracefully (`reachable: false`) when the router is unreachable.

Mobile app then shows, per customer:
- online/offline (session exists?)
- session uptime, caller IP, MAC
- download (bytes-in) / upload (bytes-out), formatted as MB/GB
- live speed (diff two samples over a few seconds, or `/ppp active monitor`)

### ⚠️ Historical / monthly usage (billing-grade)
The router does **not** store per-user totals across sessions. Options:
| Option | Effort | What you get |
|---|---|---|
| **RADIUS accounting** (FreeRADIUS + MySQL) | High (new server + router config) | Per-session + monthly totals, ISP standard |
| `/ip accounting` on the router | Medium | Per-IP traffic snapshots (resets on snapshot) |
| Poll & store in DB | Low | Backend polls `/ppp active print stats` every N min, writes to a `usage_snapshots` table → cumulative approximations |

Recommendation: start with **poll & store** (Low effort, good enough for a usage card), move to **RADIUS** when billing needs real quotas.

> The web admin (`frontend-webapp`) already shows live usage in the **customer details dialog** via `GET /api/customers/:id/live` (auto-refreshes every 30s with a manual refresh button).

---

## 4. Matching customers ↔ PPPoE users

The router's PPPoE usernames are **arbitrary** (`testuser`, `user5m-1`, `rayhan-pppoe`, ...) — no `C001234`-style pattern. **This is fine** because:

- The backend DB stores `Customer.pppoeUsername` (unique)
- `GET /api/customers/:id` returns it
- Look up live session by `name === pppoeUsername`

No naming convention change needed.

---

## 5. Security notes

- ✅ MikroTik endpoints are behind **JWT + adminOnly**
- ⚠️ API traffic is **plaintext** on 8728 — fine on a trusted LAN; for production consider `api-ssl` (8729, `MIKROTIK_TLS=true`)
- ⚠️ Keep `/ip service` restrictions tight (only the backend's IP)
- ✅ Router credentials live in `.env`, never in the mobile app

---

## 6. Quick reference commands

```bash
# Router status
/system resource print

# Services (check api / api-ssl)
/ip service print

# Router's own addresses (find the IP the backend should use)
/ip address print

# PPPoE users
/ppp secret print

# Active sessions + USAGE
/ppp active print
/ppp active print stats

# Session live rate (per session)
/ppp active monitor numbers=0 once

# Router events (could feed the Activity Logs tab)
/log print
```
