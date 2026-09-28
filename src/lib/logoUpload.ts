import { supabase } from './supabase';
import { updateSiteContent, DEFAULT_SITE_CONTENT } from './content';
import { MASTER_DEFAULT_LOGO_URL, CompanyBrandContent } from './brand';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Validate binary file magic bytes to prevent extension spoofing / script injection
 */
export async function validateLogoFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds maximum allowed limit of 5 MB.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Invalid file extension. Only JPG, PNG, and WebP files are allowed.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Invalid MIME type. SVG, HTML, or executable files are strictly forbidden.' };
  }

  // Inspect file magic header bytes
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let isMagicValid = false;

    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      isMagicValid = true;
    }
    // JPEG: FF D8 FF
    else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      isMagicValid = true;
    }
    // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    else if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      isMagicValid = true;
    }

    if (!isMagicValid) {
      return {
        valid: false,
        error: 'Security Validation Failed: File signature mismatch. Only genuine JPG, PNG, or WebP images are allowed.',
      };
    }
  } catch (err) {
    return { valid: false, error: 'Failed to inspect file headers.' };
  }

  return { valid: true };
}

/**
 * Upload new corporate logo to Supabase Storage and activate in COMPANY_BRAND config.
 */
export async function uploadAndActivateLogo(
  file: File,
  companyId: string = 'c0000000-0000-0000-0000-000000000001'
): Promise<{ success: boolean; logo_url?: string; message?: string }> {
  const validation = await validateLogoFile(file);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const timestamp = Date.now();
  const filePath = `${companyId}/logo/active_${timestamp}.${ext}`;
  let publicUrl = '';

  try {
    // Attempt upload to company-brand-assets bucket
    const { data: uploadData, error: uploadError } = await (supabase as any).storage
      .from('company-brand-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.warn('[uploadAndActivateLogo] Storage upload error, falling back to data URL:', uploadError);
      // Fallback: convert to Base64 Data URL for client-side persistence if storage bucket is offline
      publicUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      const { data: urlData } = (supabase as any).storage
        .from('company-brand-assets')
        .getPublicUrl(filePath);

      publicUrl = urlData?.publicUrl || '';
    }

    if (!publicUrl) {
      return { success: false, message: 'Failed to generate public URL for uploaded logo.' };
    }

    const payload: CompanyBrandContent = {
      logo_url: publicUrl,
      logo_storage_path: filePath,
      logo_version: timestamp,
      is_custom: true,
      updated_at: new Date().toISOString(),
    };

    // Update COMPANY_BRAND key in site_content via admin RPC
    const res = await updateSiteContent('COMPANY_BRAND', payload, true);
    if (!res || !res.success) {
      return { success: false, message: res.message || 'Failed to update brand configuration.' };
    }

    return {
      success: true,
      logo_url: publicUrl,
      message: 'Active corporate logo updated successfully.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error processing logo upload.' };
  }
}

/**
 * Restore default master corporate logo (/brand/vardhan-techverse-logo.jpg)
 */
export async function restoreDefaultLogo(): Promise<{ success: boolean; message?: string }> {
  try {
    const payload: CompanyBrandContent = {
      logo_url: MASTER_DEFAULT_LOGO_URL,
      is_custom: false,
      logo_version: 1,
      updated_at: new Date().toISOString(),
    };

    const res = await updateSiteContent('COMPANY_BRAND', payload, true);
    if (!res || !res.success) {
      return { success: false, message: res.message || 'Failed to restore default logo configuration.' };
    }

    return {
      success: true,
      message: 'Master corporate default logo restored successfully.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error restoring default logo.' };
  }
}
