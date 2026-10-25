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
