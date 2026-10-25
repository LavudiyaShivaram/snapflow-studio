# SnapFlow Studio — Multi-Tenant Photography Business Management SaaS

SnapFlow Studio is a production-grade, multi-tenant SaaS application architected for independent wedding photographers, cinematographers, drone operators, and full-service media production houses.

---

## 🏛 Multi-Tenant Architecture & Security Model

SnapFlow Studio uses a **shared PostgreSQL database with tenant isolation enforced at the database engine level via PostgreSQL Row Level Security (RLS)**.

- **Workspace Isolation**: Every business entity (clients, events, sessions, team members, quotations, payments, expenses, deliverables, tasks) is partitioned by `tenant_id`.
- **Primary Key Suffix Convention**: Every database table features a primary key suffixed with the table name (e.g. `tenant_id`, `client_id`, `event_id`, `tenant_member_id`, `quotation_id`, `payment_id`).
- **Complete Audit Trail & Soft Delete**: Every table includes `inserted_by`, `inserted_date`, `updated_by`, `updated_date`, `deleted_by`, and `deleted_date`. Hard deletes are strictly blocked via PostgreSQL triggers (`prevent_hard_delete()`).
- **Tenant Memberships**: Users belong to photography studios through explicit records in `tenant_members` with granular roles (`owner`, `manager`, `photographer`, `videographer`, `editor`, `freelancer`).
- **Atomic Tenant Onboarding**: The `public.register_studio_workspace(...)` stored procedure handles workspace creation, owner assignment, settings provisioning, and optional team invitations inside an atomic database transaction.
- **Indian Standard Defaults**: Default currency is Indian Rupee (`INR` / `₹`) and default timezone is Indian Standard Time (`Asia/Kolkata` / IST, UTC+05:30).

---

## 📁 Repository Structure

```
├── supabase/
│   ├── migrations/
│   │   ├── 20261025000001_core_schema.sql             # 31 core tables, FKs, suffixed PKs, audit triggers
│   │   ├── 20261025000002_rls_security_policies.sql     # RLS policies, helper functions & soft-delete triggers
│   │   └── 20261025000003_secure_tenant_onboarding.sql # Atomic tenant registration RPC & workspace helpers
│   └── seed.sql                                       # Fictional multi-tenant demonstration data
├── tests/
│   ├── auth/
│   │   ├── auth_flows.test.ts                         # Supabase Auth restoration & persona tests
│   │   └── registration_onboarding.test.ts            # Registration validation, atomic RPC & isolation tests
│   └── security/
│       └── rls_isolation.test.ts                      # Tenant isolation, soft-delete & RBAC test suite
├── src/
│   ├── lib/
│   │   ├── supabase.ts                                # Supabase client initializer & config validator
│   │   ├── mockData.ts                                # Offline-resilient fallback demonstration data
│   │   └── types.ts                                   # Full TypeScript definitions for all 31 tables
│   ├── context/
│   │   ├── AuthContext.tsx                            # Supabase Auth provider, sessions & email verification
│   │   └── TenantContext.tsx                          # Active studio workspace switcher & tenant state
│   ├── components/
│   │   ├── auth/
│   │   │   ├── RegisterPage.tsx                       # Premium public registration & email verification screen
│   │   │   └── LoginForm.tsx                          # Studio credential sign-in form
│   │   ├── onboarding/
│   │   │   └── StudioOnboardingWizard.tsx             # 4-step studio setup wizard with draft preservation
│   │   ├── tenant/
│   │   │   └── WorkspaceSelectionModal.tsx            # Multi-workspace switcher & studio selector
│   │   ├── layout/                                    # 3-Zone Header, Sidebar, Supabase config modal
│   │   ├── dashboard/                                 # Real-time KPIs, revenue vs expense, upcoming shoots
│   │   ├── calendar/                                  # Shoots calendar, call times, conflict detector
│   │   ├── clients/                                   # Client directory & contract notes
│   │   ├── events/                                    # Multi-ceremony session builder & run-of-show
│   │   ├── team/                                      # Crew directory, skill tags & dispatch
│   │   ├── commercial/                                # Quotation builder, payment ledger & profit calculator
│   │   ├── production/                                # Post-production pipeline & editing stages
│   │   ├── tasks/                                     # Shoot checklists & equipment reminders
│   │   ├── reports/                                   # Financial reports, booking volume & crew utilization
│   │   ├── settings/                                  # Studio branding, tax rates & member invites
│   │   └── public/
│   │       └── LandingPage.tsx                        # Public landing page with CTA & tier showcase
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

### Step 2: Apply Database Migrations in Supabase
In your Supabase project's **SQL Editor**:
1. Execute `supabase/migrations/20261025000001_core_schema.sql`.
2. Execute `supabase/migrations/20261025000002_rls_security_policies.sql`.
3. Execute `supabase/migrations/20261025000003_secure_tenant_onboarding.sql`.
4. (Optional for demonstration) Execute `supabase/seed.sql` to populate sample studios (Royal Wedding Photography, Moments Photography Studio).

### Step 3: Run Unit & Security Tests
Execute the comprehensive test suites:
```bash
npm test
```
All tests verify tenant isolation, soft-delete triggers, email verification states, and atomic studio onboarding.
