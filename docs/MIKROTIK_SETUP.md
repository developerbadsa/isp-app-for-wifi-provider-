# MikroTik pre-flight checklist

Before wiring the app to a live router, run these checks to gather everything the integration needs.

> **How to run these commands:** open the MikroTik **Terminal** — from WinBox (Tools → Terminal), SSH, or WebFig (terminal icon). Paste one line at a time and read the output.

---

## 1. RouterOS version

```bash
/system resource print
```

**What to look for:** the `version` field.

| Version | What it means for us |
|---|---|
| **7.x** | ✅ REST API available (`/rest/...`) — easiest to integrate |
| **6.x** | ❌ No REST API — must use the API protocol (port 8728/8729) or SSH |

Also useful:

```bash
/system identity print
```

(shows the router name, so you know you're on the right device)

---

## 2. Is the API enabled?

```bash
/ip service print
```

**What to look for:** rows for `api`, `api-ssl`, `www`, `www-ssl`:

- **`api`** — port `8728` (plaintext API protocol; works on ROS 6 & 7)
- **`api-ssl`** — port `8729` (encrypted API)
- **`www-ssl`** — port `443` (needed for **REST API** on ROS 7)
- **`www`** — port `80` (REST also works here, plaintext)

Check the `Enabled` column for each. Also check the `Address` column — if it's not empty, only those IPs can connect.

Detailed view:

```bash
/ip service print detail
```

### If the API is disabled, enable it

```bash
# API protocol (both ROS 6 & 7) — restrict to your bridge server's IP!
/ip service enable api
/ip service set api address=192.168.88.10/32

# For ROS 7 REST API — restrict to your bridge server's IP!
/ip service enable www
/ip service set www address=192.168.88.10/32
```

> ⚠️ **Security:** change `192.168.88.10` to the actual IP of the machine that will run the middle layer. **Never** leave it as `0.0.0.0/0` — that exposes your router management API to the whole network/Internet.

---

## 3. PPPoE usernames (how customers are named)

```bash
# All configured PPPoE users
/ppp secret print

# Detailed view (includes comment, profile)
/ppp secret print detail

# Currently ACTIVE sessions — shows username, caller-id (IP), uptime, and
# bytes-in / bytes-out (data usage so far this session)
/ppp active print
```

**What to look for:** the `name` column in `/ppp secret print`.

The app's mock data uses:
- `loginId`: `SKY001234`
- `clientCode`: `C001234`

Check whether your real usernames look like that, e.g. `C001234` — if yes, we can match customers automatically. If they're arbitrary (e.g. `rahim123`), we need a mapping table.

### Alternative setups

```bash
# If you use Hotspot instead of PPPoE
/ip hotspot user print

# DHCP leases — shows MAC address ↔ IP mappings
/ip dhcp-server lease print

# What the router's own interfaces/IPs are (so you know the address to connect to)
/ip address print
```

---

## 4. Where the middle layer will run

The middle layer polls the router. Decide where it will live:

| Option | Router must be reachable from | Good when… |
|---|---|---|
| **Node.js bridge on a PC/server** (recommended for ISPs) | the bridge machine, over LAN | router is on a private network |
| **Supabase Edge Function** | the public Internet (router has public IP / forwarded port) | router is publicly reachable — ⚠️ rarely a good idea to expose the API |

**Check reachability from the machine that will run the bridge:**

```bash
# From Windows (PowerShell) — is the router reachable?
ping 192.168.88.1
Test-NetConnection 192.168.88.1 -Port 8728
```

```bash
# From Linux/macOS
ping 192.168.88.1
nc -zv 192.168.88.1 8728
```

**What to look for:** ping replies + an open port on `8728` (or `8729`/`443` depending on which service you enabled).

---

## 5. Bonus: confirm logs are being generated (for the Activity Logs tab)

```bash
/log print
```

If you see PPPoE connect/disconnect or DHCP events, the router is generating the exact events we can surface as **activity logs** in the admin customer details page.

---

## Summary — what to report back

After running the commands, tell us:

1. **Version** — `7.x` or `6.x`?
2. **API enabled?** — is `api` (8728) and/or `www-ssl` (443) enabled, and from which address?
3. **Username format** — a few examples from `/ppp secret print`
4. **Router IP** — the address the bridge will connect to, and whether a PC/server on the LAN can reach it

With those four answers we can build the bridge + live usage card. 🚀
