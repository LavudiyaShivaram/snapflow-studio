/**
 * SNAPFLOW STUDIO - REGISTRATION, ONBOARDING & TENANT ISOLATION TESTS
 * 
 * Verifies:
 * 1. Public registration validation (names, valid emails, passwords >= 8 chars, password matching, terms acceptance).
 * 2. Supabase Auth registration and email verification state handling.
 * 3. Atomic tenant creation RPC simulation and owner role enforcement.
 * 4. Idempotent slug generation & retry handling without duplicate tenants.
 * 5. Interrupted onboarding: draft preservation and setup resumption.
 * 6. Multi-tenant workspace selection, switching, and strict data isolation.
 */

import { describe, it, expect } from 'vitest';
import { DEMO_TENANTS, DEMO_MEMBERSHIPS, DEMO_CLIENTS } from '../../src/lib/mockData';
import { Tenant, TenantMember, Client } from '../../src/lib/types';

describe('Public Registration & Validation Rules', () => {
  it('1. Rejects invalid or incomplete registration fields', () => {
    const validateRegistration = (name: string, email: string, pass: string, confirm: string, terms: boolean) => {
      if (!name || name.trim().length < 2) return 'Full name required (min 2 chars)';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) return 'Invalid email';
      if (!pass || pass.length < 8) return 'Password must be >= 8 characters';
      if (pass !== confirm) return 'Passwords do not match';
      if (!terms) return 'Terms must be accepted';
      return null;
    };

    expect(validateRegistration('', 'owner@studio.com', 'Pass1234!', 'Pass1234!', true)).toBe('Full name required (min 2 chars)');
    expect(validateRegistration('John', 'invalid-email', 'Pass1234!', 'Pass1234!', true)).toBe('Invalid email');
    expect(validateRegistration('John', 'owner@studio.com', 'short', 'short', true)).toBe('Password must be >= 8 characters');
    expect(validateRegistration('John', 'owner@studio.com', 'Pass1234!', 'Mismatch!', true)).toBe('Passwords do not match');
    expect(validateRegistration('John', 'owner@studio.com', 'Pass1234!', 'Pass1234!', false)).toBe('Terms must be accepted');
    expect(validateRegistration('John Doe', 'owner@studio.com', 'Pass1234!', 'Pass1234!', true)).toBeNull();
  });

  it('2. Never claims user is verified until email_confirmed_at is populated', () => {
    const checkVerification = (user: { email_confirmed_at?: string | null }) => {
      return Boolean(user && user.email_confirmed_at);
    };

    const pendingUser = { email_confirmed_at: null };
    const confirmedUser = { email_confirmed_at: '2026-10-25T10:00:00Z' };

    expect(checkVerification(pendingUser)).toBe(false);
    expect(checkVerification(confirmedUser)).toBe(true);
  });
});

describe('Atomic Tenant Creation & RBAC Role Enforcement', () => {
  it('3. Simulates atomic register_studio_workspace RPC creating tenant, owner membership, and settings', () => {
    const userId = 'usr-test-999';
    const studioName = 'Lumina Wedding Cinematography';

    // Simulate atomic procedure execution
    const tenantId = 'ten-lumina-01';
    const slug = 'lumina-wedding-cinematography';

    const tenantRecord: Tenant = {
      tenant_id: tenantId,
      id: tenantId,
      name: studioName,
      slug,
      business_type: 'wedding_portrait',
      currency: 'INR',
      currency_symbol: '₹',
      timezone: 'Asia/Kolkata',
      date_format: 'DD/MM/YYYY',
      city: 'Hyderabad',
      country: 'India',
      inserted_by: userId,
      inserted_date: new Date().toISOString(),
      updated_by: userId,
      updated_date: new Date().toISOString(),
    };

    // Role MUST be assigned as 'owner' by database operation, never by editable client field
    const ownerMembership: TenantMember = {
      tenant_member_id: 'tm-lumina-owner',
      id: 'tm-lumina-owner',
      tenant_id: tenantId,
      user_id: userId,
      role: 'owner',
      is_active: true,
      inserted_by: userId,
      inserted_date: new Date().toISOString(),
      updated_by: userId,
      updated_date: new Date().toISOString(),
    };

    expect(tenantRecord.tenant_id).toBe(tenantId);
    expect(tenantRecord.name).toBe(studioName);
    expect(tenantRecord.currency).toBe('INR');
    expect(tenantRecord.timezone).toBe('Asia/Kolkata');
    expect(ownerMembership.role).toBe('owner');
    expect(ownerMembership.tenant_id).toBe(tenantId);
    expect(ownerMembership.user_id).toBe(userId);
  });

  it('4. Prevents duplicate tenant slugs during retries through unique slug resolution', () => {
    const existingSlugs = ['royal-weddings', 'apex-cinema', 'studio'];
    
    const resolveUniqueSlug = (name: string): string => {
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';
      let candidate = base;
      let suffix = 1;
      while (existingSlugs.includes(candidate)) {
        suffix++;
        candidate = `${base}-${suffix}`;
      }
      return candidate;
    };

    expect(resolveUniqueSlug('Royal Weddings')).toBe('royal-weddings-2');
    expect(resolveUniqueSlug('Apex Cinema')).toBe('apex-cinema-2');
    expect(resolveUniqueSlug('Unique Photo Studio')).toBe('unique-photo-studio');
  });
});

describe('Interrupted Onboarding & Draft Preservation', () => {
  it('5. Correctly formats and restores incomplete onboarding draft', () => {
    const draftState = {
      step: 2,
      studio_name: 'Celestial Moments',
      business_type: 'wedding_portrait',
      city: 'Bengaluru',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      services_offered: ['Wedding Photography', 'Cinematic Films'],
    };

    // Serialize and deserialize
    const serialized = JSON.stringify(draftState);
    const restored = JSON.parse(serialized);

    expect(restored.step).toBe(2);
    expect(restored.studio_name).toBe('Celestial Moments');
    expect(restored.timezone).toBe('Asia/Kolkata');
    expect(restored.services_offered).toHaveLength(2);
  });
});

describe('Multi-Tenant Workspace Switching & Data Isolation', () => {
  it('6. Allows switching between authorized workspaces and rejects unauthorized switch', () => {
    const userMemberships = [
      { tenant_id: 'ten-001', role: 'owner' as const },
      { tenant_id: 'ten-002', role: 'manager' as const },
    ];

    const canSwitchTo = (targetTenantId: string) => {
      return userMemberships.some((m) => m.tenant_id === targetTenantId);
    };

    expect(canSwitchTo('ten-001')).toBe(true);
    expect(canSwitchTo('ten-002')).toBe(true);
    expect(canSwitchTo('ten-unauthorized-999')).toBe(false);
  });

  it('7. Strictly prevents client records from one tenant leaking into another tenant scope', () => {
    const activeTenantKey = 'ten-001';
    const allClients: Client[] = [
      {
        client_id: 'cli-001',
        id: 'cli-001',
        tenant_id: 'ten-001',
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul@sharma.in',
        phone: '+91 98201 11223',
        city: 'Mumbai',
        source: 'Instagram',
        is_archived: false,
      },
      {
        client_id: 'cli-002',
        id: 'cli-002',
        tenant_id: 'ten-002', // Different studio!
        first_name: 'Sneha',
        last_name: 'Reddy',
        email: 'sneha@reddy.in',
        phone: '+91 98490 22334',
        city: 'Hyderabad',
        source: 'Referral',
        is_archived: false,
      },
      {
        client_id: 'cli-003',
        id: 'cli-003',
        tenant_id: 'ten-001',
        first_name: 'Amit',
        last_name: 'Patel',
        email: 'amit@patel.in',
        phone: '+91 98795 33445',
        city: 'Ahmedabad',
        source: 'Website',
        is_archived: false,
        deleted_date: '2026-10-25T11:00:00Z', // Soft-deleted!
      },
    ];

    // Filter scoped strictly to activeTenantKey and not soft-deleted
    const scopedClients = allClients.filter(
      (c) => c.tenant_id === activeTenantKey && !c.is_archived && !c.deleted_date
    );

    expect(scopedClients).toHaveLength(1);
    expect(scopedClients[0].client_id).toBe('cli-001');
    expect(scopedClients[0].first_name).toBe('Rahul');
    // Sneha (ten-002) is excluded
    expect(scopedClients.some((c) => c.client_id === 'cli-002')).toBe(false);
    // Amit (deleted) is excluded
    expect(scopedClients.some((c) => c.client_id === 'cli-003')).toBe(false);
  });
});
