# ISP Management App — Product Goals & Roadmap

> **Vision:** Ekta simple, powerful ISP management app — customer, billing, ar MikroTik control — jekhane ekjon ISP operator 10 minute e shob manage korte pare. Later: same app **SaaS** hisebe bivinno ISP ke dewa.

---

## 1. Current State (what's already built & working)

| Area | Status | Details |
|---|---|---|
| Admin panel (web) | ✅ Working | Dashboard (KPIs), Customers (search/filter/paginate), Customer details (profile, invoices, tickets, **live usage**, **ONU dBm**), Settings (MikroTik integration) |
| Backend API | ✅ Working | Express + Prisma + PostgreSQL. JWT auth, customer CRUD + **auto MikroTik provisioning**, packages, invoices, tickets |
| MikroTik integration | ✅ Working | Live connection (ROS 7.21.5), PPPoE secrets, active sessions, **live usage (bytes + speed + speed-limit)**, suspend/resume |
| ONU optical power (dBm) | ✅ Working | Manual entry + color-coded badge (Good/Acceptable/Weak/Problematic) |
| Provisioning tooling | ✅ Working | 50-customer script (DB-first, idempotent) + read-only verification script |
| Mobile app (Expo) | 🔶 Partial | Customer screens exist with demo data; **not yet connected to real backend** |

**Testing lesson learned (apnar):** MikroTik control + package connection ekhono basic level e — **age core solid koro, tarpor complex features**. This roadmap follows exactly that.

---

## 2. Guiding Principles

1. **Basics first, always.** A feature that 100% works on the basics beats a half-working advanced feature.
2. **Real data over demo data.** Every number shown must come from a real source (DB, MikroTik, or manual entry) — never fabricated.
3. **One ISP perfectly first.** Nail Goal 1–3 for a single ISP before any SaaS/multi-tenant work.
4. **Fail gracefully.** Router offline → clean message, not a crash (already the pattern).
5. **Don't build what nobody asked for.** Every feature needs a "why" from a real operator.

---

## 3. GOAL 1 — Solid Core (Single-ISP MVP) 🎯 *mostly DONE, finish it*

**Objective:** Ekjon ISP er daily operation ektu-i tool diye chole. No spreadsheets.

**Main features:**
- [x] Customer management (add, edit, search, suspend, delete)
- [x] Package management (5M–100M tiers, price, validity)
- [x] MikroTik connection + PPPoE provisioning (auto-create secret on add)
- [x] Suspend/resume → router toggle
- [x] Customer details (profile + usage + ONU dBm)
- [ ] **Invoices: monthly auto-generation** (cron exists — verify it works end-to-end)
- [ ] **Payments: record bKash/Nagad/cash** (manual entry)
- [ ] **Overdue detection + auto-suspend flow** (grace period → suspend)
- [ ] **Basic reports: monthly revenue, collection, per-package counts**

**Done when:** Ekta ISP ek complete month chalaite pare ei tool e — invoice → payment → overdue → suspend → resume, sob real data.

> ⚠️ Billing accuracy = the #1 thing that makes ISPs trust (or distrust) software. This goal deserves the most attention.

---

## 4. GOAL 2 — Live Network & Usage Intelligence 📊

**Objective:** Admin janbe — kon customer online, koto speed niteche, kono problem ache ki na.

**Main features:**
- [ ] **Usage everywhere** — customers list e online/offline dot + speed (not just details page)
- [ ] **Usage history** — poll MikroTik every 5–15 min → store snapshots → daily/monthly usage chart per customer (billing-grade data — router itself doesn't keep history)
- [ ] **Network monitor page** — active sessions table, per-zone traffic, router health (CPU/mem/uptime)
- [ ] **Alerts** — customer online→offline change, router unreachable, usage spikes
- [ ] **Speed test** — per-customer (interface monitor-traffic) quick check from admin
- [ ] **ONU dBm auto-fill path** — OLT integration design starts here (Huawei/ZTE adapter first, if any customer has an OLT)
  > 📄 **Smart design ready:** [`ONU_DBM_SMART_SOLUTION.md`](./ONU_DBM_SMART_SOLUTION.md) — OLT/TR-069/manual 3 source, pluggable adapter, customer↔ONU mapping, auto-alert flow

**Done when:** Admin dashboard e "ek nojore" dekhte pare: koto customer online, koto speed, kon zone e problem, kokhon theke offline.

> This is where MikroTik knowledge compounds — the live-usage foundation (already built) makes this cheap to add.

---

## 5. GOAL 3 — Customer Self-Service & Payments 💳

**Objective:** Customer nije dekhbe + pay korbe — admin er kaj kombe.

**Main features:**
- [ ] **Customer mobile app (Expo) connected to real backend** — login, own usage (speed + data), invoice list, pay bill
- [ ] **Payments: bKash/Nagad integration** (merchant API — or manual reference-number confirmation first)
- [ ] **SMS reminders** (due date, overdue, payment confirmation) — BD SMS gateway (e.g. BulkSMSBD, GreenWeb)
- [ ] **Invoice PDF download** (per customer)
- [ ] **Customer support tickets** — customer raises from app, admin replies

**Done when:** Ekta customer bill pay korte pare app theke (or SMS diye confirm), ar own usage dekhte pare — admin er phone call kombe.

> 💡 Payment gateway (bKash merchant) is the hardest external dependency here — start with **manual reference confirmation** (customer sends bKash ref number, admin confirms) — same trust, zero integration risk.

---

## 6. GOAL 4 — SaaS & Advanced 🚀 *(only after Goal 1–3 solid)*

**Objective:** Ek-i app, bivinno ISP — prottek er nijer router, nijer data, nijer admin.

**Main features:**
- [ ] **Multi-tenant (Organization model)** — tenant_id on tables, per-tenant MikroTik config (encrypted), JWT tenant context, data isolation
- [ ] **Per-tenant OLT integration** — pluggable adapters (Huawei / ZTE / manual) for auto dBm + faults
- [ ] **Manager/Partner portal** — sub-admin with own customers + commission tracking (Net Manager pattern)
- [ ] **RADIUS accounting** — true billing-grade usage totals (FreeRADIUS)
- [ ] **Bulk tools** — CSV import/export customers, bulk suspend
- [ ] **Alerts center** — SMS/email notifications for network + billing events

**Done when:** Duita alada ISP alada router/config diye same app e cholche, data fully isolated.

> ⚠️ **Do NOT start this before Goal 1–3.** Multi-tenant changes every table and every query — premature SaaS = premature complexity (apnar testing lesson).
>
> 📄 **Full technical design ready:** [`MULTI_TENANT_PLAN.md`](./MULTI_TENANT_PLAN.md) — row-level tenancy + scopedPrisma + RLS, encrypted per-tenant MikroTik config, OLT adapter pattern, phased migration, ar code review theke add kora 15 ta gap fix.

---

## 7. Competitive Feature Checklist (research — Net Manager, PowerNET, BD Net, SmartBilling)

| Feature | Competitors have | Our plan |
|---|---|---|
| Customer registry + packages | ✅ | ✅ Goal 1 |
| Auto monthly invoices | ✅ | ✅ Goal 1 |
| bKash/Nagad payments | ✅ | ✅ Goal 3 |
| MikroTik integration | ✅ | ✅ Done |
| Live network monitoring (Mbps/uptime) | ✅ | ✅ Goal 2 |
| Usage history per customer | ✅ | ✅ Goal 2 |
| SMS reminders | ✅ | ✅ Goal 3 |
| OLT management + dBm | ✅ | ✅ Goal 2/4 (adapter) |
| RADIUS auth | ✅ | 🔶 Goal 4 |
| Reports + CSV export | ✅ | ✅ Goal 1 (basic) / Goal 4 (advanced) |
| Manager/partner portal | ✅ | ✅ Goal 4 |
| Network topology map | ✅ | 🔶 Future (only if operators ask) |
| Customer self-service app | ⚠️ rare | ✅ Goal 3 (our differentiator!) |

**Our edge:** Customer mobile app + live MikroTik usage — most BD ISP tools are admin-only, web-only. We can win on **customer self-service + live visibility**.

---

## 8. Anti-Goals (deliberately NOT building early)

- ❌ Multi-tenant / SaaS — before Goal 1–3 done
- ❌ RADIUS server setup — before usage polling proves insufficient
- ❌ Network topology drag-drop maps — nobody has asked
- ❌ Mobile native apps (iOS/Android store) — Expo web+app covers it
- ❌ AI features / auto-chatbots — not the core problem
- ❌ Complex role hierarchies — admin/staff is enough until Goal 4

---

## 9. Phased Summary

| Phase | Focus | Key deliverables | Rough size |
|---|---|---|---|
| **Goal 1** | Core billing + customers + MikroTik basics | Auto invoices, payments, overdue→suspend, basic reports | Finish existing — 2–4 weeks |
| **Goal 2** | Live network intelligence | Usage history storage, network monitor, alerts, speed | 3–5 weeks |
| **Goal 3** | Customer self-service | App connected, bKash manual flow, SMS, invoice PDF | 4–6 weeks |
| **Goal 4** | SaaS + advanced | Multi-tenant, OLT adapters, partner portal | 6–10 weeks (after 1–3) |

---

## 10. Immediate Next Steps (this week)

1. Finish Goal 1 billing loop: verify invoice cron → add manual payment entry → overdue auto-suspend
2. Decide: **50-customer provisioning** run (router ready) — real customers on the router
3. Pick 1 real ISP user as a test pilot for Goal 1 (aaj-ke-aj ekta operator er "daily work" checklist)
