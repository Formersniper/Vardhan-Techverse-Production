import { supabase } from './supabase';
import { getSiteContent, DEFAULT_SITE_CONTENT } from './content';

export interface CompanyBrandContent {
  logo_url: string;
  logo_storage_path?: string;
  logo_version?: number;
  is_custom: boolean;
  updated_at?: string;
  updated_by?: string;
}

export const MASTER_DEFAULT_LOGO_URL = '/brand/vardhan-techverse-logo.jpg';

export const DEFAULT_BRAND_CONTENT: CompanyBrandContent = {
  logo_url: MASTER_DEFAULT_LOGO_URL,
  is_custom: false,
  logo_version: 1,
};

/**
 * Centralized active company logo resolution.
 * Retrieves custom uploaded logo if active; falls back to master default JPG if offline or unset.
 */
export async function getActiveCompanyLogo(): Promise<string> {
  try {
    const content = await getSiteContent();
    const brand: CompanyBrandContent = content.COMPANY_BRAND || DEFAULT_BRAND_CONTENT;

    if (brand && brand.is_custom && brand.logo_url) {
      return brand.logo_url;
    }

    return MASTER_DEFAULT_LOGO_URL;
  } catch (err) {
    console.warn('[getActiveCompanyLogo] Network/lookup error, falling back to master logo:', err);
    return MASTER_DEFAULT_LOGO_URL;
  }
}

/**
 * Retrieve full brand identity configuration for Admin management.
 */
export async function getCompanyBrandConfig(): Promise<CompanyBrandContent> {
  try {
    const content = await getSiteContent();
    const brand: CompanyBrandContent = content.COMPANY_BRAND || DEFAULT_BRAND_CONTENT;

    return {
      ...DEFAULT_BRAND_CONTENT,
      ...brand,
    };
  } catch (err) {
    return DEFAULT_BRAND_CONTENT;
  }
}
