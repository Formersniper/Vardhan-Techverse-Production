import { supabase } from './supabase';

export interface CompanyProfileContent {
  operating_location: string;
  operating_city: string;
  service_geography: string;
  description: string;
  operating_hours: string;
}

export interface CompanyPositioningContent {
  hero_title: string;
  hero_subtitle: string;
}

export interface CapabilityContent {
  title: string;
  subtitle: string;
  services_summary?: string;
}

export interface PolicyContent {
  title?: string;
  last_updated: string;
  content: string;
}

// Pre-defined safe fallbacks to guarantee pages render smoothly if DB is offline
export const DEFAULT_SITE_CONTENT: Record<string, any> = {
  COMPANY_PROFILE: {
    operating_location: 'Gurugram, Haryana, India',
    operating_city: 'Gurugram',
    service_geography: 'Active focus in Gurugram & NCR; coverage evolves with client mandates and market opportunities.',
    description:
      'Vardhan Techverse Private Limited is a technology-enabled corporate business combining residential and commercial real estate advisory & brokerage, AI sales automation systems, and internal intelligence infrastructure.',
    operating_hours: 'Monday – Saturday: 9:30 AM – 6:30 PM IST',
  },
  COMPANY_POSITIONING: {
    hero_title: 'Combining Real Estate Advisory, AI Sales Automation & Internal Intelligence',
    hero_subtitle:
      'Vardhan Techverse Private Limited operates three connected capabilities: residential and commercial real estate advisory & brokerage, AI-powered lead-to-sales automation, and the GrowthForge intelligence layer.',
  },
  REALTY_CAPABILITY: {
    title: 'Real Estate Advisory & Brokerage',
    subtitle:
      'Vardhan Techverse provides client-focused, technology-enabled residential and commercial property advisory across active growth corridors, helping home buyers, commercial clients, and investors make informed decisions.',
    services_summary:
      'Systematic property search across residential and commercial segments, objective comparative analysis, site visits, developer discovery, and transaction support.',
  },
  AUTOMATION_CAPABILITY: {
    title: 'Turn More Enquiries Into Structured Sales Processes',
    subtitle:
      'Vardhan Techverse builds sales automation and lead management workflows for high-intent businesses needing better lead capture, instant qualification, and seamless CRM orchestration.',
  },
  GROWTHFORGE_CAPABILITY: {
    title: 'GrowthForge — Buyer Intelligence & AI Agent Infrastructure',
    subtitle:
      'GrowthForge is the internal technology and intelligence layer behind Vardhan Techverse’s evolving sales automation, real estate buyer matching, and AI lead systems.',
  },
  GOVERNANCE_POLICY: {
    title: 'Corporate Governance & Operational Standards',
    last_updated: 'January 2026',
    content:
      'Vardhan Techverse Private Limited operates under strict corporate governance standards, maintaining tenant isolation, role-based security controls, and complete immutable audit logging across operational lead management pipelines.',
  },
  PRIVACY_POLICY: {
    last_updated: 'January 2026',
    content:
      'Vardhan Techverse Private Limited collects personal information that you voluntarily provide when submitting enquiry forms on our website. This includes your full name, email address, telephone number, enquiry category, and message details. We process your personal information exclusively for legitimate corporate purposes, including responding to your specific real estate advisory or business automation enquiry, assigning your request to qualified internal personnel, generating unique tracking references, and ensuring system security through reasonable administrative and technical safeguards.',
  },
  TERMS_OF_USE: {
    last_updated: 'January 2026',
    content:
      'The content provided on this website by Vardhan Techverse Private Limited is for general informational purposes only. While we endeavor to keep property insights and automation capability descriptions accurate, content does not constitute a binding legal offer or financial guarantee. Submitting an enquiry does not guarantee property allotment until formal agreement execution.',
  },
  COMPANY_BRAND: {
    logo_url: '/brand/vardhan-techverse-logo.jpg',
    is_custom: false,
    logo_version: 1,
  },
};

/**
 * Fetch controlled content keys from Supabase with predefined static default fallbacks.
 * Resolution order:
 * 1. Published Supabase site_content
 * 2. Static DEFAULT_SITE_CONTENT fallback if Supabase is unavailable
 */
export async function getSiteContent(): Promise<Record<string, any>> {
  const result = { ...DEFAULT_SITE_CONTENT };

  try {
    const { data, error } = await (supabase as any)
      .from('site_content')
      .select('content_key, content_value')
      .eq('is_published', true);

    if (!error && data && data.length > 0) {
      data.forEach((item: { content_key: string; content_value: any }) => {
        if (item.content_key && item.content_value) {
          result[item.content_key] = item.content_value;
        }
      });
    }
  } catch (err) {
    console.warn('[getSiteContent] Failed to fetch content from Supabase, using defaults:', err);
  }

  return result;
}

/**
 * Admin API call to update controlled site content key via authenticated Supabase RPC.
 */
export async function updateSiteContent(
  contentKey: string,
  contentValue: any,
  isPublished: boolean = true
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await (supabase as any).rpc('admin_update_site_content', {
      p_content_key: contentKey,
      p_content_value: contentValue,
      p_is_published: isPublished,
    });

    if (error) {
      console.error('[updateSiteContent] RPC error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to update site content in database.',
      };
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vt_brand_updated'));
    }

    return { success: true, message: 'Site content key updated successfully.' };
  } catch (err: any) {
    console.error('[updateSiteContent] Remote RPC call failed:', err);
    return {
      success: false,
      message: err?.message || 'Remote RPC execution failed.',
    };
  }
}
