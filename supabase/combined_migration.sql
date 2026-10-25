-- SNAPFLOW STUDIO: DATABASE MIGRATION 01
-- CORE SCHEMA: Multi-Tenant Architecture, Primary Keys Suffixes with Table Name,
-- Audit Columns (inserted_by, inserted_date, updated_by, updated_date, deleted_by, deleted_date) & Soft Delete

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Common updated_date timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- 1. PROFILES (auth.users extension)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    profile_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    inserted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE TRIGGER update_profiles_updated_date
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 2. TENANTS (Photography Studios / Workspaces)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    business_type TEXT NOT NULL DEFAULT 'wedding_portrait', -- wedding_portrait, commercial, event_media, boutique
    logo_url TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    country TEXT NOT NULL DEFAULT 'India',
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE TRIGGER update_tenants_updated_date
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 3. TENANT_MEMBERS (Studio Membership & RBAC)
--------------------------------------------------------------------------------
CREATE TYPE tenant_role_type AS ENUM (
    'owner',
    'manager',
    'photographer',
    'videographer',
    'editor',
    'freelancer'
);

CREATE TABLE IF NOT EXISTS tenant_members (
    tenant_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    role tenant_role_type NOT NULL DEFAULT 'photographer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    title TEXT,
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    day_rate NUMERIC(10, 2) DEFAULT 0.00,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_active ON tenant_members(tenant_id, deleted_date);

CREATE TRIGGER update_tenant_members_updated_date
    BEFORE UPDATE ON tenant_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 4. TENANT_INVITATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_invitations (
    tenant_invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role tenant_role_type NOT NULL DEFAULT 'photographer',
    invited_by UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE RESTRICT,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE INDEX idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(token);

--------------------------------------------------------------------------------
-- 5. TENANT_SETTINGS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    booking_lead_buffer_days INT NOT NULL DEFAULT 2,
    default_deposit_percentage NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    tax_label TEXT NOT NULL DEFAULT 'GST',
    invoice_footer_note TEXT DEFAULT 'Thank you for choosing us to capture your timeless moments.',
    brand_primary_color TEXT DEFAULT '#d97706',
    brand_dark_theme BOOLEAN NOT NULL DEFAULT TRUE,
    require_drone_permit_ack BOOLEAN NOT NULL DEFAULT TRUE,
    enable_client_portal BOOLEAN NOT NULL DEFAULT TRUE,
    auto_remind_days_before_shoot INT NOT NULL DEFAULT 3,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE TRIGGER update_tenant_settings_updated_date
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 6. SUBSCRIPTION_PLANS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    subscription_plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly NUMERIC(10, 2) NOT NULL,
    price_yearly NUMERIC(10, 2) NOT NULL,
    max_active_events INT NOT NULL DEFAULT 20,
    max_team_members INT NOT NULL DEFAULT 5,
    storage_limit_gb INT NOT NULL DEFAULT 50,
    has_client_galleries BOOLEAN NOT NULL DEFAULT TRUE,
    has_freelancer_dispatch BOOLEAN NOT NULL DEFAULT TRUE,
    has_custom_branding BOOLEAN NOT NULL DEFAULT TRUE,
    inserted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

--------------------------------------------------------------------------------
-- 7. TENANT_SUBSCRIPTIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    tenant_subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(subscription_plan_id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
    billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    billing_provider TEXT DEFAULT 'manual',
    billing_customer_id TEXT,
    billing_subscription_id TEXT,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE TRIGGER update_tenant_subscriptions_updated_date
    BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 8. AUDIT_LOGS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, inserted_date DESC);

--------------------------------------------------------------------------------
-- 9. CLIENTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    partner_first_name TEXT,
    partner_last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    alternate_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    source TEXT DEFAULT 'Referral',
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    UNIQUE (client_id, tenant_id)
);

CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_email ON clients(tenant_id, email);
CREATE INDEX idx_clients_soft_delete ON clients(tenant_id, deleted_date);

CREATE TRIGGER update_clients_updated_date
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 10. EVENTS (Main Bookings)
--------------------------------------------------------------------------------
CREATE TYPE event_type_enum AS ENUM (
    'wedding',
    'reception',
    'engagement',
    'pre_wedding',
    'haldi_mehendi',
    'birthday',
    'corporate',
    'portrait_commercial',
    'custom'
);

CREATE TYPE event_status_enum AS ENUM (
    'inquiry',
    'quoted',
    'confirmed',
    'in_progress',
    'completed',
    'archived',
    'canceled'
);

CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    title TEXT NOT NULL,
    event_type event_type_enum NOT NULL DEFAULT 'wedding',
    status event_status_enum NOT NULL DEFAULT 'confirmed',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    primary_venue_name TEXT,
    primary_venue_address TEXT,
    primary_venue_city TEXT,
    estimated_guest_count INT,
    total_package_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(12, 2) GENERATED ALWAYS AS (total_package_price - total_paid) STORED,
    lead_notes TEXT,
    contract_signed_at TIMESTAMPTZ,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_events_client FOREIGN KEY (client_id, tenant_id) REFERENCES clients(client_id, tenant_id) ON DELETE RESTRICT,
    UNIQUE (event_id, tenant_id)
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_dates ON events(tenant_id, start_date, end_date);
CREATE INDEX idx_events_status ON events(tenant_id, status);
CREATE INDEX idx_events_soft_delete ON events(tenant_id, deleted_date);

CREATE TRIGGER update_events_updated_date
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 11. EVENT_SESSIONS (Multi-Ceremony / Multi-Day Breakdown)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_sessions (
    event_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    title TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reporting_time TIME,
    venue_name TEXT,
    venue_address TEXT,
    dress_code TEXT,
    is_drone_permitted BOOLEAN NOT NULL DEFAULT TRUE,
    special_instructions TEXT,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_event_sessions_event FOREIGN KEY (event_id, tenant_id) REFERENCES events(event_id, tenant_id) ON DELETE CASCADE,
    UNIQUE (event_session_id, tenant_id)
);

CREATE INDEX idx_event_sessions_date ON event_sessions(tenant_id, session_date);
CREATE INDEX idx_event_sessions_soft_delete ON event_sessions(tenant_id, deleted_date);

CREATE TRIGGER update_event_sessions_updated_date
    BEFORE UPDATE ON event_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 12. EVENT_REQUIREMENTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_requirements (
    event_requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    session_id UUID,
    role_type tenant_role_type NOT NULL,
    quantity_required INT NOT NULL DEFAULT 1,
    budget_per_head NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_req_event FOREIGN KEY (event_id, tenant_id) REFERENCES events(event_id, tenant_id) ON DELETE CASCADE,
    UNIQUE (event_requirement_id, tenant_id)
);

--------------------------------------------------------------------------------
-- 13. EVENT_CHECKLISTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_checklists (
    event_checklist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pre_shoot',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_checklists_event FOREIGN KEY (event_id, tenant_id) REFERENCES events(event_id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_checklists_event ON event_checklists(tenant_id, event_id);

--------------------------------------------------------------------------------
-- 14. TEAM_MEMBERS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    team_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    role tenant_role_type NOT NULL DEFAULT 'photographer',
    is_freelancer BOOLEAN NOT NULL DEFAULT FALSE,
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    day_rate NUMERIC(10, 2) DEFAULT 0.00,
    portfolio_url TEXT,
    gear_list TEXT,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    UNIQUE (team_member_id, tenant_id)
);

CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX idx_team_members_soft_delete ON team_members(tenant_id, deleted_date);

CREATE TRIGGER update_team_members_updated_date
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 15. TEAM_MEMBER_SKILLS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_member_skills (
    team_member_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL,
    skill TEXT NOT NULL,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_team_skill_member FOREIGN KEY (team_member_id, tenant_id) REFERENCES team_members(team_member_id, tenant_id) ON DELETE CASCADE,
    UNIQUE (team_member_id, skill)
);

--------------------------------------------------------------------------------
-- 16. TEAM_ASSIGNMENTS
--------------------------------------------------------------------------------
CREATE TYPE assignment_status_enum AS ENUM (
    'draft',
    'requested',
    'confirmed',
    'declined',
    'completed'
);

CREATE TABLE IF NOT EXISTS team_assignments (
    team_assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    session_id UUID NOT NULL,
    team_member_id UUID NOT NULL,
    role_assigned tenant_role_type NOT NULL,
    status assignment_status_enum NOT NULL DEFAULT 'requested',
    agreed_payout NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    call_time TIME,
    reporting_location TEXT,
    gear_notes TEXT,
    confirmed_at TIMESTAMPTZ,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_assignments_event FOREIGN KEY (event_id, tenant_id) REFERENCES events(event_id, tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_session FOREIGN KEY (session_id, tenant_id) REFERENCES event_sessions(event_session_id, tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_member FOREIGN KEY (team_member_id, tenant_id) REFERENCES team_members(team_member_id, tenant_id) ON DELETE CASCADE,
    UNIQUE (session_id, team_member_id)
);

CREATE INDEX idx_team_assignments_tenant ON team_assignments(tenant_id);
CREATE INDEX idx_team_assignments_member ON team_assignments(team_member_id);
CREATE INDEX idx_team_assignments_soft_delete ON team_assignments(tenant_id, deleted_date);

CREATE TRIGGER update_team_assignments_updated_date
    BEFORE UPDATE ON team_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 17. FREELANCER_REQUESTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_requests (
    freelancer_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    team_member_id UUID NOT NULL,
    offered_rate NUMERIC(10, 2) NOT NULL,
    message_text TEXT NOT NULL,
    dispatch_channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (dispatch_channel IN ('whatsapp', 'email', 'sms', 'call')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_freelance_session FOREIGN KEY (session_id, tenant_id) REFERENCES event_sessions(event_session_id, tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_freelance_member FOREIGN KEY (team_member_id, tenant_id) REFERENCES team_members(team_member_id, tenant_id) ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 18. TEAM_AVAILABILITY & 19. TEAM_UNAVAILABILITY
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_availability (
    team_availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME DEFAULT '08:00:00',
    end_time TIME DEFAULT '22:00:00',
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_avail_member FOREIGN KEY (team_member_id, tenant_id) REFERENCES team_members(team_member_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_unavailability (
    team_unavailability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT DEFAULT 'Booked Elsewhere / Leave',
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_unavail_member FOREIGN KEY (team_member_id, tenant_id) REFERENCES team_members(team_member_id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_team_unavail_dates ON team_unavailability(team_member_id, start_date, end_date);

--------------------------------------------------------------------------------
-- 20. PACKAGES & 21. PACKAGE_ITEMS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    recommended_for TEXT DEFAULT 'Full Wedding Coverage',
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    UNIQUE (package_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS package_items (
    package_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    package_id UUID NOT NULL,
    item_title TEXT NOT NULL,
    item_description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_pkg_items_package FOREIGN KEY (package_id, tenant_id) REFERENCES packages(package_id, tenant_id) ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 22. QUOTATIONS & 23. QUOTATION_ITEMS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
    quotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    event_id UUID,
    quotation_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
    valid_until DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    terms_conditions TEXT,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_quotation_client FOREIGN KEY (client_id, tenant_id) REFERENCES clients(client_id, tenant_id) ON DELETE RESTRICT,
    UNIQUE (quotation_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS quotation_items (
    quotation_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL,
    service_name TEXT NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_quotation_items FOREIGN KEY (quotation_id, tenant_id) REFERENCES quotations(quotation_id, tenant_id) ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 24. PAYMENTS & 25. EXPENSES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    client_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash', 'stripe', 'check', 'upi')),
    payment_stage TEXT NOT NULL DEFAULT 'advance' CHECK (payment_stage IN ('advance', 'mid_payment', 'shoot_day', 'album_delivery', 'final_settlement')),
    reference_number TEXT,
    paid_on DATE NOT NULL,
    notes TEXT,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_payments_event FOREIGN KEY (event_id, tenant_id) REFERENCES events(event_id, tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_client FOREIGN KEY (client_id, tenant_id) REFERENCES clients(client_id, tenant_id) ON DELETE RESTRICT
);

CREATE INDEX idx_payments_event ON payments(tenant_id, event_id);

CREATE TABLE IF NOT EXISTS expenses (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID,
    category TEXT NOT NULL CHECK (category IN ('freelancer_payout', 'gear_rental', 'travel_lodging', 'props_location', 'studio_overhead', 'media_storage', 'software_license')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    recipient_name TEXT NOT NULL,
    incurred_on DATE NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE INDEX idx_expenses_tenant_event ON expenses(tenant_id, event_id);

--------------------------------------------------------------------------------
-- 26. EDITING_PROJECTS & 27. DELIVERABLES
--------------------------------------------------------------------------------
CREATE TYPE editing_stage_enum AS ENUM (
    'backup_verified',
    'photo_selection',
    'photo_retouching',
    'video_teaser',
    'video_feature',
    'album_design',
    'client_review',
    'revisions',
    'completed'
);

CREATE TABLE IF NOT EXISTS editing_projects (
    editing_project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL,
    lead_editor_id UUID REFERENCES team_members(team_member_id) ON DELETE SET NULL,
    current_stage editing_stage_enum NOT NULL DEFAULT 'backup_verified',
    raw_storage_path TEXT,
    backup_disk_label TEXT,
    deadline_date DATE NOT NULL,
    color_grade_notes TEXT,
    client_feedback_notes TEXT,
    revision_count INT NOT NULL DEFAULT 0,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_editing_event FOREIGN KEY (event_id, tenant_id) REFERENCES events(event_id, tenant_id) ON DELETE CASCADE,
    UNIQUE (editing_project_id, tenant_id)
);

CREATE TRIGGER update_editing_projects_updated_date
    BEFORE UPDATE ON editing_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TABLE IF NOT EXISTS deliverables (
    deliverable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    editing_project_id UUID NOT NULL,
    title TEXT NOT NULL,
    deliverable_type TEXT NOT NULL DEFAULT 'gallery_link' CHECK (deliverable_type IN ('gallery_link', 'video_link', 'physical_album', 'hard_drive', 'print_box')),
    delivery_url TEXT,
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_production' CHECK (status IN ('in_production', 'review_pending', 'client_approved', 'dispatched')),
    client_approved_at TIMESTAMPTZ,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    CONSTRAINT fk_deliverables_project FOREIGN KEY (editing_project_id, tenant_id) REFERENCES editing_projects(editing_project_id, tenant_id) ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 28. TASKS & REMINDERS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID,
    assigned_to UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    due_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE INDEX idx_tasks_tenant_due ON tasks(tenant_id, is_completed, due_date);

CREATE TRIGGER update_tasks_updated_date
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

--------------------------------------------------------------------------------
-- 29. NOTIFICATIONS & 30. MESSAGE_TEMPLATES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, inserted_date DESC);

CREATE TABLE IF NOT EXISTS message_templates (
    message_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'sms')),
    template_body TEXT NOT NULL,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

--------------------------------------------------------------------------------
-- 31. FILE_ASSETS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_assets (
    file_asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID,
    client_id UUID,
    bucket_id TEXT NOT NULL DEFAULT 'studio-assets',
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    inserted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
    deleted_date TIMESTAMPTZ,
    UNIQUE (tenant_id, storage_path)
);

CREATE INDEX idx_file_assets_tenant ON file_assets(tenant_id, bucket_id);
-- SNAPFLOW STUDIO: DATABASE MIGRATION 02
-- ROW LEVEL SECURITY (RLS) POLICIES, PRIMARY KEY SUFFIX ADAPTATION, AND SOFT-DELETE ENFORCEMENT

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS (SECURITY DEFINER with safe search_path)
--------------------------------------------------------------------------------

-- 1. Helper to retrieve all tenant IDs the current authenticated user belongs to
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT tenant_id 
    FROM public.tenant_members
    WHERE user_id = auth.uid()
      AND is_active = TRUE
      AND deleted_date IS NULL;
$$;

-- 2. Helper to check if current user is an active member of a specific tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.tenant_members
        WHERE tenant_id = target_tenant_id
          AND user_id = auth.uid()
          AND is_active = TRUE
          AND deleted_date IS NULL
    );
$$;

-- 3. Helper to check if current user has an authorized role in a tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(target_tenant_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.tenant_members
        WHERE tenant_id = target_tenant_id
          AND user_id = auth.uid()
          AND role::TEXT = ANY(allowed_roles)
          AND is_active = TRUE
          AND deleted_date IS NULL
    );
$$;

-- 4. Check if current user is platform super-administrator
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT COALESCE(
        (SELECT is_platform_admin FROM public.profiles WHERE profile_id = auth.uid() AND deleted_date IS NULL),
        FALSE
    );
$$;

--------------------------------------------------------------------------------
-- HARD-DELETE PREVENTION TRIGGER FUNCTION
-- Strictly guarantees zero physical row deletions: enforces soft-delete pattern
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete is permanently disabled on table %. Perform soft delete by setting deleted_date = NOW() and deleted_by = auth.uid() instead.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- ATTACH HARD DELETE PREVENTION TRIGGERS
--------------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_no_hard_delete_profiles BEFORE DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_tenants BEFORE DELETE ON tenants FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_tenant_members BEFORE DELETE ON tenant_members FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_tenant_invitations BEFORE DELETE ON tenant_invitations FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_tenant_settings BEFORE DELETE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_subscription_plans BEFORE DELETE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_tenant_subscriptions BEFORE DELETE ON tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_audit_logs BEFORE DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_clients BEFORE DELETE ON clients FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_events BEFORE DELETE ON events FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_event_sessions BEFORE DELETE ON event_sessions FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_event_requirements BEFORE DELETE ON event_requirements FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_event_checklists BEFORE DELETE ON event_checklists FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_team_members BEFORE DELETE ON team_members FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_team_member_skills BEFORE DELETE ON team_member_skills FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_team_assignments BEFORE DELETE ON team_assignments FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_freelancer_requests BEFORE DELETE ON freelancer_requests FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_team_availability BEFORE DELETE ON team_availability FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_team_unavailability BEFORE DELETE ON team_unavailability FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_packages BEFORE DELETE ON packages FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_package_items BEFORE DELETE ON package_items FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_quotations BEFORE DELETE ON quotations FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_quotation_items BEFORE DELETE ON quotation_items FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_payments BEFORE DELETE ON payments FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_expenses BEFORE DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_editing_projects BEFORE DELETE ON editing_projects FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_deliverables BEFORE DELETE ON deliverables FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_tasks BEFORE DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_notifications BEFORE DELETE ON notifications FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_message_templates BEFORE DELETE ON message_templates FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
CREATE OR REPLACE TRIGGER trg_no_hard_delete_file_assets BEFORE DELETE ON file_assets FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();

--------------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
--------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE editing_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assets ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Users can read active profiles"
ON profiles FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND (
        profile_id = auth.uid()
        OR profile_id IN (
            SELECT tm.user_id FROM tenant_members tm
            WHERE tm.tenant_id IN (SELECT public.get_user_tenant_ids())
              AND tm.deleted_date IS NULL
        )
        OR public.is_platform_admin()
    )
);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (profile_id = auth.uid() AND deleted_date IS NULL)
WITH CHECK (profile_id = auth.uid());

--------------------------------------------------------------------------------
-- 2. TENANTS POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Members can view their own active tenant"
ON tenants FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND (
        tenant_id IN (SELECT public.get_user_tenant_ids())
        OR public.is_platform_admin()
    )
);

CREATE POLICY "Owners can update their own tenant"
ON tenants FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner']));

CREATE POLICY "Authenticated users can create a new tenant"
ON tenants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 3. TENANT_MEMBERS POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Members can view active studio teammates"
ON tenant_members FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND (
        tenant_id IN (SELECT public.get_user_tenant_ids())
        OR user_id = auth.uid()
        OR public.is_platform_admin()
    )
);

CREATE POLICY "Owners and Managers can manage memberships"
ON tenant_members FOR INSERT
WITH CHECK (
    user_id = auth.uid() 
    OR public.has_tenant_role(tenant_id, ARRAY['owner', 'manager'])
);

CREATE POLICY "Owners can update or soft-delete tenant member roles"
ON tenant_members FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner']));

--------------------------------------------------------------------------------
-- 4. TENANT_SETTINGS POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Members can view tenant settings"
ON tenant_settings FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners and Managers can update tenant settings"
ON tenant_settings FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners can insert tenant settings"
ON tenant_settings FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner']));

--------------------------------------------------------------------------------
-- 5. SUBSCRIPTION PLANS & TENANT SUBSCRIPTIONS
--------------------------------------------------------------------------------
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (deleted_date IS NULL OR public.is_platform_admin());

CREATE POLICY "Members can view their studio subscription"
ON tenant_subscriptions FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Only studio owners can manage subscription"
ON tenant_subscriptions FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner']));

--------------------------------------------------------------------------------
-- 6. CLIENTS POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view non-deleted clients"
ON clients FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners, managers, and photographers can create clients"
ON clients FOR INSERT
WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'photographer'])
);

CREATE POLICY "Owners and managers can update or soft-delete clients"
ON clients FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

--------------------------------------------------------------------------------
-- 7. EVENTS POLICIES
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view non-deleted events"
ON events FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners and managers can create events"
ON events FOR INSERT
WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager'])
);

CREATE POLICY "Owners and managers can update or soft-delete events"
ON events FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

--------------------------------------------------------------------------------
-- 8. EVENT_SESSIONS, REQUIREMENTS, CHECKLISTS
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view event sessions"
ON event_sessions FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Staff can manage event sessions"
ON event_sessions FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Staff can update event sessions"
ON event_sessions FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can view checklists"
ON event_checklists FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Tenant members can insert checklists"
ON event_checklists FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant members can update checklists"
ON event_checklists FOR UPDATE
USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant staff can view and manage event requirements"
ON event_requirements FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Tenant staff can mutate event requirements"
ON event_requirements FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant staff can update event requirements"
ON event_requirements FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

--------------------------------------------------------------------------------
-- 9. TEAM MEMBERS, SKILLS, ASSIGNMENTS, AVAILABILITY
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view active team directory"
ON team_members FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners and managers can insert team members"
ON team_members FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can update or soft-delete team members"
ON team_members FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can view team skills"
ON team_member_skills FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Managers and owners can insert team skills"
ON team_member_skills FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Managers and owners can update team skills"
ON team_member_skills FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can view team assignments"
ON team_assignments FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Managers and owners can insert assignments"
ON team_assignments FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Managers and owners can update assignments"
ON team_assignments FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can manage availability"
ON team_availability FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Tenant members can insert availability"
ON team_availability FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant members can update availability"
ON team_availability FOR UPDATE
USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant members can manage unavailability"
ON team_unavailability FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Tenant members can insert unavailability"
ON team_unavailability FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant members can update unavailability"
ON team_unavailability FOR UPDATE
USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Managers can view freelancer requests"
ON freelancer_requests FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND public.has_tenant_role(tenant_id, ARRAY['owner', 'manager'])
);

CREATE POLICY "Managers can insert freelancer requests"
ON freelancer_requests FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Managers can update freelancer requests"
ON freelancer_requests FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

--------------------------------------------------------------------------------
-- 10. PACKAGES & QUOTATIONS
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view packages"
ON packages FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners and managers can insert packages"
ON packages FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can update packages"
ON packages FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can view package items"
ON package_items FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Staff can insert package items"
ON package_items FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Staff can update package items"
ON package_items FOR UPDATE
USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant members can view quotations"
ON quotations FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners and managers can insert quotations"
ON quotations FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can update quotations"
ON quotations FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can view quotation items"
ON quotation_items FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Staff can insert quotation items"
ON quotation_items FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Staff can update quotation items"
ON quotation_items FOR UPDATE
USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

--------------------------------------------------------------------------------
-- 11. PAYMENTS & EXPENSES (Strict Financial Authorization)
--------------------------------------------------------------------------------
CREATE POLICY "Only owners and managers can view payments"
ON payments FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND public.has_tenant_role(tenant_id, ARRAY['owner', 'manager'])
);

CREATE POLICY "Only owners and managers can record payments"
ON payments FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Only owners can update or soft-delete payments"
ON payments FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner']));

CREATE POLICY "Only owners and managers can view expenses"
ON expenses FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND public.has_tenant_role(tenant_id, ARRAY['owner', 'manager'])
);

CREATE POLICY "Owners and managers can record expenses"
ON expenses FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can update expenses"
ON expenses FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

--------------------------------------------------------------------------------
-- 12. EDITING PROJECTS & DELIVERABLES
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view non-deleted editing projects"
ON editing_projects FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Staff can insert editing projects"
ON editing_projects FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'editor']));

CREATE POLICY "Staff and editors can update editing projects"
ON editing_projects FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'editor']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'editor']));

CREATE POLICY "Tenant members can view non-deleted deliverables"
ON deliverables FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Staff and editors can insert deliverables"
ON deliverables FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'editor']));

CREATE POLICY "Staff and editors can update deliverables"
ON deliverables FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'editor']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'editor']));

--------------------------------------------------------------------------------
-- 13. TASKS, NOTIFICATIONS, TEMPLATES, FILE ASSETS
--------------------------------------------------------------------------------
CREATE POLICY "Tenant members can view non-deleted tasks"
ON tasks FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Tenant members can insert tasks"
ON tasks FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Tenant members can update tasks"
ON tasks FOR UPDATE
USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Users can view and manage their own notifications"
ON notifications FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND user_id = auth.uid()
);

CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tenant members can view message templates"
ON message_templates FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Owners and managers can insert templates"
ON message_templates FOR INSERT
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can update templates"
ON message_templates FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

CREATE POLICY "Tenant members can view file assets"
ON file_assets FOR SELECT
USING (
    (deleted_date IS NULL OR public.is_platform_admin())
    AND tenant_id IN (SELECT public.get_user_tenant_ids())
);

CREATE POLICY "Tenant members can insert file asset metadata"
ON file_assets FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

CREATE POLICY "Owners and managers can update file assets"
ON file_assets FOR UPDATE
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']))
WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']));

--------------------------------------------------------------------------------
-- 14. SUPABASE STORAGE BUCKET CREATION & RLS POLICIES
--------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('studio-assets', 'studio-assets', false),
    ('client-documents', 'client-documents', false),
    ('deliverables', 'deliverables', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tenant members can read tenant storage objects"
ON storage.objects FOR SELECT
USING (
    bucket_id IN ('studio-assets', 'client-documents', 'deliverables')
    AND (
        (storage.foldername(name))[1]::UUID IN (SELECT public.get_user_tenant_ids())
        OR public.is_platform_admin()
    )
);

CREATE POLICY "Tenant members can upload tenant storage objects"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id IN ('studio-assets', 'client-documents', 'deliverables')
    AND (
        (storage.foldername(name))[1]::UUID IN (SELECT public.get_user_tenant_ids())
    )
);

CREATE POLICY "Tenant owners and managers can delete tenant storage objects"
ON storage.objects FOR DELETE
USING (
    bucket_id IN ('studio-assets', 'client-documents', 'deliverables')
    AND (
        public.has_tenant_role((storage.foldername(name))[1]::UUID, ARRAY['owner', 'manager'])
    )
);
-- SNAPFLOW STUDIO: DATABASE MIGRATION 03
-- SECURE TENANT REGISTRATION & ATOMIC ONBOARDING RPC
-- Enforces atomic tenant creation, owner membership assignment, default settings,
-- uniqueness protection, and strict least-privilege RBAC.

--------------------------------------------------------------------------------
-- 1. ATOMIC SECURE TENANT ONBOARDING FUNCTION
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_studio_workspace(
    p_studio_name TEXT,
    p_business_type TEXT DEFAULT 'wedding_portrait',
    p_owner_name TEXT DEFAULT NULL,
    p_contact_email TEXT DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL,
    p_city TEXT DEFAULT 'Mumbai',
    p_state TEXT DEFAULT 'Maharashtra',
    p_country TEXT DEFAULT 'India',
    p_website TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_timezone TEXT DEFAULT 'Asia/Kolkata',
    p_currency TEXT DEFAULT 'INR',
    p_currency_symbol TEXT DEFAULT '₹',
    p_date_format TEXT DEFAULT 'DD/MM/YYYY',
    p_services_offered TEXT[] DEFAULT ARRAY['Wedding Photography', 'Cinematic Films']::TEXT[],
    p_team_size_range TEXT DEFAULT '1-5',
    p_event_categories TEXT[] DEFAULT ARRAY['Wedding', 'Pre-Wedding', 'Reception', 'Engagement']::TEXT[],
    p_initial_team_members JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_base_slug TEXT;
    v_unique_slug TEXT;
    v_slug_suffix INT := 1;
    v_member_item JSONB;
    v_invited_email TEXT;
    v_invited_role tenant_role_type;
    v_invitation_token TEXT;
BEGIN
    -- Step 1: Verify authenticated user identity
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User must be signed in to register a studio workspace.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Step 2: Validate submitted business parameters
    IF p_studio_name IS NULL OR TRIM(p_studio_name) = '' THEN
        RAISE EXCEPTION 'Studio name is mandatory and cannot be empty.'
            USING ERRCODE = 'P0002';
    END IF;

    IF LENGTH(TRIM(p_studio_name)) < 2 THEN
        RAISE EXCEPTION 'Studio name must be at least 2 characters long.'
            USING ERRCODE = 'P0003';
    END IF;

    -- Ensure profile exists in public.profiles table
    INSERT INTO public.profiles (
        profile_id,
        email,
        full_name,
        phone,
        timezone,
        is_platform_admin,
        inserted_by,
        inserted_date,
        updated_by,
        updated_date
    )
    SELECT 
        v_user_id,
        COALESCE(auth.jwt()->>'email', p_contact_email, 'owner@studio.com'),
        COALESCE(NULLIF(TRIM(p_owner_name), ''), auth.jwt()->>'full_name', 'Studio Principal'),
        p_contact_phone,
        COALESCE(p_timezone, 'Asia/Kolkata'),
        FALSE,
        v_user_id,
        NOW(),
        v_user_id,
        NOW()
    ON CONFLICT (profile_id) DO UPDATE SET
        full_name = COALESCE(NULLIF(TRIM(p_owner_name), ''), profiles.full_name),
        phone = COALESCE(p_contact_phone, profiles.phone),
        updated_by = v_user_id,
        updated_date = NOW();

    -- Step 3: Generate URL-safe slug with collision protection (idempotency support)
    v_base_slug := regexp_replace(lower(trim(p_studio_name)), '[^a-z0-9]+', '-', 'g');
    v_base_slug := trim(both '-' from v_base_slug);
    IF v_base_slug = '' THEN
        v_base_slug := 'studio';
    END IF;

    v_unique_slug := v_base_slug;
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_unique_slug AND deleted_date IS NULL) LOOP
        v_slug_suffix := v_slug_suffix + 1;
        v_unique_slug := v_base_slug || '-' || v_slug_suffix;
    END LOOP;

    -- Step 4: Atomically insert into tenants table
    v_tenant_id := gen_random_uuid();
    INSERT INTO public.tenants (
        tenant_id,
        name,
        slug,
        business_type,
        logo_url,
        currency,
        currency_symbol,
        timezone,
        date_format,
        phone,
        email,
        website,
        address,
        city,
        country,
        inserted_by,
        inserted_date,
        updated_by,
        updated_date
    ) VALUES (
        v_tenant_id,
        TRIM(p_studio_name),
        v_unique_slug,
        COALESCE(p_business_type, 'wedding_portrait'),
        p_logo_url,
        COALESCE(p_currency, 'INR'),
        COALESCE(p_currency_symbol, '₹'),
        COALESCE(p_timezone, 'Asia/Kolkata'),
        COALESCE(p_date_format, 'DD/MM/YYYY'),
        p_contact_phone,
        p_contact_email,
        p_website,
        p_city || CASE WHEN p_state IS NOT NULL THEN ', ' || p_state ELSE '' END,
        COALESCE(p_city, 'Mumbai'),
        COALESCE(p_country, 'India'),
        v_user_id,
        NOW(),
        v_user_id,
        NOW()
    );

    -- Step 5: Atomically assign owner membership (Role 'owner' enforced server-side)
    -- Crucial: Role is hardcoded to 'owner' so caller cannot escalate to platform_admin or spoof role
    INSERT INTO public.tenant_members (
        tenant_member_id,
        tenant_id,
        user_id,
        role,
        is_active,
        title,
        inserted_by,
        inserted_date,
        updated_by,
        updated_date
    ) VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_user_id,
        'owner'::tenant_role_type,
        TRUE,
        'Studio Founder & Principal',
        v_user_id,
        NOW(),
        v_user_id,
        NOW()
    );

    -- Step 6: Atomically provision default tenant settings
    INSERT INTO public.tenant_settings (
        tenant_setting_id,
        tenant_id,
        booking_lead_buffer_days,
        default_deposit_percentage,
        tax_rate,
        tax_label,
        invoice_footer_note,
        brand_primary_color,
        brand_dark_theme,
        require_drone_permit_ack,
        enable_client_portal,
        auto_remind_days_before_shoot,
        inserted_by,
        inserted_date,
        updated_by,
        updated_date
    ) VALUES (
        gen_random_uuid(),
        v_tenant_id,
        2,
        30.00,
        18.00,
        'GST',
        'Thank you for trusting ' || TRIM(p_studio_name) || ' with your timeless stories.',
        '#d97706',
        TRUE,
        TRUE,
        TRUE,
        3,
        v_user_id,
        NOW(),
        v_user_id,
        NOW()
    );

    -- Step 7: Process optional initial team member invitations
    IF p_initial_team_members IS NOT NULL AND jsonb_array_length(p_initial_team_members) > 0 THEN
        FOR v_member_item IN SELECT * FROM jsonb_array_elements(p_initial_team_members) LOOP
            v_invited_email := TRIM(v_member_item->>'email');
            IF v_invited_email IS NOT NULL AND v_invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                -- Validate role: cannot invite another owner or platform admin during onboarding
                v_invited_role := CASE (v_member_item->>'role')
                    WHEN 'manager' THEN 'manager'::tenant_role_type
                    WHEN 'videographer' THEN 'videographer'::tenant_role_type
                    WHEN 'editor' THEN 'editor'::tenant_role_type
                    WHEN 'freelancer' THEN 'freelancer'::tenant_role_type
                    ELSE 'photographer'::tenant_role_type
                END;

                v_invitation_token := encode(gen_random_bytes(32), 'hex');

                INSERT INTO public.tenant_invitations (
                    tenant_invitation_id,
                    tenant_id,
                    email,
                    role,
                    invited_by,
                    token,
                    expires_at,
                    status,
                    inserted_by,
                    inserted_date,
                    updated_by,
                    updated_date
                ) VALUES (
                    gen_random_uuid(),
                    v_tenant_id,
                    v_invited_email,
                    v_invited_role,
                    v_user_id,
                    v_invitation_token,
                    NOW() + INTERVAL '14 days',
                    'pending',
                    v_user_id,
                    NOW(),
                    v_user_id,
                    NOW()
                );
            END IF;
        END LOOP;
    END IF;

    -- Step 8: Return structured JSON with new tenant ID and details
    RETURN jsonb_build_object(
        'success', TRUE,
        'tenant_id', v_tenant_id,
        'name', TRIM(p_studio_name),
        'slug', v_unique_slug,
        'role', 'owner',
        'currency', COALESCE(p_currency, 'INR'),
        'timezone', COALESCE(p_timezone, 'Asia/Kolkata'),
        'created_at', NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Transaction rolls back automatically on unhandled error
        RAISE EXCEPTION 'Tenant registration failed: %', SQLERRM;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_studio_workspace TO authenticated;

--------------------------------------------------------------------------------
-- 2. QUERY HELPER FOR USER WORKSPACES
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE (
    tenant_id UUID,
    name TEXT,
    slug TEXT,
    business_type TEXT,
    logo_url TEXT,
    city TEXT,
    country TEXT,
    currency TEXT,
    timezone TEXT,
    user_role tenant_role_type,
    is_active BOOLEAN,
    member_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT 
        t.tenant_id,
        t.name,
        t.slug,
        t.business_type,
        t.logo_url,
        t.city,
        t.country,
        t.currency,
        t.timezone,
        tm.role AS user_role,
        tm.is_active,
        (SELECT COUNT(*) FROM public.tenant_members sub_tm WHERE sub_tm.tenant_id = t.tenant_id AND sub_tm.deleted_date IS NULL) AS member_count
    FROM public.tenants t
    INNER JOIN public.tenant_members tm ON tm.tenant_id = t.tenant_id
    WHERE tm.user_id = auth.uid()
      AND tm.is_active = TRUE
      AND tm.deleted_date IS NULL
      AND t.deleted_date IS NULL
    ORDER BY t.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_workspaces TO authenticated;
