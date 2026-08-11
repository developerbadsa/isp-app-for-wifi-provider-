# VPS Env & CORS Setup — Real Domain Guide

> **Problem:** App kaj kore localhost e, kintu real domain e (e.g. `isp.rahimbadsa.me`) **CORS errors** ashe.
> **Karon:** Backend e allowlist set kora hoyni / `NODE_ENV` production na / frontend bhul URL diye build.
> **Fix:** Nichek er steps — 10 minute er kaj.

---

## 1. TL;DR — ki korte hobe

| # | Kaaj | Kothay |
|---|---|---|
| 1 | Backend `.env` e `CORS_ORIGINS` + `NODE_ENV=production` | VPS server e |
| 2 | Backend rebuild + PM2 restart | VPS server e |
| 3 | Frontend rebuild with real API URL | VPS server e |

> ✅ **Already applied on `isp.rahimbadsa.me` (2026-08-12)** — including the **mixed-content fix** (frontend rebuild with `https://isp-api.rahimbadsa.me/api`, now pinned in committed `frontend-webapp/.env.production`) and the **canonical-clone CI/CD fix** (workflow builds `/var/www/mern/isp-app-server`, the clone nginx actually serves). Ei doc ta reference/future VPS er jonno.

---

## 2. Architecture (kivabe CORS hoy)

```
Browser ──► http://isp.rahimbadsa.me (Nginx → frontend-webapp/dist)
                 │
                 │  fetch → http://isp-api.rahimbadsa.me/api/...
                 │  (DIFFERENT domain = CROSS-ORIGIN → CORS rules apply!)
                 ▼
          http://isp-api.rahimbadsa.me (Nginx → proxy → 127.0.0.1:5000)
                 │
                 ▼
          Backend Express (port 5000)
```

- Panel domain ≠ API domain → browser preflight (OPTIONS) pathay → backend `Access-Control-Allow-Origin` header diye allow korte hobe.
- **Allowlist e nai thakle → 403 → browser e "CORS blocked" error.**
- `localhost` e kaj kore kintu real domain e na = ei allowlist er problem.

---

## 3. Backend `.env` — required keys (production)

Backend folder: `/var/www/mern/isp-app-server/isp-app-server/.env` (subfolder — NOT repo root!)

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
MIKROTIK_HOST=192.168.122.82
MIKROTIK_PORT=8728
MIKROTIK_USERNAME=...
MIKROTIK_PASSWORD=...

# ⭐ CORS — panel er domain(s), comma-separated (http + https duitai add koro)
CORS_ORIGINS=http://isp.rahimbadsa.me,https://isp.rahimbadsa.me
```

**Rules (cors.config.ts theke):**
- `NODE_ENV=production` → sudhu `CORS_ORIGINS` allowlist + same-origin (no Origin header) allowed
- `NODE_ENV=development` → localhost/127.0.0.1/LAN auto-allowed (real domain NA!)
- Rejected origin → `403` with message "Add it to CORS_ORIGINS"

---

## 4. Exact commands (SSH e chalao)

```bash
ssh mydev   # or ssh user@vps-ip

# 1) .env edit (nano/vi)
cd /var/www/mern/isp-app-server/isp-app-server
nano .env
#   NODE_ENV=production
#   CORS_ORIGINS=http://your-domain.com,https://your-domain.com

# 2) Rebuild backend (fresh dist with cors.config)
npm install --no-audit --no-fund
npm run build          # tsc error hole: chmod +x node_modules/.bin/tsc; npx tsc -p .
ls dist/config/        # cors.config.js THAKTE hobe

# 3) PM2 restart — IMPORTANT: subfolder theke start koro (root dist e express NAI!)
cd /var/www/mern/isp-app-server/isp-app-server
pm2 delete isp-app-server
pm2 start dist/index.js --name isp-app-server
pm2 save

# 4) Frontend rebuild — real API URL diye (localhost:5000 KORO NA!)
#    NOTE: repo er committed .env.production e https URL already ache —
#    fresh clone e `npm run build` korlei https bake hoy (kono .env dorkar nai).
cd /var/www/mern/isp-app-server/frontend-webapp
npm run build
```

---

## 5. Verification (sab thik ki na)

```bash
# Backend UP
curl http://127.0.0.1:5000/api/health

# CORS PASS — panel origin theke preflight (204 + allow-origin expected)
curl -s -o /dev/null -D - -X OPTIONS http://isp-api.rahimbadsa.me/api/auth/login \
  -H "Origin: http://isp.rahimbadsa.me" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" | grep -i "allow-origin"

# CORS BLOCK — evil.com (403 expected)
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS http://isp-api.rahimbadsa.me/api/auth/login \
  -H "Origin: http://evil.com" -H "Access-Control-Request-Method: POST"

# Panel loads
curl -s -o /dev/null -w "%{http_code}\n" http://isp.rahimbadsa.me/
```

**Browser e:** `http://isp.rahimbadsa.me` → login → console e kono CORS error thakbe na.

---

## 6. Gotchas & AI hints ⭐

1. **PM2 er script path bhul = `Cannot find module 'express'`** — backend holo **subfolder** (`/var/www/mern/isp-app-server/isp-app-server/dist/index.js`), repo root na! Root e node_modules e express thake na.
2. **`.env` duita jaigay** — repo root `.env` (purano) + subfolder `.env` (real). Backend subfolder er `.env` use kore (dotenv `../.env` = subfolder).
3. **`NODE_ENV` na thakle / development = real domain block** — production set kora abong `CORS_ORIGINS` diya-i main fix.
4. **Frontend `VITE_API_URL` build time e bake hoy** — `.env` change korle **rebuild lagbe**, nginx reload e hobe na.
5. **SSL add korle:** `CORS_ORIGINS` e `https://` variant + frontend rebuild (`https://isp-api.rahimbadsa.me/api`) — `http` origin thakle browser block korbe (mixed content).
6. **Same-origin alternative (zero CORS):** nginx e `location /api { proxy_pass http://127.0.0.1:5000; }` add kore panel e `VITE_API_URL=/api` — tahole CORS-i hobe na. Dev e vite proxy eta-i kore.
7. **Login e wrong password → HTTP 500** — known bug (auth controller), CORS er sathe related na.
8. **`blocked:mixed-content` ≠ CORS:** panel **https** e load + API call **http://** → browser block kore (CORS er AGE-i). Screenshot e Network tab e `(blocked:mixed-content)` dekhte pele eta-i. Fix: frontend rebuild with `https://isp-api.rahimbadsa.me/api` (ekhon `.env.production` e committed — kono manual step nai). Browser e hard refresh (Ctrl+Shift+R) korlei purano bundle cache theke ber hoy.
9. **Duita clone = push e change ashe na:** CI/CD age `~/projects/isp-web-app-for-wifi-provider` clone e build korto, kintu nginx serve korto `/var/www/mern/isp-app-server/frontend-webapp/dist` — tai deployed bundle purano thakto ar `.env` na thakle abar bhul URL e build hoto. Fix (2026-08-12): workflow e **canonical path** `/var/www/mern/isp-app-server` point kora holo + `.env.production` commit kora holo → push → auto-deploy ekhon actually served bundle e ashe.

---

## 7. Related docs

- [`BACKEND.md`](./BACKEND.md) — section 6b: full CORS design
- `DEPLOYMENT_UBUNTU.md` — full VPS deploy (repo: isp-app-system)
- [`MIKROTIK_CONNECTIVITY_SETUP.md`](./MIKROTIK_CONNECTIVITY_SETUP.md) — router connectivity
