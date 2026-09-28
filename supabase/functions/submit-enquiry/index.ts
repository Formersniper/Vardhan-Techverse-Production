/**
 * @file submit-enquiry/index.ts
 * @description Supabase Edge Function for Public Lead Enquiry Ingestion (V1.0 Stage 2)
 * Enforces rate-limiting, honeypot detection, input sanitization, server-side derivation,
 * and transactional audit-logged persistence.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EnquiryPayload {
  company_id?: string;
  name: string;
  email: string;
  phone: string;
  enquiry_type: 'REAL_ESTATE' | 'AUTOMATION' | 'DEVELOPER_PARTNERSHIP' | 'TECHNOLOGY' | 'OTHER';
  message: string;
  page_source?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  website_url_check?: string; // Honeypot field 1
  hp_company_field?: string;  // Honeypot field 2
}

const DEFAULT_COMPANY_ID = 'c0000000-0000-0000-0000-000000000001';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are missing.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body: EnquiryPayload = await req.json();

    // 1. Anti-Spam Honeypot Check (Silently drop or acknowledge bot submissions)
    if (
      (body.website_url_check && body.website_url_check.trim().length > 0) ||
      (body.hp_company_field && body.hp_company_field.trim().length > 0)
    ) {
      console.warn('[Anti-Spam] Bot submission dropped via honeypot field.');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your enquiry has been received and routed.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Client IP & Rate Limiting Key
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown-ip';
    const rateLimitKey = `ip:${clientIp}`;

    // 3. Strict Input Validation & Sanitization
    const name = (body.name || '').replace(/<[^>]*>/g, '').trim();
    if (!name || name.length < 2 || name.length > 120) {
      return new Response(
        JSON.stringify({ success: false, message: 'Full name must be between 2 and 120 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = (body.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: 'A valid email address is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phone = (body.phone || '').replace(/[\s\-\(\)]/g, '').trim();
    if (!phone || phone.length < 7 || phone.length > 20) {
      return new Response(
        JSON.stringify({ success: false, message: 'A valid phone number is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validEnquiryTypes = [
      'REAL_ESTATE',
      'AUTOMATION',
      'DEVELOPER_PARTNERSHIP',
      'TECHNOLOGY',
      'OTHER',
    ];
    if (!body.enquiry_type || !validEnquiryTypes.includes(body.enquiry_type)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid enquiry classification.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = (body.message || '').replace(/<[^>]*>/g, '').trim();
    if (!message || message.length < 10 || message.length > 3000) {
      return new Response(
        JSON.stringify({ success: false, message: 'Message must be between 10 and 3000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyId = body.company_id || DEFAULT_COMPANY_ID;

    // 4. Execute Transactional RPC in PostgreSQL
    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_lead_enquiry', {
      p_company_id: companyId,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_enquiry_type: body.enquiry_type,
      p_message: message,
      p_page_source: body.page_source || '/contact',
      p_source: body.source || 'WEBSITE',
      p_metadata: body.metadata || {},
      p_rate_limit_key: rateLimitKey,
    });

    if (rpcError) {
      console.error('[submit-enquiry] RPC Error:', rpcError);
      return new Response(
        JSON.stringify({ success: false, message: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rpcResult && rpcResult.success === false) {
      const statusCode = rpcResult.code === 'RATE_LIMITED' ? 429 : 400;
      return new Response(
        JSON.stringify(rpcResult),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(rpcResult),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[submit-enquiry] Unhandled error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An internal error occurred while logging your enquiry.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
