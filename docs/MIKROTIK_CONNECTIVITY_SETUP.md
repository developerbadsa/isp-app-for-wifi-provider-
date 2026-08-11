# MikroTik Connectivity Setup (Local Dev → Router)

> **Purpose:** Document the exact network setup that connects the **local admin panel / backend** to the **MikroTik CHR router**, including the 3-layer fix, verification steps, and gotchas — so humans AND AI agents can diagnose/fix it again in minutes.

---

## 1. TL;DR — What happened & what fixed it

**Symptom:** Admin Panel → Settings → MikroTik Integration showed `Status: Offline / Unreachable` + `Timed out after 5 seconds` (host `192.168.122.82:8728`), even though the deployed backend on the Ubuntu host connected fine.

**Root cause (3 stacked layers):**

| # | Layer | Problem | Fix |
|---|-------|---------|-----|
| 1 | Windows PC | No route to router network (`192.168.122.0/24`) | Add route via Ubuntu host |
| 2 | MikroTik router | API service only allowed `192.168.122.1` | Add PC IP to allowlist |
| 3 | Ubuntu host | libvirt `LIBVIRT_FWI` chain **REJECTs** all new external→`virbr0` connections | Insert ACCEPT rule **before** the reject |

The panel was hitting the **local backend** (localhost:5000) which couldn't reach the router; the **deployed backend** (192.168.110.199:5000) always could.

---

## 2. Network Map

```
Windows PC (admin panel + local backend)
  192.168.110.103 (Ethernet 2)        Tailscale: 100.113.226.76
        │  route add 192.168.122.0/24 via 192.168.110.199
        ▼
Ubuntu Host "devrahimbadsa"  (backend: deployed @ /var/www/mern/isp-app-server, PM2)
  wlp1s0  = 192.168.110.199            tailscale0 = 100.88.164.43
  virbr0  = 192.168.122.1   (libvirt VM bridge)
        │  iptables FORWARD ACCEPT (rule #1)
        ▼
MikroTik CHR (RouterOS 7.21.5)  @ 192.168.122.82  — API port 8728
  /ppp secret, /ppp active, /queue — real PPPoE data source
```

- **Local backend:** `localhost:5000` (this Windows PC, dev) — needs all 3 fixes
- **Deployed backend:** `192.168.110.199:5000` (Ubuntu host, PM2) — works natively (source IP = 192.168.122.1, already allowed)

---

## 3. The 3 Fixes (exact commands)

### Fix 1 — Windows PC (Command Prompt **as Administrator**)

```bat
route add 192.168.122.0 mask 255.255.255.0 192.168.110.199
:: persistent (survives reboot):
route add -p 192.168.122.0 mask 255.255.255.0 192.168.110.199
```

Verify: `route print -4 | findstr 192.168.122`

> ⚠️ **This is a Windows command.** Do NOT run it on the MikroTik console — the router returns `bad command name route`. MikroTik's own syntax is `/ip route ...`, but the router does NOT need a route; only the PC does.

### Fix 2 — MikroTik console (allow PC into API service)

```
/ip service set api address=192.168.122.1/32,192.168.110.103/32
```

Verify: `/ip service print detail where name=api`

> `192.168.122.1` = Ubuntu host (backend), `192.168.110.103` = Windows PC. Without this, the router silently drops the PC's API connection (TCP timeout, not refused).

### Fix 3 — Ubuntu host (allow forwarding to the VM/router)

```bash
sudo iptables -I FORWARD 1 -i wlp1s0 -o virbr0 -d 192.168.122.82 -p tcp --dport 8728 -j ACCEPT
```

**Why `-I FORWARD 1` (position matters!):** libvirt's `LIBVIRT_FWI` chain contains `oifname "virbr0" reject` for all NEW external→virbr0 connections. Rules added later in the chain (e.g. via `ufw route allow`) never match because the reject runs first. The accept rule MUST be inserted at the top of the FORWARD chain.

Verify: `sudo nft list ruleset | grep -A5 "chain FORWARD"`

---

## 4. Persistence (reboot-safe)

```bash
sudo apt install -y iptables-persistent   # NOTE: removes ufw (conflict) — this is OK
sudo netfilter-persistent save            # saves to /etc/iptables/rules.v4
```

- During install, answer **Yes** for IPv4 rules, **No** for IPv6.
- Rule file: `/etc/iptables/rules.v4` — verify with `sudo grep -n 8728 /etc/iptables/rules.v4`
- ufw removal is fine: ufw's `DEFAULT_FORWARD_POLICY=DROP` was part of the problem.
- After host reboot, check the connection again — libvirt skips re-adding its chains if they already exist (from rules.v4), so the accept rule stays first.

---

## 5. Verification (full chain)

```bash
# A) PC → router TCP (must be OPEN)
timeout 5 bash -c 'echo > /dev/tcp/192.168.122.82/8728' && echo OPEN

# B) Local backend → router handshake + auth
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"testadmin@isp.local","password":"testpass123"}'   # → token
curl -s http://localhost:5000/api/mikrotik/status -H "Authorization: Bearer <TOKEN>"
# → {"connected": true, "identity": "MikroTik", "version": "7.21.5 (long-term)", ...}

# C) UI: Admin Panel → Settings → MikroTik Integration → Test Connection → Online
```

---

## 6. Gotchas & AI-Agent Hints (learned the hard way)

1. **`ping OK` + `all TCP timeout` = firewall DROP, not routing.** If ICMP reaches the router but every TCP port (22/80/8728/8291) times out, the packets are being dropped silently somewhere in the forward/input path — check firewalls, not routes.
2. **Router firewall was empty** — `/ip/firewall/filter/print` with no rules. RouterOS API returns `!empty` for an empty chain; `node-routeros` throws `RosException: Tried to process unknown reply: !empty` — that error actually means **zero rules** (not a bug).
3. **`ufw route allow` printed "Skipping adding existing rule" but added nothing** — ufw falsely matched libvirt's existing rules. The rules appeared in the kernel only as duplicates at the END of FORWARD (counter `0 packets` forever) because libvirt's reject already dropped the packets earlier in the chain.
4. **Env key is `MIKROTIK_USERNAME`** (both local and deployed `.env`) — not `MIKROTIK_USER`. A script reading the wrong key gets `Username or password is invalid` with an empty user.
5. **RouterOS REST API (`/rest/...`) returned `400 Bad Request`** on this router even with valid auth — unreliable here. Use the **API protocol (8728)** via `node-routeros` (what the backend already uses).
6. **Deployed backend reads `.env` from `/var/www/mern/isp-app-server/.env`** and runs `dist/index.js` under PM2 (`pm2 list`, restart with `pm2 restart isp-app-server` after `npm run build`).
7. **To run a one-off node-routeros script on the host:** require with an absolute path (`require('/var/www/mern/isp-app-server/node_modules/node-routeros')`) — `require` resolves from the script's location, not cwd.
8. **Admin Panel = local frontend → local backend (`localhost:5000`).** If the panel shows offline, check the LOCAL backend's `.env` (`MIKROTIK_HOST="192.168.122.82"`), not the deployed one.
9. **Temporary dev admin** `testadmin@isp.local` / `testpass123` exists in the local DB (used for API tests) — delete it if no longer needed.

---

## 7. Related Docs

- [`MIKROTIK_INTEGRATION.md`](./MIKROTIK_INTEGRATION.md) — router facts, PPPoE data source, usage fields
- [`BACKEND.md`](./BACKEND.md) — API endpoints, `.env` keys, MikroTik service
- [`BACKEND_HARDENING.md`](./BACKEND_HARDENING.md) — production hardening plan
