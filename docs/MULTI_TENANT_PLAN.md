# Multi-Tenant SaaS Plan — AI-Generated Recommendation + Codebuff Review

> Two parts: **(A)** the architecture recommendation (generated via AI prompt), **(B)** a code review identifying gaps that will bite during implementation, with concrete fixes. Store in repo so a coding agent can implement from this single reference.

---

## Part A — Architecture Recommendation

### 1. Tenant Isolation — Row-Level (Recommended)

**Decision: row-level multi-tenancy with `orgId` on every tenant-scoped table, enforced via a Prisma Client Extension, backed by Postgres RLS as defense-in-depth.**

| Approach | Isolation | Ops cost @ 50-500 tenants | Migration cost | Cross-tenant analytics | Verdict |
|---|---|---|---|---|---|
| Row-level (`orgId` column) | Good (app-enforced) + RLS backstop | Low — 1 schema, 1 pool | 1 migration run | Trivial (just add WHERE) | **Use this** |
| Schema-per-tenant | Better | High — N schemas to migrate, Prisma fights `search_path` | N migration runs | Hard (cross-schema queries) | Not worth it at this scale |
| DB-per-tenant | Best | Very high — N connection pools, N backups | N migration runs | Very hard | Only for large enterprise/compliance tenants |

**Enforcement:** a `scopedPrisma(orgId)` factory using Prisma Client Extensions auto-injects `where: { orgId }` on list/count/many operations and `data: { orgId }` on create, for a defined list of tenant models. Services never touch the raw client for tenant data.

Add Postgres RLS as a second, independent layer:

```sql
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Customer"
  USING ("orgId" = current_setting('app.current_org_id')::text);
```

### 2. Per-Tenant MikroTik Config

Move MikroTik credentials from `.env` into a `MikrotikConfig` row per organization, **AES-256-GCM encrypted at rest** (key from `ENCRYPTION_KEY` env var; ciphertext + IV + auth tag stored separately). A connection cache keyed by `orgId` with idle eviction replaces the global singleton. Every MikroTik service function changes from `doThing(...)` → `doThing(orgId, ...)`.

### 3. Per-Tenant ONU dBm — Pluggable Adapter

Strategy pattern from day one: `OltAdapter` interface (`testConnection`, `getOnuOpticalPower`). Ship `MANUAL` adapter first; build Huawei/ZTE adapters only when a real tenant with that OLT brand needs one. `OnuReading.source: MANUAL | ADAPTER` flags data origin.

### 4. Auth / RBAC — Two Role Planes

- **Org roles** (`OWNER`, `ADMIN`, `STAFF`) — scoped to one tenant.
- **Platform roles** (`SUPER_ADMIN`, `SUPPORT`) — live under separate `/platform/*` routes; act on a tenant only by explicit `orgId` route param, scoped and logged.

JWT: `{ userId, orgId, orgRole, platformRole }`. Middleware chain: `requireAuth → requireOrgContext (sets orgId) → requireOrgRole → handler gets req.scopedPrisma`.

### 5. Migration Path (no data loss)

1. Add `Organization`; one default row ("Default ISP") for the existing 57 customers.
2. Add nullable `orgId` columns → backfill → `NOT NULL` + FK + index.
3. Seed default org's `MikrotikConfig` from `.env`, encrypted. Keep `.env` as fallback until verified.
4. JWT gains `orgId` (default org) + `orgRole` (existing users → `ADMIN`, one → `OWNER`).
5. Retrofit services one by one via `scopedPrisma`.
6. Verify against existing 57-customer dataset before onboarding tenant #2.

### 6. Phased Plan

- **Phase 0:** Schema + data migration (Organization, orgId backfill, MikrotikConfig, crypto helpers)
- **Phase 1:** Org-aware auth + scopedPrisma + route retrofit + RLS
- **Phase 2:** Multi-tenant MikroTik service (orgId signatures, connection pool) + tenant-facing router config UI
- **Phase 3:** Platform operator tooling (`/platform/*`, org onboarding, support access)
- **Phase 4:** OltConfig/OnuReading models + OLT adapter registry (MANUAL ships; real adapters deferred)
- **Phase 5:** Org self-service (OWNER invites STAFF/ADMIN), orgRole enforcement on writes
- **Phase 6:** Real OLT adapters + SaaS subscription/metering for tenants

*(Full Prisma schema sketch lives in the original generation — Customer/Package/Invoice/Ticket get `orgId`; MikrotikConfig stores encrypted creds; OnuReading carries source + recordedAt.)*

---

## Part B — Review: Gaps & Additions (Codebuff)

The recommendation is sound. These gaps are the ones that actually bite during implementation:

### 🔴 CRITICAL — fix before/while building

**1. RLS + Prisma connection pool conflict.**
`current_setting('app.current_org_id')` is per-connection. Prisma pools connections, so a `SET` from middleware does **not** apply to the pooled query's connection. RLS will randomly deny/allow. Correct pattern — every tenant transaction must set the var on the same connection:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.current_org_id', ${orgId}, true)`; // is_local = true
  // ... all tenant queries inside this tx
});
```

Make the `scopedPrisma(orgId)` extension wrap every operation in such a transaction (or document that RLS is backstop-only and the extension is the enforcement). Don't ship RLS "partially wired" — it fails nondeterministically.

**2. `findUnique` / `update` / `delete` by id cannot be auto-scoped.**
The extension's `$allOperations` hook can't add `orgId` to a unique `where: { id }`. Options:
- Add compound unique `@@unique([orgId, id])` on tenant models → `findUnique({ where: { orgId_id: { orgId, id } } })`.
- Or standardize: all by-id lookups go through a scoped helper `findScoped(id)` = `findFirst({ where: { id, orgId } })` and routes reject 404 when not found.

Pick ONE and enforce it in code review — this is the classic cross-tenant leak.

**3. `phone` uniqueness must become per-org.**
Current schema has `phone String @unique` **globally** — two ISPs can't both have `01712345678`. Change to `@@unique([orgId, phone])`. (The sketch dropped the unique entirely — don't lose it.) Same reasoning for `pppoeUsername`: sketch has `@@unique([orgId, pppoeUsername])` ✅ — do the same for phone.

**4. User email strategy — make it a decision.**
Sketch keeps `email @unique` globally. That means `admin@isp.com` can exist only once across ALL tenants. For v1 (login simplicity) this is fine and recommended — but state it, and note that a user working in multiple orgs will later need an `OrganizationMember` join table (the sketch's `User.orgId` supports exactly one org per user). v1 decision: **one org per user, global-unique email.**

**5. The invoice cron job is global and must be org-scoped.**
`startInvoiceGenerationJob()` (index.ts) runs without org context. Multi-tenant it must iterate all active orgs and generate invoices per org (using each org's scopedPrisma + billing cycle). Not in the retrofit list — add to Phase 1.

**6. `pppoePassword` is a credential — encrypt it too.**
The sketch notes it but leaves it plain. Same AES-256-GCM helper as MikroTik creds (decrypt only when provisioning/toggling on the router). Add to Phase 0 alongside MikrotikConfig encryption — do it in the same migration while the schema is already changing.

### 🟠 IMPORTANT — add to the plan

**7. Audit log for platform/support actions.** The plan says platform actions are "scoped and logged" but has no model. Add minimal `AuditLog { id, actorUserId, orgId, action, entityType, entityId, timestamp }` — write on every `/platform/*` action and on sensitive tenant writes (suspend, delete, config change). Cheap insurance for a SaaS you're renting out.

**8. Tenant offboarding.** Export + purge an org's data when a tenant leaves (and handle "SUSPENDED" org status → block login but keep data). Add a Phase 3/5 item.

**9. Money as cents migration.** Sketch uses `priceCents`/`amountCents` (correct — Float money is a bug farm). Current schema uses `Float`. Either (a) migrate existing rows ×100 to cents carefully, or (b) keep Float for existing models in v1 and use cents only for NEW models. Pick one and note it — don't mix.

**10. Per-tenant quota limits.** Before selling: enforce org limits (max customers / packages) in create routes. Add to Phase 5.

**11. Provisioning/verification scripts need orgId.** `provision-customers.ts` / `verify-provisioning.ts` are org-agnostic — retrofit to take `--orgId` so ops can provision per tenant.

### 🟢 DEFERRED — fine to skip v1

**12. Currency/timezone per org** — all BD tenants now; add later.
**13. MikroTik TLS option per org** (`api-ssl` 8729) + router-side `address=` allowlist note — add when a tenant runs the router on a different network.
**14. OnuReading latest-value cache** on Customer (avoid a join for the details dialog) — optimize only if slow.
**15. Per-tenant backups** — whole-DB backup is fine at this scale; per-tenant restore tooling later.

---

## Revised Phase Checklist (Part A + Part B merged)

- **Phase 0:** Organization + orgId backfill + **phone/username compound uniques** + MikrotikConfig + **pppoePassword encryption** + crypto helpers + **cents decision**
- **Phase 1:** Org-aware auth + **scopedPrisma incl. by-id strategy (compound unique or findScoped helper)** + route retrofit + **org-scoped invoice cron** + **RLS wired via per-transaction `set_config`**
- **Phase 2:** Multi-tenant MikroTik service (orgId, connection pool, idle eviction) + tenant router config UI
- **Phase 3:** Platform tooling + **AuditLog** + **offboarding/export**
- **Phase 4:** OltConfig/OnuReading + adapter registry (MANUAL first)
- **Phase 5:** Org self-service + orgRole enforcement + **quota limits** + **scripts orgId**
- **Phase 6:** Real OLT adapters + SaaS metering/billing
