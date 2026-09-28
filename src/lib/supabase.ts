/**
 * @file supabase.ts
 * @description Supabase client integration for Vardhan Techverse Private Limited (Stage 2)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const DEFAULT_COMPANY_ID =
  process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || 'c0000000-0000-0000-0000-000000000001';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zoxkybepsmehvzhymafp.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

if (!supabaseKey && typeof window !== 'undefined') {
  console.warn(
    '[Supabase Client] Public publishable API key is missing. ' +
    'Please configure NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment variables.'
  );
}

// Standard client for public or authenticated browser contexts (restricted by RLS)
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey || 'unconfigured-public-key',
  {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  }
);

// Admin service-role client (strictly server-side/Edge Functions only)
export function getServiceRoleClient(): SupabaseClient<Database> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side admin operations.');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
