# Local vs VPS — How the App Runs (Comparison & Plan)

> **Q:** Local e `npm run dev` dile backend + frontend **aksathe** chole — VPS e keno amon na?
> **A:** Local e DEV mode (nodemon + vite). VPS e PRODUCTION mode (build + PM2 + nginx). Duita alada pattern — nichek e clear.

---

## 1. TL;DR

| | Local (dev) | VPS (production) |
|---|---|---|
| Backend | `nodemon` (ts-node, hot reload) | `PM2` → compiled `dist/index.js` |
| Frontend | `vite dev` (source, hot reload) | built static files → **nginx** |
| Ports | backend :5000, frontend :8080 | backend :5000, nginx :80 (via Cloudflare :443) |
| API call | same-origin `/api` → **vite proxy** → :5000 | `https://isp-api.rahimbadsa.me/api` → nginx → :5000 |
| CORS | zero (same-origin) | cross-origin (allowlist theke) |
| One command? | ✅ `npm run dev` | ❌ alada steps (build + PM2 + nginx) |

---

## 2. Local — `npm run dev` (monorepo root)

```
npm run dev  (concurrently)
   ├── npm run dev --prefix isp-app-server   → nodemon → ts-node src/index.ts → :5000
   └── npm run dev --prefix frontend-webapp  → vite → :8080
                                                    │
        Browser ──► http://localhost:8080 ──► /api (same-origin)
                                                    │
                                              vite proxy → http://localhost:5000/api
                                                    │
                                              backend (nodemon)
```

- `VITE_API_URL=/api` → browser theke same-origin call → **vite proxy** → backend
- Kono CORS nei, kono build nei — dev er jonno perfect

---

## 3. VPS (current production) — kivabe cholche

```
Browser ──► https://isp.rahimbadsa.me (Cloudflare SSL)
                │
           nginx (port 80)
                │  serves frontend-webapp/dist (built static files)
                │
           browser: fetch https://isp-api.rahimbadsa.me/api/...
                │
           Cloudflare ──► nginx (isp-api site) ──proxy──► 127.0.0.1:5000
                                                             │
                                                   PM2: dist/index.js (backend)
```

- Backend: `pm2 start dist/index.js` (compiled — no nodemon)
- Frontend: `npm run build` er output, nginx serve kore
- API: alada subdomain diye (cross-origin → CORS apply)

---

## 4. Mapping table (local ↔ VPS)

| Concept | Local | VPS |
|---|---|---|
| Backend process | nodemon | PM2 |
| Backend entry | `src/index.ts` (ts-node) | `dist/index.js` (compiled) |
| Frontend serving | vite dev server | nginx (static dist) |
| Frontend API base | `/api` (vite proxy) | `https://isp-api.rahimbadsa.me/api` |
| Env file | `isp-app-server/.env` | same path on server |
| Code update | save → auto reload | `git pull` + `npm run build` + `pm2 restart` |

---

## 5. Why VPS e `npm run dev` cholbe na (production e)

| Problem | Detail |
|---|---|
| **nodemon = dev tool** | crash hole auto-restart thake na production-grade; slow (ts-node), memory leak risk |
| **vite dev server** | source serve kore — not optimized (no minification); memory heavy |
| **Ports** | dev :8080 serve korle nginx er sathe conflict — nginx ekhon :80 e dist serve kore |
| **Security/perf** | build (minified) + nginx gzip/cache = production standard |

> ⚠️ `npm run dev` VPS e **testing** er jonno cholbe (PM2 diye), kintu **real domain er production** na.

---

## 6. Options — VPS e kivabe kaj korben (PLAN — code hatano hoyni)

### Option A: Current production setup (RECOMMENDED) ⭐
```
PM2 (backend dist) + nginx (frontend dist + API proxy) + Cloudflare SSL
```
- ✅ Production-grade, already working (CORS + mixed-content fixed)
- ✅ One deploy script: git pull → npm install → build → pm2 restart
- ❌ `npm run dev` er moto 1 command na — deploy steps lagbe
- **Plan:** ekta `deploy.sh` banaile 1 command e hobe (`./deploy.sh`)

### Option B: VPS e dev-style (PM2 diye `npm run dev`)
```
pm2 start "npm run dev" --name isp-dev
```
- ✅ Local er moto same experience (nodemon + vite, hot reload)
- ✅ Vite proxy → CORS zero
- ❌ Sudhu **testing/dev** er jonno; real domain nginx er sathe conflict (dev server :8080, nginx :80 dist serve kore — duita mile na ek sathe)
- ❌ Production-quality na (no build/minify)
- **Use case:** VPS e quick test korar jonno (`ssh` → `pm2 start npm run dev`) — real domain e na

### Option C: Hybrid (recommended long-term)
```
Production: Option A (PM2 + nginx + build)
Development: Option B (PM2 diye npm run dev) — dev.isp.rahimbadsa.me subdomain e
```
- ✅ Prod stable, dev comfortable — best of both
- ❌ 2 setup maintain korte hobe (production folder + dev folder/port)

---

## 7. Recommendation

> **Ekhon: Option A e-i thakun** (already fixed + working). `npm run dev` er moto 1-command experience dorkar hole ekta **`deploy.sh`** banao (git pull → install → build → pm2 restart → test) — VPS e 1 command e full deploy.
>
> **Jodi VPS e quick testing chaien:** PM2 diye `npm run dev` chalaite parben (port alada, e.g. :8080) — kintu real domain na, sudhu test.

---

## 8. Next steps (bolun ki korbo)

- [ ] `deploy.sh` banao (1-command VPS deploy) — code change chhara deploy experience fix
- [ ] VPS e dev environment setup (Option B) — PM2 diye npm run dev, test er jonno
- [ ] `dev.isp.rahimbadsa.me` subdomain (Option C) — nginx port alada
- [ ] `~/isp-web-app` clone er kotha — oita use korben naki `/var/www/...` e-i thakbe

> 📌 **Code e kono hat dewa hoyni** — ei doc sudhu plan. Decide korle ekhanei implement korbo.
