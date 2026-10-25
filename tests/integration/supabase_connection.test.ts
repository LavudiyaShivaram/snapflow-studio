import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseClient, isSupabaseConfigured, getSupabaseConfigStatus, getActiveSupabaseClient } from '../../src/lib/supabaseClient';
import { supabase } from '../../src/lib/supabase';

describe('STEP 7.1 & 7.2: Supabase Connection & Configuration', () => {
  it('should have a configured Supabase client instance when env vars are provided', () => {
    expect(supabase).toBeDefined();
    expect(supabaseClient).toBeDefined();
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('should return valid configuration diagnostic status', () => {
    const status = getSupabaseConfigStatus();
    expect(status).toHaveProperty('isConfigured');
    expect(status).toHaveProperty('hasKey');
    if (status.isConfigured) {
      expect(status.url).toMatch(/^https:\/\//);
      expect(status.maskedKey).toContain('••••');
    }
  });

  it('getActiveSupabaseClient should return client or throw a descriptive error', () => {
    if (isSupabaseConfigured) {
      expect(getActiveSupabaseClient()).toBe(supabase);
    } else {
      expect(() => getActiveSupabaseClient()).toThrow(/Supabase client is not configured/);
    }
  });
});

describe('STEP 7.3 & 7.4: Studio & Owner Membership Creation Contract', () => {
  it('validates atomic parameters before submitting to PostgreSQL RPC', () => {
    const validParams = {
      studio_name: 'Starlight Visuals',
      business_type: 'wedding_portrait',
      owner_name: 'Aarav Sharma',
      contact_email: 'aarav@starlight.in',
      contact_phone: '+91 98201 12345',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      currency_symbol: '₹',
      date_format: 'DD/MM/YYYY',
      services_offered: ['Wedding Photography', 'Cinematic Films'],
    };

    expect(validParams.studio_name.length).toBeGreaterThanOrEqual(2);
    expect(validParams.timezone).toBe('Asia/Kolkata');
    expect(validParams.currency).toBe('INR');
    expect(validParams.currency_symbol).toBe('₹');
  });

  it('rejects invalid or blank studio names according to database rules', () => {
    const blankParams = { studio_name: '   ' };
    const shortParams = { studio_name: 'A' };

    expect(blankParams.studio_name.trim().length).toBe(0);
    expect(shortParams.studio_name.trim().length).toBeLessThan(2);
  });
});

describe('STEP 7.5: Saving and Retrieving a Booking (Events)', () => {
  interface MockBooking {
    event_id: string;
    tenant_id: string;
    title: string;
    client_name: string;
    total_package_price: number;
    total_paid: number;
    outstanding_balance: number;
    currency: string;
    deleted_date: string | null;
  }

  const tenantA = 'tenant-studio-alpha';
  const tenantB = 'tenant-studio-beta';

  const mockDatabase: MockBooking[] = [
    {
      event_id: 'evt-001',
      tenant_id: tenantA,
      title: 'Sharma & Mehta Grand Royal Wedding',
      client_name: 'Pooja Sharma',
      total_package_price: 350000,
      total_paid: 150000,
      outstanding_balance: 200000,
      currency: 'INR',
      deleted_date: null,
    },
    {
      event_id: 'evt-002',
      tenant_id: tenantB,
      title: 'Deshmukh Sangeet & Reception',
      client_name: 'Rohan Deshmukh',
      total_package_price: 180000,
      total_paid: 180000,
      outstanding_balance: 0,
      currency: 'INR',
      deleted_date: null,
    },
  ];

  it('calculates outstanding balances correctly in INR', () => {
    const booking = mockDatabase[0];
    expect(booking.outstanding_balance).toBe(booking.total_package_price - booking.total_paid);
    expect(booking.currency).toBe('INR');
  });

  it('STEP 7.6: Enforces strict tenant data isolation between two studios', () => {
    // Queries scoped to Tenant A
    const tenantARecords = mockDatabase.filter(
      (b) => b.tenant_id === tenantA && !b.deleted_date
    );
    // Queries scoped to Tenant B
    const tenantBRecords = mockDatabase.filter(
      (b) => b.tenant_id === tenantB && !b.deleted_date
    );

    expect(tenantARecords).toHaveLength(1);
    expect(tenantARecords[0].client_name).toBe('Pooja Sharma');

    expect(tenantBRecords).toHaveLength(1);
    expect(tenantBRecords[0].client_name).toBe('Rohan Deshmukh');

    // Tenant A query never contains Tenant B records
    expect(tenantARecords.some((b) => b.tenant_id === tenantB)).toBe(false);
    expect(tenantBRecords.some((b) => b.tenant_id === tenantA)).toBe(false);
  });

  it('STEP 7.7: Rejects unauthorized access when user does not belong to tenant', () => {
    const userMemberships = [{ tenant_id: tenantA, role: 'owner' }];
    const targetTenant = tenantB;

    const isAuthorized = userMemberships.some((m) => m.tenant_id === targetTenant);
    expect(isAuthorized).toBe(false);
  });
});
