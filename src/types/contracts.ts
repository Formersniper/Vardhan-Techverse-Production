/**
 * @file contracts.ts
 * @description Common Data Contract for Vardhan Techverse Private Limited
 * Frozen data models, controlled enums, and shared entity definitions.
 */

export type BusinessUnit = 'REALTY' | 'AUTOMATION' | 'GROWTHFORGE' | 'CORPORATE';

export type EnquiryType = 
  | 'REAL_ESTATE' 
  | 'AUTOMATION' 
  | 'DEVELOPER_PARTNERSHIP' 
  | 'TECHNOLOGY' 
  | 'OTHER';

export type LeadStatus = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'QUALIFIED' 
  | 'IN_PROGRESS' 
  | 'CONVERTED' 
  | 'LOST' 
  | 'SPAM';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Lead Entity Model (Section 22 Specification)
 */
export interface Lead {
  id: string; // Database internal UUID
  lead_id: string; // Immutable business UUID
  company_id: string; // Parent company UUID
  customer_id: string | null; // Populated only post-qualification
  lead_number: string; // Human-readable business code (e.g. LEAD-2026-00001)
  business_unit: BusinessUnit;
  enquiry_type: EnquiryType;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  page_source: string;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to: string | null;
  internal_notes: string | null;
  metadata: Record<string, any>;
  created_at: string; // UTC ISO 8601 string
  updated_at: string; // UTC ISO 8601 string
  deleted_at: string | null;
}

export interface CreateEnquiryInput {
  name: string;
  email: string;
  phone: string;
  enquiry_type: EnquiryType;
  message: string;
  page_source?: string;
  metadata?: Record<string, any>;
  // Anti-spam honeypot (must remain empty)
  website_url_check?: string;
}

export interface EnquiryResponse {
  success: boolean;
  lead_id?: string;
  lead_number?: string;
  business_unit?: string;
  message: string;
  errors?: string[];
}
