/**
 * Vardhan Techverse Private Limited
 * Input Validation & Sanitization Foundation (Stage 1)
 */

import { EnquiryType, type EnquiryTypeEnum } from './contracts';

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  enquiry_type: EnquiryTypeEnum;
  message: string;
  page_source?: string;
  // Honeypot field (must remain empty)
  hp_company_field?: string;
}

/**
 * Strips HTML tags and excessive whitespace to protect against basic XSS
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .trim();
}

/**
 * Validates email format according to RFC 5322 simplified standard
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates international and Indian phone numbers (E.164 compatible or 10-digit Indian mobile)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Allows optional leading +, country codes, and 10 to 15 digits with spaces/hyphens
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Formats a phone number into standardized international format
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    // Default 10-digit Indian numbers to +91 prefix
    return `+91${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Client-side validation contract for incoming enquiries
 */
export function validateEnquiryInput(input: Partial<EnquiryInput>): ValidationResult<EnquiryInput> {
  const errors: Record<string, string> = {};

  // Honeypot check: If filled, fail silently or flag
  if (input.hp_company_field && input.hp_company_field.trim().length > 0) {
    errors.hp_company_field = 'Automated submission detected.';
  }

  const name = sanitizeText(input.name || '');
  if (!name || name.length < 2) {
    errors.name = 'Please enter your full name (minimum 2 characters).';
  } else if (name.length > 120) {
    errors.name = 'Name must be 120 characters or fewer.';
  }

  const email = (input.email || '').trim().toLowerCase();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  const phone = (input.phone || '').trim();
  if (!phone) {
    errors.phone = 'Phone number is required for advisory communication.';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Please enter a valid 10-digit phone number or international format (+91...).';
  }

  const message = sanitizeText(input.message || '');
  if (!message || message.length < 10) {
    errors.message = 'Please provide a message or requirement details (minimum 10 characters).';
  } else if (message.length > 3000) {
    errors.message = 'Message must be 3000 characters or fewer.';
  }

  const validEnquiryTypes = Object.values(EnquiryType) as string[];
  if (!input.enquiry_type || !validEnquiryTypes.includes(input.enquiry_type)) {
    errors.enquiry_type = 'Please select a valid enquiry classification.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          name,
          email,
          phone: normalizePhone(phone),
          enquiry_type: input.enquiry_type as EnquiryTypeEnum,
          message,
          page_source: input.page_source || '/contact',
        }
      : undefined,
  };
}
