import { createClient } from '@supabase/supabase-js';

const url = 'https://hktlsqfsmpdniuqktjyj.supabase.co';
const key = 'sb_publishable_87Wo86KeR44QugeT1EAOXw_GHRW6-Eq';

console.log('Testing Supabase connectivity...');
console.log('Target URL:', url);

async function testConnection() {
  const client = createClient(url, key);

  try {
    // 1. Test Auth service reachability
    const { data: authData, error: authError } = await client.auth.getSession();
    console.log('Auth check result:', { hasSession: !!authData?.session, error: authError?.message || null });

    // 2. Test PostgreSQL database REST reachability
    const { data: tenants, error: tenantsError } = await client
      .from('tenants')
      .select('tenant_id, name, slug')
      .limit(5);

    console.log('Tenants table query:', {
      success: !tenantsError,
      recordsFound: tenants?.length ?? 0,
      records: tenants,
      error: tenantsError ? { code: tenantsError.code, message: tenantsError.message, details: tenantsError.details } : null
    });

    // 3. Test other core tables
    const tables = ['profiles', 'tenant_members', 'clients', 'events', 'tenant_settings'];
    for (const table of tables) {
      const { error } = await client.from(table).select('count', { count: 'exact', head: true });
      console.log(`Table '${table}' status:`, error ? `${error.code} - ${error.message}` : 'Accessible');
    }

  } catch (err) {
    console.error('Connection test encountered unexpected error:', err);
  }
}

testConnection();
