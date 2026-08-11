# Migration & Logging Plan — Future-Proof the Deploy

> **Goal:** Apps ta onno server e migrate korle **jhamela na hok** ar **logs local dev er moto** dekha jak.
> **Status:** PLAN only — code e kono hat dewa hoyni.

---

## 1. Problem

| Issue | Karon |
|---|---|
| Migration jhamela | VPS setup hoyeche **hat diye** (PM2 command, nginx, .env alada alada) — new server e abar sob manually repeat korte hobe |
| Logs dekha jay na | PM2 log file e jay (out/error log), kintu kono rotation nai — log file **unlimited barbe**; local dev er moto "live console" feel nai |
| Env reproduce kora | `.env` kothay ki — repo root / subfolder / ~/isp-web-app — 3 jaigay confuse |

---

## 2. Part A — Migration Plan (jhamela chara onno server e)

### A1. `ecosystem.config.js` — PM2 config codify koro (THE key) ⭐

Ekhon: `pm2 start dist/index.js --name isp-app-server` — hat diye.
Plan: repo e `ecosystem.config.js` file:

```js
module.exports = {
  apps: [{
    name: 'isp-app-server',
    cwd: './isp-app-server',
    script: './dist/index.js',
    env: { NODE_ENV: 'production' },
    // env_file: './isp-app-server/.env',   // PM2 v6+ — .env auto-load
    max_memory_restart: '300M',
    time: true,                    // log line e timestamp
    error_file: '~/logs/isp/err.log',
    out_file: '~/logs/isp/out.log',
  }],
};
```

**Migration e:** new server e `git clone` → `npm install` → `pm2 start ecosystem.config.js` → done. Kono command memorize kora lagbe na.

### A2. `deploy.sh` — 1-command deploy

```bash
#!/usr/bin/env bash
# ./deploy.sh  → git pull + install + build + restart + health check
set -e
git pull origin main
npm install --prefix isp-app-server
npm run build --prefix isp-app-server
npm run build --prefix frontend-webapp
pm2 restart isp-app-server --update-env
sleep 3
curl -fsS http://127.0.0.1:5000/api/health && echo "✅ DEPLOY OK"
```

### A3. nginx config templates (repo e save)

`deploy/nginx/isp-frontend.conf` + `deploy/nginx/isp-api.conf` — copy korlei new server e kaj. (Ekhon hat diye likha — template thakle copy-paste.)

### A4. Migration checklist (new server e)

| # | Step | Note |
|---|---|---|
| 1 | Node 20 + PM2 + nginx install | `deploy-ubuntu.sh` already ache |
| 2 | `git clone` repo | ekhon `~/isp-web-app` + `/var/www/...` duita clone confuse — **ekta clone fixed** korte hobe |
| 3 | `.env` create | `.env.example` theke copy (single source of truth) |
| 4 | PostgreSQL | DB URL change korlei hobe — data migrate (`pg_dump`/`pg_restore` or same managed DB) |
| 5 | `npm install` + `npm run build` | backend + frontend |
| 6 | `pm2 start ecosystem.config.js` | ✅ ekhon codified |
| 7 | nginx config copy + reload | templates theke |
| 8 | **MikroTik allowlist** ⚠️ | Router API service e `address` list e **new server IP add korte hobe** — na hole connection block! (`/ip service set api address=...`) |
| 9 | Cloudflare DNS | `isp.rahimbadsa.me` + `isp-api.rahimbadsa.me` → new server IP |
| 10 | Verify | `/api/health` + login + MikroTik status |

### A5. Ekta clone — jhamela root

Ekhon server e 2 jaigay repo ache (`/var/www/mern/isp-app-server` + `~/isp-web-app`) — migration e confuse korbe.
**Plan:** ekta **canonical path** fix koro (e.g. `/var/www/isp/isp-app-system`) — deploy script + ecosystem config sei path e point korbe. Baki ta delete/backup.

---

## 3. Part B — Logging Plan (local dev er moto)

### B1. Ekhon ki ache
- Backend e `requestLogger` middleware — prottek API call log hoy (console → PM2 out.log)
- PM2: `~/.pm2/logs/isp-app-server-out.log` + `-error.log`
- Live dekha: `pm2 logs isp-app-server` (tail -f er moto — **already local dev er moto**)

### B2. Missing + plan

| Gap | Fix |
|---|---|
| **Log rotation nai** — file unlimited barbe | `pm2 install pm2-logrotate` → daily rotation + 14-day retention (MB limit) |
| **Timestamp nai log e** | `ecosystem.config.js` e `time: true` → every line e timestamp |
| **Error log separate** | PM2 already `out`/`err` alada — ✅ |
| **Logs ek jaigay** | `~/logs/isp/` folder — `pm2 logs` + file duita-i accessible |
| **MikroTik call logs** | `mikrotik.service.ts` e already error log hoy — plan: debug level optional (env `LOG_LEVEL`) |

### B3. Daily use (production e)

```bash
pm2 logs isp-app-server          # live — nodemon er moto ✅
pm2 logs isp-app-server --lines 100   # last 100 lines
pm2 restart isp-app-server       # after deploy
tail -f ~/logs/isp/err.log       # direct file dekha (optional)
```

> **Result:** `ssh` → `pm2 logs` = local dev e nodemon console dekhwar moto. ✅

---

## 4. Implementation steps (kono code change chara ekhon korar moto jinis)

| # | Kaaj | Type |
|---|---|---|
| 1 | `ecosystem.config.js` repo root e create | 🔧 new file (config, code na) |
| 2 | `deploy.sh` create + executable | 🔧 new file |
| 3 | `deploy/nginx/` templates create | 🔧 new files |
| 4 | `pm2 install pm2-logrotate` + config (VPS e) | ⚙️ server setup |
| 5 | PM2 e `time: true` + log paths set | ⚙️ `pm2 restart --update-env` |
| 6 | Ekhon-er 2 clone path consolidate | ⚙️ decide canonical path |

> 📌 Backend code e kono change dorkar nai ei plan e — sudhu config + scripts + server setup.

---

## 5. Questions for you (decide korle implement korbo)

1. **Canonical path** ki hobe — `/var/www/isp/isp-app-system` naki current `/var/www/mern/isp-app-server`?
2. `deploy.sh` + `ecosystem.config.js` banaite chaiben? (repo e, commit + push kore debo)
3. pm2-logrotate ekhon-i VPS e install korbo?
4. Log retention koto din (default: 14 din / 50MB per file)?

---
**Related:** [`VPS_ENV_CORS_SETUP.md`](./VPS_ENV_CORS_SETUP.md) · [`LOCAL_VS_VPS_DEPLOYMENT.md`](./LOCAL_VS_VPS_DEPLOYMENT.md) · `DEPLOYMENT_UBUNTU.md`
