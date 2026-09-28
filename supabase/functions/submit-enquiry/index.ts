/**
 * @file submit-enquiry/index.ts
 * @description Production Supabase Edge Function for Public Lead Enquiry Ingestion (V1.0 Stage 2)
 * Ingests public website enquiries, enforces server-side validation and honeypot checks,
 * extracts client IP, and delegates transactional execution to canonical public.submit_lead_enquiry() RPC.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EnquiryPayload {
  name: string;
  email: string;
  phone: string;
  enquiry_type: 'REAL_ESTATE' | 'AUTOMATION' | 'DEVELOPER_PARTNERSHIP' | 'TECHNOLOGY' | 'OTHER';
  message: string;
  page_source?: string;
  metadata?: Record<string, unknown>;
  website_url_check?: string; // Primary Honeypot field
  hp_company_field?: string;  // Secondary Honeypot field
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[submit-enquiry] Missing server-side Supabase environment configuration.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unable to submit your enquiry at this time due to server configuration.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    let body: EnquiryPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: 'Malformed JSON payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Anti-Spam Honeypot Check
    const honeypotInput = (body.website_url_check || body.hp_company_field || '').trim();

    // 2. Client IP Extraction
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';

    // 3. Strict Server-Side Input Validation
    const name = (body.name || '').replace(/<[^>]*>/g, '').trim();
    if (!name || name.length < 2 || name.length > 120) {
      return new Response(
        JSON.stringify({ success: false, message: 'Full name must be between 2 and 120 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = (body.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ success: false, message: 'A valid email address is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phone = (body.phone || '').trim();
    if (!phone || phone.length < 8 || phone.length > 30) {
      return new Response(
        JSON.stringify({ success: false, message: 'A valid phone number (minimum 8 characters) is required.' }),
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
        JSON.stringify({ success: false, message: 'Invalid enquiry classification type.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = (body.message || '').replace(/<[^>]*>/g, '').trim();
    if (!message || message.length < 5 || message.length > 3000) {
      return new Response(
        JSON.stringify({ success: false, message: 'Message must be between 5 and 3000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageSource = (body.page_source || '/contact').trim().slice(0, 255);

    // 4. Invoke canonical public.submit_lead_enquiry SECURITY DEFINER RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_lead_enquiry', {
      p_company_slug: 'vardhan-techverse',
      p_enquiry_type: body.enquiry_type,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_message: message,
      p_page_source: pageSource,
      p_honeypot: honeypotInput,
      p_client_ip: clientIp,
    });

    if (rpcError) {
      console.error('[submit-enquiry] RPC Execution Error:', rpcError.message);
      const isRateLimited = rpcError.message.toLowerCase().includes('rate limit');
      return new Response(
        JSON.stringify({
          success: false,
          message: isRateLimited
            ? 'Too many enquiries have been submitted from this connection. Please wait a few minutes and try again.'
            : 'Unable to submit your enquiry at this time. Please try again shortly.',
        }),
        {
          status: isRateLimited ? 429 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(rpcResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[submit-enquiry] Unhandled Exception:', error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unable to submit your enquiry at this time. Please try again shortly.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
