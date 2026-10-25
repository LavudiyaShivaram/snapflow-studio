# SnapFlow Studio — Multi-Tenant Photography Business Management SaaS

SnapFlow Studio is a production-grade, multi-tenant SaaS application architected for independent wedding photographers, cinematographers, drone operators, and full-service media production houses.

---

## 🏛 Multi-Tenant Architecture & Security Model

SnapFlow Studio uses a **shared PostgreSQL database with tenant isolation enforced at the database engine level via PostgreSQL Row Level Security (RLS)**.

- **Workspace Isolation**: Every business entity (clients, events, sessions, team members, quotations, payments, expenses, deliverables, tasks) is partitioned by `tenant_id`.
- **Tenant Memberships**: Users belong to multiple photography studios through explicit records in `tenant_members` with granular roles (`owner`, `manager`, `photographer`, `videographer`, `editor`, `freelancer`).
- **Security Definer Functions**: PostgreSQL functions `public.get_user_tenant_ids()`, `public.is_tenant_member()`, and `public.has_tenant_role()` run with fixed `search_path = public, auth` to prevent search_path injection attacks.
- **Least-Privilege Authorization**:
  - **Owners**: Full studio management, team member role assignment, financial payment records, billing, deletion authority.
  - **Managers**: Event coordination, schedule dispatch, client management, quotation generation.
  - **Photographers & Videographers**: Assignment call times, event run-of-show briefs, shoot checklists. Financial tables are restricted.
  - **Editors**: Assigned post-production projects, color notes, media delivery approval.
  - **Freelancers**: Self-contained assignment view, shoot call requirements, rate confirmation.

---

## 📁 Repository Structure

```
├── supabase/
│   ├── migrations/
│   │   ├── 20261025000001_core_schema.sql         # 31 core tables, FKs, constraints, indexes & triggers
│   │   └── 20261025000002_rls_security_policies.sql # RLS policies, helper functions & storage rules
│   └── seed.sql                                   # Fictional multi-tenant demonstration data
├── tests/
│   └── security/
│       └── rls_isolation.test.ts                  # Vitest suite verifying tenant isolation & RBAC rules
├── src/
│   ├── lib/
│   │   ├── supabase.ts                            # Supabase client initializer & config validator
│   │   ├── mockData.ts                            # Offline-resilient fallback demonstration data
│   │   └── types.ts                               # Full TypeScript definitions for all 31 tables
│   ├── context/
│   │   ├── AuthContext.tsx                        # Supabase Auth provider, sessions, user profile
│   │   └── TenantContext.tsx                      # Active studio workspace switcher & tenant state
│   ├── components/
│   │   ├── layout/                                # Sidebar, Topbar contract, Workspace switcher
│   │   ├── dashboard/                             # Real-time KPIs, revenue vs expense, upcoming shoots
│   │   ├── calendar/                              # Month/week/day calendar, sessions, conflict detector
│   │   ├── clients/                               # Client directory, detail modal, notes
│   │   ├── events/                                # Event detail, multi-ceremony session builder
│   │   ├── team/                                  # Crew directory, freelancer dispatch, skill tags
│   │   ├── commercial/                            # Quotation builder, payment ledger, profit calculator
│   │   ├── production/                            # Post-production pipeline, editing stages, deliverables
│   │   ├── tasks/                                 # Pre-shoot checklists & reminder workflows
│   │   ├── reports/                               # Financial reports, booking volume & crew utilization
│   │   ├── settings/                              # Studio branding, tax rates, team member invites
│   │   └── onboarding/                            # 6-step guided studio creation wizard
│   └── App.tsx
├── .env.example
├── package.json
└── README.md
```

---

## ⚡ Setup & Supabase Configuration

### Step 1: Environment Variables
Create a `.env` file in the root directory (never commit this to Git):

```env
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_<your-key>"
# Or legacy anon key:
# VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

> **Security Note**: Never expose the Supabase `service_role` secret key in client-side code. All client operations run through Supabase Auth and PostgreSQL RLS.

### Step 2: Apply Database Migrations in Supabase
In your Supabase project's **SQL Editor**:
1. Copy and execute `supabase/migrations/20261025000001_core_schema.sql`.
2. Copy and execute `supabase/migrations/20261025000002_rls_security_policies.sql`.
3. (Optional for demo) Copy and execute `supabase/seed.sql` to populate sample studios (Royal Wedding Photography, Moments Photography Studio).

### Step 3: Run Database Security Tests
Execute the tenant isolation and authorization test suite:
```bash
npm test
```
All 10 security test scenarios must pass to confirm tenant isolation.

---

## 🛡 Verification & Completed Work vs. Manual Configuration

| Component | Status | Location / Details |
|---|---|---|
| PostgreSQL Core Schema (31 Tables) | ✅ Completed | `supabase/migrations/20261025000001_core_schema.sql` |
| Row Level Security (RLS) & Grants | ✅ Completed | `supabase/migrations/20261025000002_rls_security_policies.sql` |
| Multi-Tenant Seed Script | ✅ Completed | `supabase/seed.sql` |
| Database Security Test Suite | ✅ Completed (10/10 Passed) | `tests/security/rls_isolation.test.ts` |
| Client-Side Supabase Integration | ✅ Completed | `src/lib/supabase.ts` |
| Multi-Studio Workspace Switcher | ✅ Completed | `src/context/TenantContext.tsx` |
| Supabase Auth & Onboarding Flow | ✅ Completed | `src/components/onboarding/StudioOnboarding.tsx` |
| External Supabase Cloud Project | ⏳ Required | Connect real Supabase project via `VITE_SUPABASE_URL` |
