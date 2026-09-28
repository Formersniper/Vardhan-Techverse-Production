/**
 * Vardhan Techverse Private Limited
 * Shared Data Contracts & Controlled Enums (V1.0 Architecture Freeze)
 * 
 * NOTE: Shared across Project 1 (Website) and Project 2 (Accounting System).
 * All primary identifiers must be immutable, server-generated UUIDs.
 */

// =============================================================================
// CONTROLLED ENUMS
// =============================================================================

/**
 * Controlled Business Unit Enum
 * Brand names and product names roll up into these stable organizational units.
 */
export const BusinessUnit = {
  REALTY: 'REALTY',
  AUTOMATION: 'AUTOMATION',
  GROWTHFORGE: 'GROWTHFORGE',
  CORPORATE: 'CORPORATE',
} as const;

export type BusinessUnitType = typeof BusinessUnit[keyof typeof BusinessUnit];

/**
 * Controlled Enquiry Classification Types
 */
export const EnquiryType = {
  REAL_ESTATE: 'REAL_ESTATE',
  AUTOMATION: 'AUTOMATION',
  DEVELOPER_PARTNERSHIP: 'DEVELOPER_PARTNERSHIP',
  TECHNOLOGY: 'TECHNOLOGY',
  OTHER: 'OTHER',
} as const;

export type EnquiryTypeEnum = typeof EnquiryType[keyof typeof EnquiryType];

/**
 * Controlled Lead Lifecycle Statuses
 */
export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  IN_PROGRESS: 'IN_PROGRESS',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
  SPAM: 'SPAM',
} as const;

export type LeadStatusEnum = typeof LeadStatus[keyof typeof LeadStatus];

/**
 * Controlled Lead Operational Priorities
 */
export const LeadPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type LeadPriorityEnum = typeof LeadPriority[keyof typeof LeadPriority];

/**
 * Controlled Administrative User Roles
 */
export const UserRole = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
} as const;

export type UserRoleEnum = typeof UserRole[keyof typeof UserRole];

// =============================================================================
// BUSINESS UNIT DERIVATION MAPPING
// =============================================================================

/**
 * Authoritative Server-Side Business Unit Mapping
 * 
 * Rules:
 * REAL_ESTATE             -> REALTY
 * DEVELOPER_PARTNERSHIP   -> REALTY
 * AUTOMATION              -> AUTOMATION
 * TECHNOLOGY              -> GROWTHFORGE
 * OTHER                   -> CORPORATE
 * 
 * Public visitors must NEVER directly assign themselves to CORPORATE.
 */
export function deriveBusinessUnit(enquiryType: EnquiryTypeEnum): BusinessUnitType {
  switch (enquiryType) {
    case EnquiryType.REAL_ESTATE:
    case EnquiryType.DEVELOPER_PARTNERSHIP:
      return BusinessUnit.REALTY;
    case EnquiryType.AUTOMATION:
      return BusinessUnit.AUTOMATION;
    case EnquiryType.TECHNOLOGY:
      return BusinessUnit.GROWTHFORGE;
    case EnquiryType.OTHER:
    default:
      return BusinessUnit.CORPORATE;
  }
}

// =============================================================================
// COMMON IDENTIFIER CONTRACT (FROZEN)
// =============================================================================

/**
 * Canonical Shared Identifiers across Website and future Accounting System.
 * All core IDs are UUIDs.
 */
export interface CommonEntityIdentifiers {
  company_id: string;        // UUID
  customer_id: string | null; // UUID (Nullable on initial lead creation)
  lead_id: string;           // UUID (Primary key for lead record)
  invoice_id?: string;       // UUID (Reserved for Project 2 - Accounting)
  transaction_id?: string;   // UUID (Reserved for Project 2 - Accounting)
  business_unit: BusinessUnitType;
}

/**
 * Human-readable operational reference contract.
 * Primary key remains lead_id UUID; lead_number is for operator reference.
 * Format: LEAD-YYYY-NNNNN
 */
export type LeadNumber = `LEAD-${number}-${string}`;

// =============================================================================
// OPERATIONAL LEAD INTERFACE (CONTRACT ONLY - STAGE 1)
// =============================================================================

export interface LeadContract extends CommonEntityIdentifiers {
  lead_number: string;
  enquiry_type: EnquiryTypeEnum;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  page_source: string;
  status: LeadStatusEnum;
  priority: LeadPriorityEnum;
  assigned_to: string | null; // references auth.users(id)
  internal_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string; // ISO 8601 UTC
  updated_at: string; // ISO 8601 UTC
  deleted_at: string | null; // Soft-delete timestamp (ADMIN only)
}

/**
 * Stage 2+ Boundary Marker:
 * The following database tables, migrations, RLS policies, Edge Functions,
 * and auth workflows belong to Stage 2 and beyond.
 */
export const STAGE_2_BOUNDARY = {
  SUPABASE_SCHEMA: 'STAGE_2_PENDING',
  EDGE_FUNCTIONS: 'STAGE_2_PENDING',
  AUTHENTICATION: 'STAGE_2_PENDING',
  NOTIFICATIONS: 'STAGE_2_PENDING',
} as const;
