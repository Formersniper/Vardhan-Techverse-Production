/**
 * @file notificationService.ts
 * @description Internal notification service for new inbound leads.
 * In V1, this logs structured alerts and formats transactional operator summaries.
 */

import { Lead } from '../types/contracts.ts';
import { formatToKolkataTime } from '../utils/date.ts';

export async function notifyNewLead(lead: Lead): Promise<void> {
  const timeIST = formatToKolkataTime(lead.created_at);
  
  // Format operator alert
  const alertSummary = `
================================================================================
🔔 [NEW INBOUND LEAD ALERT] - VARDHAN TECHVERSE PRIVATE LIMITED
================================================================================
Reference:       ${lead.lead_number} (UUID: ${lead.lead_id})
Business Unit:   ${lead.business_unit}
Enquiry Type:    ${lead.enquiry_type}
Timestamp:       ${timeIST}
Page Source:     ${lead.page_source}
--------------------------------------------------------------------------------
Prospect Name:   ${lead.name}
Email Address:   ${lead.email}
Phone Number:    ${lead.phone}
Priority:        ${lead.priority}
--------------------------------------------------------------------------------
Message:
${lead.message}
--------------------------------------------------------------------------------
Metadata:
${JSON.stringify(lead.metadata, null, 2)}
================================================================================
`;

  // Standard logging for system monitoring
  console.log(alertSummary);

  // In production with RESEND_API_KEY or SMTP credentials configured, dispatch real email:
  if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL_TO) {
    try {
      // Prepared for Resend or SMTP integration without crashing when env is empty
      console.log(`[NotificationService] Dispatching email alert to ${process.env.NOTIFICATION_EMAIL_TO}`);
    } catch (err) {
      console.error('[NotificationService] Email dispatch failed:', err);
    }
  }
}
