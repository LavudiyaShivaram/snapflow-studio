import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable retrieval
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey &&
    supabaseKey.length > 20
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize official Supabase client:', err);
  }
}

export const supabase = client;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url?: string;
  hasKey: boolean;
  maskedKey?: string;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      url: supabaseUrl || undefined,
      hasKey: Boolean(supabaseKey),
      maskedKey: undefined,
    };
  }

  const keyStr = supabaseKey || '';
  const maskedKey =
    keyStr.length > 10
      ? `${keyStr.slice(0, 6)}••••••••${keyStr.slice(-4)}`
      : '••••••••';

  return {
    isConfigured: true,
    url: supabaseUrl,
    hasKey: true,
    maskedKey,
  };
}
