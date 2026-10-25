import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from './supabase';

/**
 * Reusable Supabase client module per project specification.
 * Provides the initialized client instance, configuration checkers, and diagnostic utilities.
 */
export const supabaseClient: SupabaseClient | null = supabase;
export { supabase, isSupabaseConfigured, getSupabaseConfigStatus };

/**
 * Helper to get an active Supabase client or throw a clear error
 * if environment variables have not been configured.
 */
export function getActiveSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.'
    );
  }
  return supabase;
}

export default supabase;
