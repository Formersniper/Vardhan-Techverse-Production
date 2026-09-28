import { CreateEnquiryInput, EnquiryResponse, Lead, BusinessUnit, LeadStatus } from '../types/contracts.ts';
import { supabase } from '../lib/supabase.ts';

export async function submitEnquiry(input: CreateEnquiryInput): Promise<EnquiryResponse> {
  const { data, error } = await supabase.functions.invoke('submit-enquiry', {
    body: input,
  });

  if (error) {
    // Fallback: if Edge function is not deployed in test environment, call submit_lead_enquiry RPC if allowed or return formatted success/error
    console.warn('[submitEnquiry] Edge Function invocation error:', error.message);
    throw new Error(error.message || 'Something went wrong while submitting your enquiry. Please try again.');
  }

  return data;
}

export async function fetchAdminEnquiries(filters?: {
  business_unit?: BusinessUnit;
  status?: LeadStatus;
  search?: string;
}): Promise<{ success: boolean; leads: any[] }> {
  let query = (supabase as any).from('leads').select('*').order('created_at', { ascending: false });

  if (filters?.business_unit) query = query.eq('business_unit', filters.business_unit);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,lead_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Fetch enquiries error:', error);
    return { success: false, leads: [] };
  }

  return { success: true, leads: data || [] };
}

export async function updateAdminEnquiry(
  leadId: string,
  updates: {
    status?: LeadStatus;
    internal_notes?: string;
    priority?: string;
  }
): Promise<{ success: boolean; lead?: any; message?: string }> {
  const { data, error } = await (supabase as any).rpc('admin_mutate_lead', {
    p_lead_id: leadId,
    p_status: updates.status,
    p_priority: updates.priority,
    p_internal_notes: updates.internal_notes,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update enquiry');
  }

  return data;
}
