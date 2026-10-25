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
