/**
 * @file database.ts
 * @description Supabase Database TypeScript definitions for Vardhan Techverse V1.0
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessUnitType = 'REALTY' | 'AUTOMATION' | 'GROWTHFORGE' | 'CORPORATE';
export type EnquiryTypeEnum = 'REAL_ESTATE' | 'AUTOMATION' | 'DEVELOPER_PARTNERSHIP' | 'TECHNOLOGY' | 'OTHER';
export type LeadStatusEnum = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST' | 'SPAM';
export type LeadPriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type UserRoleEnum = 'ADMIN' | 'OPERATOR';

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          full_name: string;
          role: UserRoleEnum;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          email: string;
          full_name: string;
          role?: UserRoleEnum;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          full_name?: string;
          role?: UserRoleEnum;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          lead_id: string;
          company_id: string;
          customer_id: string | null;
          lead_number: string;
          business_unit: BusinessUnitType;
          enquiry_type: EnquiryTypeEnum;
          name: string;
          email: string;
          phone: string;
          message: string;
          source: string;
          page_source: string;
          status: LeadStatusEnum;
          priority: LeadPriorityEnum;
          assigned_to: string | null;
          internal_notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          lead_id?: string;
          company_id: string;
          customer_id?: string | null;
          lead_number?: string;
          business_unit?: BusinessUnitType;
          enquiry_type: EnquiryTypeEnum;
          name: string;
          email: string;
          phone: string;
          message: string;
          source?: string;
          page_source?: string;
          status?: LeadStatusEnum;
          priority?: LeadPriorityEnum;
          assigned_to?: string | null;
          internal_notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          lead_id?: string;
          company_id?: string;
          customer_id?: string | null;
          lead_number?: string;
          business_unit?: BusinessUnitType;
          enquiry_type?: EnquiryTypeEnum;
          name?: string;
          email?: string;
          phone?: string;
          message?: string;
          source?: string;
          page_source?: string;
          status?: LeadStatusEnum;
          priority?: LeadPriorityEnum;
          assigned_to?: string | null;
          internal_notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      lead_events: {
        Row: {
          id: string;
          lead_id: string;
          company_id: string;
          actor_id: string | null;
          actor_role: 'ADMIN' | 'OPERATOR' | 'SYSTEM' | 'ANON';
          event_type: string;
          old_state: Json | null;
          new_state: Json | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          company_id: string;
          actor_id?: string | null;
          actor_role: 'ADMIN' | 'OPERATOR' | 'SYSTEM' | 'ANON';
          event_type: string;
          old_state?: Json | null;
          new_state?: Json | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
      };
      rate_limit_buckets: {
        Row: {
          key: string;
          tokens: number;
          last_refill: string;
          created_at: string;
        };
        Insert: {
          key: string;
          tokens: number;
          last_refill?: string;
          created_at?: string;
        };
        Update: {
          key?: string;
          tokens?: number;
          last_refill?: string;
          created_at?: string;
        };
      };
      site_content: {
        Row: {
          content_id: string;
          company_id: string;
          content_key: string;
          content_value: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          content_id?: string;
          company_id: string;
          content_key: string;
          content_value: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content_id?: string;
          company_id?: string;
          content_key?: string;
          content_value?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      site_content_audit: {
        Row: {
          id: string;
          company_id: string;
          content_key: string;
          old_value: Json | null;
          new_value: Json;
          updated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          content_key: string;
          old_value?: Json | null;
          new_value: Json;
          updated_by?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Functions: {
      submit_lead_enquiry: {
        Args: {
          p_company_id: string;
          p_name: string;
          p_email: string;
          p_phone: string;
          p_enquiry_type: EnquiryTypeEnum;
          p_message: string;
          p_page_source?: string;
          p_source?: string;
          p_metadata?: Json;
          p_rate_limit_key?: string;
        };
        Returns: Json;
      };
      admin_mutate_lead: {
        Args: {
          p_lead_id: string;
          p_status?: LeadStatusEnum;
          p_priority?: LeadPriorityEnum;
          p_assigned_to?: string;
          p_internal_notes?: string;
          p_customer_id?: string;
          p_metadata?: Json;
        };
        Returns: Json;
      };
      admin_soft_delete_lead: {
        Args: {
          p_lead_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      admin_update_site_content: {
        Args: {
          p_content_key: string;
          p_content_value: Json;
          p_is_published?: boolean;
        };
        Returns: Json;
      };
      check_and_consume_rate_limit: {
        Args: {
          p_key: string;
          p_max_tokens?: number;
          p_refill_period_seconds?: number;
        };
        Returns: boolean;
      };
    };
  };
}
