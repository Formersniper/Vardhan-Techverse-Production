-- VARDHAN TECHVERSE PRIVATE LIMITED — STAGE 2 FROZEN DATABASE ARCHITECTURE
-- Production SQL Migration File
-- File: supabase/migrations/20260927000000_stage2_frozen_architecture.sql

-- 1. EXTENSIONS & SCHEMA PREPARATION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('ADMIN', 'OPERATOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enquiry_type_enum AS ENUM (
    'REAL_ESTATE',
    'DEVELOPER_PARTNERSHIP',
    'AUTOMATION',
    'TECHNOLOGY',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.business_unit_type AS ENUM (
    'REALTY',
    'AUTOMATION',
    'GROWTHFORGE',
    'CORPORATE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status_enum AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL_SENT',
    'IN_NEGOTIATION',
    'WON',
    'LOST',
    'SPAM',
    'ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. SEQUENCES AND CORE TABLES

CREATE SEQUENCE IF NOT EXISTS public.lead_number_seq START WITH 1 INCREMENT BY 1;

-- Table 1: companies (Multi-tenant isolation boundary)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: profiles (User identity & role assignment)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  role public.user_role_enum NOT NULL DEFAULT 'OPERATOR'::public.user_role_enum,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 3: leads (Canonical enquiry capture)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  lead_number TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  business_unit public.business_unit_type NOT NULL,
  enquiry_type public.enquiry_type_enum NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'WEBSITE',
  page_source TEXT NOT NULL DEFAULT '/contact',
  status public.lead_status_enum NOT NULL DEFAULT 'NEW',
  priority public.lead_priority_enum NOT NULL DEFAULT 'MEDIUM',
  assigned_to UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  internal_notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ NULL
);

-- Table 4: lead_events (Strictly Immutable Audit Log)
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  actor_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('ADMIN', 'OPERATOR', 'SYSTEM', 'ANON')),
  event_type TEXT NOT NULL,
  old_state JSONB NULL,
  new_state JSONB NULL,
  notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 5: rate_limit_buckets (Server-side Token Bucket Rate Limiter)
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key TEXT PRIMARY KEY,
  tokens INTEGER NOT NULL,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 6: site_content (Admin-controlled content key-value repository)
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  content_key TEXT NOT NULL,
  content_value JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT site_content_company_key_unique UNIQUE (company_id, content_key)
);

-- Table 7: site_content_audit (Append-only Content Audit Log)
CREATE TABLE IF NOT EXISTS public.site_content_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  content_key TEXT NOT NULL,
  old_value JSONB NULL,
  new_value JSONB NOT NULL,
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SERVER-SIDE BUSINESS RULES & DERIVATION HELPERS

-- 4.1 Server-side lead_number generation
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  current_year TEXT;
  seq_val BIGINT;
BEGIN
  current_year := to_char(timezone('utc'::text, now()), 'YYYY');
  seq_val := nextval('public.lead_number_seq');
  RETURN 'LEAD-' || current_year || '-' || lpad(seq_val::text, 5, '0');
END;
$$;

-- 4.2 Server-side business-unit derivation
CREATE OR REPLACE FUNCTION public.derive_business_unit(enq_type public.enquiry_type_enum)
RETURNS public.business_unit_type
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE enq_type
    WHEN 'REAL_ESTATE' THEN
      RETURN 'REALTY'::public.business_unit_type;
    WHEN 'DEVELOPER_PARTNERSHIP' THEN
      RETURN 'REALTY'::public.business_unit_type;
    WHEN 'AUTOMATION' THEN
      RETURN 'AUTOMATION'::public.business_unit_type;
    WHEN 'TECHNOLOGY' THEN
      RETURN 'GROWTHFORGE'::public.business_unit_type;
    WHEN 'OTHER' THEN
      RETURN 'CORPORATE'::public.business_unit_type;
    ELSE
      RETURN 'CORPORATE'::public.business_unit_type;
  END CASE;
END;
$$;

-- 4.3 Trigger to guarantee lead_number, business_unit derivation, and immutable UUID on insert
CREATE OR REPLACE FUNCTION public.trg_leads_enforce_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Always enforce server-side business unit derivation
  NEW.business_unit := public.derive_business_unit(NEW.enquiry_type);

  -- Always guarantee lead_number if not provided or empty
  IF NEW.lead_number IS NULL OR trim(NEW.lead_number) = '' THEN
    NEW.lead_number := public.generate_lead_number();
  END IF;

  -- Guarantee lead_id is set
  IF NEW.lead_id IS NULL THEN
    NEW.lead_id := gen_random_uuid();
  END IF;

  -- Always set updated_at
  NEW.updated_at := timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_invariants ON public.leads;
CREATE TRIGGER trg_leads_invariants
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_leads_enforce_invariants();

-- 4.4 Append-only lead_events immutability enforcement
CREATE OR REPLACE FUNCTION public.trg_enforce_lead_events_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'lead_events is an immutable audit log. UPDATE and DELETE operations are strictly forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_events_immutability ON public.lead_events;
CREATE TRIGGER trg_lead_events_immutability
BEFORE UPDATE OR DELETE ON public.lead_events
FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_lead_events_append_only();

-- 4.5 Append-only site_content_audit immutability enforcement
CREATE OR REPLACE FUNCTION public.trg_enforce_site_content_audit_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'site_content_audit is an immutable audit log. UPDATE and DELETE operations are strictly forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS trg_site_content_audit_immutability ON public.site_content_audit;
CREATE TRIGGER trg_site_content_audit_immutability
BEFORE UPDATE OR DELETE ON public.site_content_audit
FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_site_content_audit_append_only();

-- 4.6 Protect profile security fields from self-escalation
CREATE OR REPLACE FUNCTION public.trg_enforce_profile_field_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      IF v_actor IS NULL OR NOT public.is_admin(v_actor) THEN
        RAISE EXCEPTION 'Permission denied: Protected profile fields can only be changed by an administrator.';
      END IF;
    END IF;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_field_protection ON public.profiles;
CREATE TRIGGER trg_profile_field_protection
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_profile_field_protection();

-- 5. NON-RECURSIVE SECURITY DEFINER AUTHORIZATION HELPERS
-- Crucial: SET search_path = public, auth prevents search path hijacking.
-- Crucial: Direct select from profiles with SECURITY DEFINER prevents infinite RLS recursion.

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.user_role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = p_user_id AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = p_user_id AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id AND role = 'ADMIN'::public.user_role_enum AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id AND role IN ('ADMIN'::public.user_role_enum, 'OPERATOR'::public.user_role_enum) AND is_active = true
  );
$$;

-- 6. RESTRICTIVE ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_audit ENABLE ROW LEVEL SECURITY;

-- 6.1 companies Policies
DROP POLICY IF EXISTS companies_select_policy ON public.companies;
CREATE POLICY companies_select_policy ON public.companies
FOR SELECT TO authenticated
USING (id = public.get_user_company_id(auth.uid()));

-- 6.2 profiles Policies
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Direct profile mutation is intentionally disabled in V1.
-- Protected profile fields are managed only through trusted server-side provisioning/admin workflows.
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;

-- 6.3 leads Policies
DROP POLICY IF EXISTS leads_select_policy ON public.leads;
CREATE POLICY leads_select_policy ON public.leads
FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (deleted_at IS NULL OR public.is_admin(auth.uid()))
);

-- No direct INSERT or UPDATE policy is defined for leads.
-- Canonical lead mutations are performed only by SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS leads_insert_policy ON public.leads;
DROP POLICY IF EXISTS leads_update_policy ON public.leads;

-- Physical deletion is disabled at the client-policy layer.
-- Administrative deletion is represented by deleted_at through admin_soft_delete_lead().
DROP POLICY IF EXISTS leads_delete_policy ON public.leads;

-- 6.4 lead_events Policies
DROP POLICY IF EXISTS lead_events_select_policy ON public.lead_events;
CREATE POLICY lead_events_select_policy ON public.lead_events
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- No direct INSERT/UPDATE/DELETE policies are defined for lead_events.
-- Audit events are written only by trusted SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS lead_events_insert_policy ON public.lead_events;

-- 6.5 rate_limit_buckets Policies
DROP POLICY IF EXISTS rate_limit_buckets_select_policy ON public.rate_limit_buckets;
-- No client SELECT policy. Rate-limit state is server-side only.

-- 6.6 site_content Policies
DROP POLICY IF EXISTS site_content_select_policy ON public.site_content;
CREATE POLICY site_content_select_policy ON public.site_content
FOR SELECT TO public
USING (is_published = true OR (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id(auth.uid())));

-- 6.7 site_content_audit Policies
DROP POLICY IF EXISTS site_content_audit_select_policy ON public.site_content_audit;
CREATE POLICY site_content_audit_select_policy ON public.site_content_audit
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin(auth.uid()));

-- Explicitly remove direct client mutation privileges from canonical lead/audit/security tables.
REVOKE INSERT, UPDATE, DELETE ON public.leads FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lead_events FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_buckets FROM anon, authenticated;
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

-- 6.8 PUBLIC INGESTION RPC (SECURITY DEFINER)
-- Transactional lead capture with rate limiting, business unit derivation, and audit event creation.
CREATE OR REPLACE FUNCTION public.submit_lead_enquiry(
  p_company_slug TEXT,
  p_enquiry_type public.enquiry_type_enum,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_message TEXT,
  p_page_source TEXT DEFAULT '/contact',
  p_honeypot TEXT DEFAULT '',
  p_client_ip TEXT DEFAULT '0.0.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id UUID;
  v_rate_key TEXT;
  v_tokens INT;
  v_last_refill TIMESTAMPTZ;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_lead_id UUID;
  v_lead_number TEXT;
  v_business_unit public.business_unit_type;
BEGIN
  -- 1. Anti-spam honeypot check
  IF p_honeypot IS NOT NULL AND length(trim(p_honeypot)) > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Enquiry received successfully.',
      'lead_number', 'LEAD-DISCARDED'
    );
  END IF;

  -- 2. Input validation
  IF length(trim(p_name)) = 0 OR length(trim(p_email)) = 0 OR length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Validation error: Name, email, and message are required fields.';
  END IF;

  -- 3. Resolve target company
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE slug = p_company_slug AND is_active = true;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Invalid company configuration.';
  END IF;

  -- 4. Server-side Rate Limiting (Token Bucket: max 5 requests per IP per 10 minutes)
  v_rate_key := 'rate_limit:ip:' || coalesce(p_client_ip, '0.0.0.0');

  -- Initialize the bucket once, then lock the row for atomic token consumption.
  INSERT INTO public.rate_limit_buckets (key, tokens, last_refill)
  VALUES (v_rate_key, 5, v_now)
  ON CONFLICT (key) DO NOTHING;

  SELECT tokens, last_refill INTO v_tokens, v_last_refill
  FROM public.rate_limit_buckets
  WHERE key = v_rate_key
  FOR UPDATE;

  -- Refill 1 token per 2 minutes (120 seconds).
  IF extract(epoch from (v_now - v_last_refill)) >= 120 THEN
    v_tokens := LEAST(5, v_tokens + floor(extract(epoch from (v_now - v_last_refill)) / 120)::int);
    v_last_refill := v_now;
  END IF;

  IF v_tokens <= 0 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many enquiries submitted. Please wait a few minutes before trying again.';
  END IF;

  UPDATE public.rate_limit_buckets
  SET tokens = v_tokens - 1,
      last_refill = v_last_refill
  WHERE key = v_rate_key;

  -- 5. Derive business unit
  v_business_unit := public.derive_business_unit(p_enquiry_type);

  -- 6. Generate lead identifiers
  v_lead_id := gen_random_uuid();
  v_lead_number := public.generate_lead_number();

  -- 7. Transactional insertion into leads table
  INSERT INTO public.leads (
    id,
    lead_id,
    lead_number,
    company_id,
    business_unit,
    enquiry_type,
    name,
    email,
    phone,
    message,
    source,
    page_source,
    status,
    priority,
    metadata
  )
  VALUES (
    v_lead_id,
    v_lead_id,
    v_lead_number,
    v_company_id,
    v_business_unit,
    p_enquiry_type,
    trim(p_name),
    lower(trim(p_email)),
    trim(p_phone),
    trim(p_message),
    'WEBSITE',
    coalesce(p_page_source, '/contact'),
    'NEW'::public.lead_status_enum,
    'MEDIUM'::public.lead_priority_enum,
    jsonb_build_object('client_ip', p_client_ip, 'submitted_at', v_now)
  );

  -- 8. Record immutable lead event
  INSERT INTO public.lead_events (
    lead_id,
    company_id,
    actor_role,
    event_type,
    new_state,
    notes,
    metadata
  )
  VALUES (
    v_lead_id,
    v_company_id,
    'ANON',
    'ENQUIRY_SUBMITTED',
    jsonb_build_object(
      'lead_number', v_lead_number,
      'business_unit', v_business_unit,
      'enquiry_type', p_enquiry_type
    ),
    'Enquiry received via public website form',
    jsonb_build_object('client_ip', p_client_ip)
  );

  -- 9. Return safe response payload
  RETURN jsonb_build_object(
    'success', true,
    'lead_number', v_lead_number,
    'business_unit', v_business_unit,
    'message', 'Thank you. Your enquiry has been received and logged.'
  );
END;
$$;

-- Grant execution permissions on lead ingestion
REVOKE EXECUTE ON FUNCTION public.submit_lead_enquiry FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead_enquiry TO anon, authenticated, service_role;

-- 7. CONTROLLED LEAD MUTATION RPC
CREATE OR REPLACE FUNCTION public.admin_mutate_lead(
  p_lead_id UUID,
  p_status public.lead_status_enum DEFAULT NULL,
  p_priority public.lead_priority_enum DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role public.user_role_enum;
  v_company_id UUID;
  v_old_lead public.leads%ROWTYPE;
  v_new_lead public.leads%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_role := public.get_user_role(v_user_id);
  v_company_id := public.get_user_company_id(v_user_id);

  IF v_role IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user profile required.';
  END IF;

  SELECT * INTO v_old_lead
  FROM public.leads
  WHERE id = p_lead_id AND company_id = v_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or access denied.';
  END IF;

  IF v_old_lead.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify a soft-deleted lead.';
  END IF;

  IF p_assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_assigned_to
      AND company_id = v_company_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Assigned operator does not exist or belongs to another company.';
  END IF;

  UPDATE public.leads
  SET status = COALESCE(p_status, status),
      priority = COALESCE(p_priority, priority),
      assigned_to = CASE WHEN p_assigned_to IS NOT NULL THEN p_assigned_to ELSE assigned_to END,
      internal_notes = CASE WHEN p_internal_notes IS NOT NULL THEN p_internal_notes ELSE internal_notes END,
      metadata = CASE WHEN p_metadata IS NOT NULL THEN metadata || p_metadata ELSE metadata END,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_lead_id
  RETURNING * INTO v_new_lead;

  INSERT INTO public.lead_events (
    lead_id, company_id, actor_id, actor_role, event_type,
    old_state, new_state, notes, metadata
  ) VALUES (
    v_new_lead.id, v_company_id, v_user_id, v_role::text, 'MUTATED',
    to_jsonb(v_old_lead), to_jsonb(v_new_lead),
    'Lead fields updated',
    jsonb_build_object('mutation_by', v_user_id, 'role', v_role)
  );

  RETURN jsonb_build_object('success', true, 'lead', to_jsonb(v_new_lead));
END;
$$;

-- 7.1 Administrative soft-delete RPC
CREATE OR REPLACE FUNCTION public.admin_soft_delete_lead(
  p_lead_id UUID,
  p_reason TEXT DEFAULT 'Archived by administrator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role public.user_role_enum;
  v_company_id UUID;
  v_old_lead public.leads%ROWTYPE;
  v_updated_lead public.leads%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_role := public.get_user_role(v_user_id);
  v_company_id := public.get_user_company_id(v_user_id);

  IF v_role IS NULL OR v_company_id IS NULL OR v_role != 'ADMIN'::public.user_role_enum THEN
    RAISE EXCEPTION 'Permission denied: Only administrators can soft-delete leads.';
  END IF;

  SELECT * INTO v_old_lead
  FROM public.leads
  WHERE id = p_lead_id AND company_id = v_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or access denied.';
  END IF;

  IF v_old_lead.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Lead already soft-deleted.');
  END IF;

  UPDATE public.leads
  SET deleted_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_lead_id
  RETURNING * INTO v_updated_lead;

  INSERT INTO public.lead_events (
    lead_id, company_id, actor_id, actor_role, event_type,
    old_state, new_state, notes, metadata
  ) VALUES (
    v_updated_lead.id, v_company_id, v_user_id, 'ADMIN', 'SOFT_DELETED',
    to_jsonb(v_old_lead), to_jsonb(v_updated_lead),
    p_reason, jsonb_build_object('deleted_by', v_user_id)
  );

  RETURN jsonb_build_object('success', true, 'lead_id', v_updated_lead.lead_id);
END;
$$;

-- Explicit permissions for trusted lead mutation RPCs.
REVOKE EXECUTE ON FUNCTION public.admin_mutate_lead FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mutate_lead TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.admin_soft_delete_lead FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_lead TO authenticated, service_role;

-- 8. CONTROLLED SITE CONTENT MANAGEMENT RPC
CREATE OR REPLACE FUNCTION public.admin_update_site_content(
  p_content_key TEXT,
  p_content_value JSONB,
  p_is_published BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role public.user_role_enum;
  v_company_id UUID;
  v_old_row public.site_content%ROWTYPE;
  v_new_row public.site_content%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_role := public.get_user_role(v_user_id);
  v_company_id := public.get_user_company_id(v_user_id);

  IF v_role IS NULL OR v_role != 'ADMIN'::public.user_role_enum THEN
    RAISE EXCEPTION 'Permission denied: Only administrators can update site content.';
  END IF;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Permission denied: User profile is not associated with a valid company.';
  END IF;

  SELECT * INTO v_old_row
  FROM public.site_content
  WHERE company_id = v_company_id AND content_key = p_content_key;

  IF v_old_row.id IS NULL THEN
    INSERT INTO public.site_content (
      company_id,
      content_key,
      content_value,
      is_published,
      updated_by
    )
    VALUES (
      v_company_id,
      p_content_key,
      p_content_value,
      p_is_published,
      v_user_id
    )
    RETURNING * INTO v_new_row;
  ELSE
    UPDATE public.site_content
    SET content_value = p_content_value,
        is_published = p_is_published,
        updated_at = timezone('utc'::text, now()),
        updated_by = v_user_id
    WHERE id = v_old_row.id
    RETURNING * INTO v_new_row;
  END IF;

  INSERT INTO public.site_content_audit (
    company_id,
    content_key,
    old_value,
    new_value,
    updated_by
  )
  VALUES (
    v_company_id,
    p_content_key,
    v_old_row.content_value,
    p_content_value,
    v_user_id
  );

  RETURN row_to_json(v_new_row)::jsonb;
END;
$$;

-- Explicit permissions: Only authenticated users can invoke; anonymous access revoked
REVOKE EXECUTE ON FUNCTION public.admin_update_site_content FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_site_content TO authenticated, service_role;

-- 8. INITIAL DEFAULT SEED DATA (IF NOT EXISTS)
INSERT INTO public.companies (id, name, slug, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'Vardhan Techverse Private Limited',
  'vardhan-techverse',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Seed default ADMIN profile if user exists
INSERT INTO public.profiles (id, company_id, full_name, role, is_active)
SELECT
  id,
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'Master Administrator',
  'ADMIN'::public.user_role_enum,
  true
FROM auth.users
WHERE email = 'admin@vardhantechverse.com'
ON CONFLICT (id) DO NOTHING;

-- Seed default COMPANY_BRAND content key
INSERT INTO public.site_content (
  company_id,
  content_key,
  content_value,
  is_published,
  updated_by
)
SELECT
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'COMPANY_BRAND',
  jsonb_build_object(
    'logo_url', '/brand/vardhan-techverse-logo.jpg',
    'is_custom', false,
    'updated_at', timezone('utc'::text, now())
  ),
  true,
  id
FROM public.profiles
WHERE company_id = 'c0000000-0000-0000-0000-000000000001'::uuid AND role = 'ADMIN'::public.user_role_enum
LIMIT 1
ON CONFLICT (company_id, content_key) DO NOTHING;

-- 9. STORAGE BUCKET & POLICIES FOR COMPANY BRAND ASSETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-brand-assets',
  'company-brand-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public SELECT access to active logo assets
DROP POLICY IF EXISTS "Public Select Brand Assets" ON storage.objects;
CREATE POLICY "Public Select Brand Assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'company-brand-assets');

-- Policy 2: Authenticated ADMIN INSERT access restricted to tenant folder
DROP POLICY IF EXISTS "Admin Insert Brand Assets" ON storage.objects;
CREATE POLICY "Admin Insert Brand Assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-brand-assets'
  AND public.is_admin(auth.uid()) = true
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
);

-- Policy 3: Authenticated ADMIN UPDATE access restricted to tenant folder
DROP POLICY IF EXISTS "Admin Update Brand Assets" ON storage.objects;
CREATE POLICY "Admin Update Brand Assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-brand-assets'
  AND public.is_admin(auth.uid()) = true
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
)
WITH CHECK (
  bucket_id = 'company-brand-assets'
  AND public.is_admin(auth.uid()) = true
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
);

-- Policy 4: Authenticated ADMIN DELETE access restricted to tenant folder
DROP POLICY IF EXISTS "Admin Delete Brand Assets" ON storage.objects;
CREATE POLICY "Admin Delete Brand Assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'company-brand-assets'
  AND public.is_admin(auth.uid()) = true
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
);

-- 10. SECURITY ADVISOR REMEDIATION (IF INTERNAL FUNCTION EXISTS)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE proname = 'rls_auto_enable' AND nspname = 'public'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
  END IF;
END
$$;
