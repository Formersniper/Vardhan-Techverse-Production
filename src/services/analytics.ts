/**
 * @file analytics.ts
 * @description Privacy-first event analytics for conversion funnel tracking.
 */

export type AnalyticsEventName =
  | 'page_view'
  | 'real_estate_cta_clicked'
  | 'automation_cta_clicked'
  | 'growthforge_cta_clicked'
  | 'contact_started'
  | 'enquiry_type_selected'
  | 'real_estate_enquiry_submitted'
  | 'automation_enquiry_submitted'
  | 'developer_enquiry_submitted'
  | 'technology_enquiry_submitted'
  | 'phone_clicked'
  | 'email_clicked'
  | 'whatsapp_clicked';

export function trackEvent(
  eventName: AnalyticsEventName, 
  properties?: Record<string, string | number | boolean>
): void {
  try {
    const payload = {
      event: eventName,
      properties: properties || {},
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    // Client-side non-intrusive logging & analytics hook
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] ${eventName}:`, payload);
    }

    // Window dataLayer integration if Google Analytics / GTM is present
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push(payload);
    }
  } catch (e) {
    // Fail silently to never interrupt user conversion flow
  }
}
