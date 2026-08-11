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

> ✅ **RESOLVED (Aug 2026):** Router IP is `192.168.122.82` (`MIKROTIK_HOST` in `.env`), API allowlist = `192.168.122.1/32,192.168.110.103/32`, and the local-dev → router path is fully wired up. See **[`MIKROTIK_CONNECTIVITY_SETUP.md`](./MIKROTIK_CONNECTIVITY_SETUP.md)** for the 3-layer fix (Windows route → router allowlist → host iptables), verification steps, and gotchas.

---

## 2. How the backend connects

- Library: **`node-routeros`** (API protocol, not REST)
- Config: `MIKROTIK_HOST`, `MIKROTIK_PORT` (8728), `MIKROTIK_USERNAME` (admin), `MIKROTIK_PASSWORD`
- Every service function opens a connection, runs commands, closes it (`keepalive: true`, 5s timeout)
- Commands used: `/system/identity/print`, `/system/resource/print`, `/ppp/secret/print`, `/ppp/active/print`, `/ppp/profile/print`, `/ppp/secret/add|set`, `/ppp/active/remove`

---

## 3. Getting **usage** ("leasure koto passe")

### ✅ Live session usage (current session only)
> ⚠️ **Verified on RouterOS 7.21.5:** `/ppp active print stats` does **NOT** exist — the router rejects `=stats=yes` with `unknown parameter stats`. Per-session bytes live on the **dynamic `pppoe-in` interfaces** instead:

```bash
/interface print
# <pppoe-testuser>  pppoe-in  dyn:true  rx-byte:1840  tx-byte:672  link-downs:0
```

> Each active session creates a dynamic interface named `<pppoe-<username>>` — `rx-byte` = download (bytes-in), `tx-byte` = upload (bytes-out). `/ppp active print` gives session metadata (uptime, address/IP, caller-id/MAC, session-id); the matching interface adds the byte counters.

**✅ Implemented** in the backend (`getPPPoESessionStats` fetches `/ppp/active/print` + `/interface/print` and merges `bytes-in`/`bytes-out` from the matching `<pppoe-<name>>` interface; also handles the router's `!empty` reply as "no sessions"):

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
| Poll & store in DB | Low | Backend polls `/ppp active print` + `<pppoe-*>` interface counters every N min, writes to a `usage_snapshots` table → cumulative approximations |

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

# Active sessions
/ppp active print

# USAGE (bytes) — per-session dynamic pppoe-in interface
/interface print where type=pppoe-in

# Session live rate (per session)
/ppp active monitor numbers=0 once

# Router events (could feed the Activity Logs tab)
/log print
```
