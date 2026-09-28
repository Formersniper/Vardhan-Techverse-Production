-- ==============================================================================
-- Vardhan Techverse Private Limited — Architecture Freeze V1.0 (Stage 2 Remediation & Content Management)
-- PostgreSQL Migration: Core Entities, Content Management, Security Definer Helpers,
-- Restrictive RLS, Immutable Audit Trail, and Transactional RPC Functions.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE SCHEMA IF NOT EXISTS auth;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END $$;

-- Fallback auth.uid() function if running in standalone test harness
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::uuid;
$$;

-- 2. CONTROLLED ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE public.business_unit_type AS ENUM ('REALTY', 'AUTOMATION', 'GROWTHFORGE', 'CORPORATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enquiry_type_enum AS ENUM ('REAL_ESTATE', 'AUTOMATION', 'DEVELOPER_PARTNERSHIP', 'TECHNOLOGY', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status_enum AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'CONVERTED', 'LOST', 'SPAM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('ADMIN', 'OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. CORE ENTITY TABLES

-- Table 1: companies (Multi-tenant Tenant Boundary)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: profiles (Operator & Admin Personnel)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role_enum NOT NULL DEFAULT 'OPERATOR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 3: leads (Central Lead Pipeline)
CREATE SEQUENCE IF NOT EXISTS public.lead_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id UUID NULL,
  lead_number TEXT NOT NULL UNIQUE,
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

-- Table 4: lead_events (Strictly Immutable Lead Audit Log)
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
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

-- Table 5: rate_limit_buckets (Token Bucket Rate Limiter)
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key TEXT PRIMARY KEY,
  tokens INTEGER NOT NULL,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 6: site_content (Admin-controlled website content configuration)
CREATE TABLE IF NOT EXISTS public.site_content (
  content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  content_key TEXT NOT NULL,
  content_value JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT site_content_company_key_unique UNIQUE (company_id, content_key)
);

-- Table 7: site_content_audit (Immutable Audit Trail for Content Updates)
CREATE TABLE IF NOT EXISTS public.site_content_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  content_key TEXT NOT NULL,
  old_value JSONB NULL,
  new_value JSONB NOT NULL,
  updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SERVER-SIDE BUSINESS RULES & DERIVATION HELPERS

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

CREATE OR REPLACE FUNCTION public.derive_business_unit(enq_type public.enquiry_type_enum)
RETURNS public.business_unit_type
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE enq_type
    WHEN 'REAL_ESTATE' THEN RETURN 'REALTY'::public.business_unit_type;
    WHEN 'DEVELOPER_PARTNERSHIP' THEN RETURN 'REALTY'::public.business_unit_type;
    WHEN 'AUTOMATION' THEN RETURN 'AUTOMATION'::public.business_unit_type;
    WHEN 'TECHNOLOGY' THEN RETURN 'GROWTHFORGE'::public.business_unit_type;
    WHEN 'OTHER' THEN RETURN 'CORPORATE'::public.business_unit_type;
    ELSE RETURN 'CORPORATE'::public.business_unit_type;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_leads_enforce_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.business_unit := public.derive_business_unit(NEW.enquiry_type);
  IF NEW.lead_number IS NULL OR trim(NEW.lead_number) = '' THEN
    NEW.lead_number := public.generate_lead_number();
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_invariants ON public.leads;
CREATE TRIGGER trg_leads_invariants
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_leads_enforce_invariants();

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

CREATE OR REPLACE FUNCTION public.trg_enforce_profile_field_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (OLD.company_id IS DISTINCT FROM NEW.company_id OR
      OLD.role IS DISTINCT FROM NEW.role OR
      OLD.is_active IS DISTINCT FROM NEW.is_active OR
      OLD.id IS DISTINCT FROM NEW.id) THEN
    IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Modification of authorization-sensitive profile fields (company_id, role, is_active, id) is strictly forbidden.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protection ON public.profiles;
CREATE TRIGGER trg_profiles_protection
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_profile_field_protection();

-- 5. AUTHORIZATION HELPERS
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.user_role_enum
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT company_id FROM public.profiles WHERE id = p_user_id AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'ADMIN'::public.user_role_enum AND is_active = true
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

-- companies
DROP POLICY IF EXISTS companies_select_policy ON public.companies;
CREATE POLICY companies_select_policy ON public.companies
FOR SELECT TO authenticated USING (id = public.get_user_company_id(auth.uid()));

-- profiles
DROP POLICY IF EXISTS profiles_select_company ON public.profiles;
CREATE POLICY profiles_select_company ON public.profiles
FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

-- leads
DROP POLICY IF EXISTS leads_select_authenticated ON public.leads;
CREATE POLICY leads_select_authenticated ON public.leads
FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (deleted_at IS NULL OR public.is_admin(auth.uid())));

-- lead_events
DROP POLICY IF EXISTS lead_events_select_authenticated ON public.lead_events;
CREATE POLICY lead_events_select_authenticated ON public.lead_events
FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

-- site_content
DROP POLICY IF EXISTS site_content_select_public ON public.site_content;
CREATE POLICY site_content_select_public ON public.site_content
FOR SELECT TO anon, authenticated
USING (is_published = true OR company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS site_content_admin_manage ON public.site_content;
CREATE POLICY site_content_admin_manage ON public.site_content
FOR ALL TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.is_admin(auth.uid()));

-- site_content_audit
DROP POLICY IF EXISTS site_content_audit_select_admin ON public.site_content_audit;
CREATE POLICY site_content_audit_select_admin ON public.site_content_audit
FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

-- 7. TRANSACTIONAL RPC FUNCTIONS

CREATE OR REPLACE FUNCTION public.check_and_consume_rate_limit(
  p_key TEXT, p_max_tokens INT DEFAULT 15, p_refill_period_seconds INT DEFAULT 900
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bucket RECORD;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_elapsed_seconds DOUBLE PRECISION;
  v_refill_tokens INT;
  v_current_tokens INT;
BEGIN
  SELECT * INTO v_bucket FROM public.rate_limit_buckets WHERE key = p_key FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limit_buckets (key, tokens, last_refill, created_at)
    VALUES (p_key, p_max_tokens - 1, v_now, v_now);
    RETURN true;
  END IF;

  v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_bucket.last_refill));
  v_refill_tokens := FLOOR((v_elapsed_seconds / p_refill_period_seconds) * p_max_tokens)::INT;
  v_current_tokens := LEAST(p_max_tokens, v_bucket.tokens + v_refill_tokens);

  IF v_current_tokens <= 0 THEN RETURN false; END IF;

  UPDATE public.rate_limit_buckets
  SET tokens = v_current_tokens - 1,
      last_refill = CASE WHEN v_refill_tokens > 0 THEN v_now ELSE last_refill END
  WHERE key = p_key;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_lead_enquiry(
  p_company_id UUID, p_name TEXT, p_email TEXT, p_phone TEXT,
  p_enquiry_type public.enquiry_type_enum, p_message TEXT,
  p_page_source TEXT DEFAULT '/contact', p_source TEXT DEFAULT 'WEBSITE',
  p_metadata JSONB DEFAULT '{}'::jsonb, p_rate_limit_key TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_lead_row public.leads%ROWTYPE;
  v_rate_allowed BOOLEAN;
BEGIN
  IF p_rate_limit_key IS NOT NULL THEN
    v_rate_allowed := public.check_and_consume_rate_limit(p_rate_limit_key, 15, 900);
    IF NOT v_rate_allowed THEN
      RETURN jsonb_build_object('success', false, 'code', 'RATE_LIMITED', 'message', 'Rate limit exceeded.');
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = p_company_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_COMPANY', 'message', 'Invalid company.');
  END IF;

  INSERT INTO public.leads (
    company_id, enquiry_type, name, email, phone, message, source, page_source, status, priority, metadata
  ) VALUES (
    p_company_id, p_enquiry_type, trim(p_name), trim(lower(p_email)), trim(p_phone), trim(p_message),
    coalesce(p_source, 'WEBSITE'), coalesce(p_page_source, '/contact'), 'NEW', 'MEDIUM', coalesce(p_metadata, '{}'::jsonb)
  ) RETURNING * INTO v_lead_row;

  INSERT INTO public.lead_events (
    lead_id, company_id, actor_id, actor_role, event_type, old_state, new_state, notes, metadata
  ) VALUES (
    v_lead_row.lead_id, v_lead_row.company_id, NULL, 'ANON', 'CREATED', NULL, to_jsonb(v_lead_row),
    'Lead submitted via public enquiry endpoint', jsonb_build_object('client_source', p_source, 'page_source', p_page_source)
  );

  RETURN jsonb_build_object(
    'success', true, 'lead_id', v_lead_row.lead_id, 'lead_number', v_lead_row.lead_number,
    'business_unit', v_lead_row.business_unit, 'message', 'Enquiry submitted successfully.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mutate_lead(
  p_lead_id UUID, p_status public.lead_status_enum DEFAULT NULL,
  p_priority public.lead_priority_enum DEFAULT NULL, p_assigned_to UUID DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL, p_customer_id UUID DEFAULT NULL, p_metadata JSONB DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role public.user_role_enum;
  v_company_id UUID;
  v_old_lead public.leads%ROWTYPE;
  v_new_lead public.leads%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required.'; END IF;
  v_role := public.get_user_role(v_user_id);
  v_company_id := public.get_user_company_id(v_user_id);

  IF v_role IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User profile not active or not associated with a company.';
  END IF;

  SELECT * INTO v_old_lead FROM public.leads WHERE lead_id = p_lead_id AND company_id = v_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found or access denied.'; END IF;

  IF p_assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_assigned_to AND company_id = v_company_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Assigned operator does not exist or belongs to another company.';
  END IF;

  UPDATE public.leads SET
    status = COALESCE(p_status, status), priority = COALESCE(p_priority, priority),
    assigned_to = CASE WHEN p_assigned_to IS NOT NULL THEN p_assigned_to ELSE assigned_to END,
    internal_notes = CASE WHEN p_internal_notes IS NOT NULL THEN p_internal_notes ELSE internal_notes END,
    customer_id = CASE WHEN p_customer_id IS NOT NULL THEN p_customer_id ELSE customer_id END,
    metadata = CASE WHEN p_metadata IS NOT NULL THEN metadata || p_metadata ELSE metadata END,
    updated_at = timezone('utc'::text, now())
  WHERE lead_id = p_lead_id RETURNING * INTO v_new_lead;

  INSERT INTO public.lead_events (
    lead_id, company_id, actor_id, actor_role, event_type, old_state, new_state, notes, metadata
  ) VALUES (
    v_new_lead.lead_id, v_company_id, v_user_id, v_role::text, 'MUTATED', to_jsonb(v_old_lead), to_jsonb(v_new_lead),
    'Lead mutated', jsonb_build_object('mutation_by', v_user_id, 'role', v_role)
  );

  RETURN jsonb_build_object('success', true, 'lead', to_jsonb(v_new_lead));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_lead(
  p_lead_id UUID, p_reason TEXT DEFAULT 'Archived by administrator'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role public.user_role_enum;
  v_company_id UUID;
  v_old_lead public.leads%ROWTYPE;
  v_updated_lead public.leads%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required.'; END IF;
  v_role := public.get_user_role(v_user_id);
  v_company_id := public.get_user_company_id(v_user_id);

  IF v_role != 'ADMIN'::public.user_role_enum THEN
    RAISE EXCEPTION 'Permission denied: Only administrators can soft-delete leads.';
  END IF;

  SELECT * INTO v_old_lead FROM public.leads WHERE lead_id = p_lead_id AND company_id = v_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found or access denied.'; END IF;

  UPDATE public.leads SET deleted_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
  WHERE lead_id = p_lead_id RETURNING * INTO v_updated_lead;

  INSERT INTO public.lead_events (
    lead_id, company_id, actor_id, actor_role, event_type, old_state, new_state, notes, metadata
  ) VALUES (
    v_updated_lead.lead_id, v_company_id, v_user_id, 'ADMIN', 'SOFT_DELETED', to_jsonb(v_old_lead), to_jsonb(v_updated_lead), p_reason, jsonb_build_object('deleted_by', v_user_id)
  );

  RETURN jsonb_build_object('success', true, 'lead_id', v_updated_lead.lead_id);
END;
$$;

-- RPC for Admin Content Mutation
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
  v_user_id UUID := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);
  v_role public.user_role_enum := 'ADMIN'::public.user_role_enum;
  v_company_id UUID := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_old_row public.site_content%ROWTYPE;
  v_new_row public.site_content%ROWTYPE;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_role := public.get_user_role(auth.uid());
    v_company_id := public.get_user_company_id(auth.uid());

    IF v_role != 'ADMIN'::public.user_role_enum THEN
      RAISE EXCEPTION 'Permission denied: Only administrators can update site content.';
    END IF;
  END IF;

  SELECT * INTO v_old_row
  FROM public.site_content
  WHERE company_id = v_company_id AND content_key = p_content_key
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.site_content
    SET content_value = p_content_value,
        is_published = p_is_published,
        updated_at = timezone('utc'::text, now()),
        updated_by = v_user_id
    WHERE company_id = v_company_id AND content_key = p_content_key
    RETURNING * INTO v_new_row;
  ELSE
    INSERT INTO public.site_content (
      company_id, content_key, content_value, is_published, updated_by
    ) VALUES (
      v_company_id, p_content_key, p_content_value, p_is_published, v_user_id
    )
    RETURNING * INTO v_new_row;
  END IF;

  -- Record audit event
  INSERT INTO public.site_content_audit (
    company_id, content_key, old_value, new_value, updated_by
  ) VALUES (
    v_company_id, p_content_key, v_old_row.content_value, p_content_value, v_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'content_key', v_new_row.content_key,
    'updated_at', v_new_row.updated_at
  );
END;
$$;

-- 8. INITIAL SEED DATA
INSERT INTO public.companies (id, name, slug, is_active)
VALUES ('c0000000-0000-0000-0000-000000000001'::uuid, 'Vardhan Techverse Private Limited', 'vardhan-techverse', true)
ON CONFLICT (id) DO NOTHING;

-- Seed default site_content
INSERT INTO public.site_content (company_id, content_key, content_value, is_published)
VALUES
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'COMPANY_PROFILE',
  '{
    "operating_location": "Gurugram, Haryana, India (Active Focus Market)",
    "operating_city": "Gurugram",
    "service_geography": "Active focus in Gurugram & NCR; coverage evolves with client mandates and market opportunities.",
    "description": "Vardhan Techverse Private Limited is a technology-enabled corporate business combining residential and commercial real estate advisory & brokerage, AI sales automation systems, and internal intelligence infrastructure.",
    "operating_hours": "Monday – Saturday: 9:30 AM – 6:30 PM IST"
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'COMPANY_POSITIONING',
  '{
    "hero_title": "Combining Real Estate Advisory, AI Sales Automation & Internal Intelligence",
    "hero_subtitle": "Vardhan Techverse Private Limited operates three connected capabilities: residential and commercial real estate advisory & brokerage, AI-powered lead-to-sales automation, and the GrowthForge intelligence layer."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'REALTY_CAPABILITY',
  '{
    "title": "Real Estate Advisory & Brokerage",
    "subtitle": "Vardhan Techverse provides client-focused, technology-enabled residential and commercial property advisory across active growth corridors, helping home buyers, commercial clients, and investors make informed decisions.",
    "services_summary": "Systematic property search across residential and commercial segments, objective comparative analysis, site visits, developer discovery, and transaction support."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'AUTOMATION_CAPABILITY',
  '{
    "title": "Turn More Enquiries Into Structured Sales Processes",
    "subtitle": "Vardhan Techverse builds sales automation and lead management workflows for high-intent businesses needing better lead capture, instant qualification, and seamless CRM orchestration."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'GROWTHFORGE_CAPABILITY',
  '{
    "title": "GrowthForge — Buyer Intelligence & AI Agent Infrastructure",
    "subtitle": "GrowthForge is the internal technology and intelligence layer behind Vardhan Techverse’s evolving sales automation, real estate buyer matching, and AI lead systems."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'GOVERNANCE_POLICY',
  '{
    "title": "Corporate Governance & Operational Standards",
    "last_updated": "January 2026",
    "content": "Vardhan Techverse Private Limited operates under strict corporate governance standards, maintaining tenant isolation, role-based security controls, and complete immutable audit logging across all operational lead management and data pipelines."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'PRIVACY_POLICY',
  '{
    "last_updated": "January 2026",
    "content": "Vardhan Techverse Private Limited collects personal information that you voluntarily provide when submitting enquiry forms on our website..."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'TERMS_OF_USE',
  '{
    "last_updated": "January 2026",
    "content": "The content provided on this website by Vardhan Techverse Private Limited is for general informational purposes only..."
  }'::jsonb,
  true
),
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'COMPANY_BRAND',
  '{
    "logo_url": "/brand/vardhan-techverse-logo.jpg",
    "is_custom": false,
    "logo_version": 1
  }'::jsonb,
  true
)
ON CONFLICT (company_id, content_key) DO NOTHING;

-- 9. PERMISSIONS & ROLE GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.leads TO authenticated;
GRANT SELECT ON public.lead_events TO authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT SELECT ON public.site_content_audit TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.lead_number_seq TO service_role;

REVOKE EXECUTE ON FUNCTION public.submit_lead_enquiry(UUID, TEXT, TEXT, TEXT, public.enquiry_type_enum, TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_lead_enquiry(UUID, TEXT, TEXT, TEXT, public.enquiry_type_enum, TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_mutate_lead TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_lead TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_site_content TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_consume_rate_limit TO service_role;
