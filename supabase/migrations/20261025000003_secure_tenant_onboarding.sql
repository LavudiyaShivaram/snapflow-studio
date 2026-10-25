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
