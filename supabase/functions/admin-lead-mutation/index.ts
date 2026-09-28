/**
 * @file admin-lead-mutation/index.ts
 * @description Supabase Edge Function for Authorized Lead State Mutations (V1.0 Stage 2)
 * Verifies JWT session, role authorization, company-isolation boundary,
 * and calls transactional PostgreSQL RPC with append-only audit logging.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MutationPayload {
  action: 'UPDATE' | 'SOFT_DELETE';
  lead_id: string;
  status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST' | 'SPAM';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to?: string;
  internal_notes?: string;
  customer_id?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split('Bearer ')[1].trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are missing.');
    }

    // Client authenticated as the calling user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: MutationPayload = await req.json();
    if (!body.lead_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'lead_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'SOFT_DELETE') {
      const { data, error } = await userClient.rpc('admin_soft_delete_lead', {
        p_lead_id: body.lead_id,
        p_reason: body.reason || 'Archived via administrative action',
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'UPDATE') {
      const { data, error } = await userClient.rpc('admin_mutate_lead', {
        p_lead_id: body.lead_id,
        p_status: body.status,
        p_priority: body.priority,
        p_assigned_to: body.assigned_to,
        p_internal_notes: body.internal_notes,
        p_customer_id: body.customer_id,
        p_metadata: body.metadata,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action specified' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[admin-lead-mutation] Unhandled error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
