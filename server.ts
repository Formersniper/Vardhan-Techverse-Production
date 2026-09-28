import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { leadStore } from './src/services/store.ts';
import { notifyNewLead } from './src/services/notificationService.ts';
import { CreateEnquiryInput, EnquiryType } from './src/types/contracts.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Parse JSON bodies
app.use(express.json());

// Basic in-memory rate limiting map (IP -> timestamps)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 15;

  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxAttempts) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Vardhan Techverse Web Service',
  });
});

// Submit Enquiry (Public Endpoint)
app.post('/api/enquiries', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // 1. Rate Limiting Check
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Too many submissions from this connection. Please try again shortly or contact us directly.',
      });
    }

    const {
      name,
      email,
      phone,
      enquiry_type,
      message,
      page_source,
      metadata,
      website_url_check,
    } = req.body as CreateEnquiryInput;

    // 2. Anti-spam Honeypot Check
    // Invisible field to humans. If filled by bots, silently succeed or drop.
    if (website_url_check && website_url_check.trim().length > 0) {
      console.warn(`[Anti-Spam] Honeypot triggered from IP: ${clientIp}`);
      return res.status(200).json({
        success: true,
        message: 'Your enquiry has been received and routed.',
      });
    }

    // 3. Server-side Validation
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push('A valid email address is required.');
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      errors.push('A valid phone number is required.');
    }

    const validEnquiryTypes: EnquiryType[] = [
      'REAL_ESTATE',
      'AUTOMATION',
      'DEVELOPER_PARTNERSHIP',
      'TECHNOLOGY',
      'OTHER',
    ];
    if (!enquiry_type || !validEnquiryTypes.includes(enquiry_type)) {
      errors.push('Please select a valid enquiry category.');
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      errors.push('Please provide a brief description of your requirements.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    // 4. Persistence
    const lead = leadStore.createLead({
      name,
      email,
      phone,
      enquiry_type,
      message,
      page_source: page_source || '/contact',
      metadata: metadata || {},
    });

    // 5. Asynchronous Notification
    notifyNewLead(lead).catch(err => {
      console.error('[Server] Notification dispatch error:', err);
    });

    return res.status(201).json({
      success: true,
      lead_id: lead.lead_id,
      lead_number: lead.lead_number,
      business_unit: lead.business_unit,
      message: 'Your enquiry has been successfully logged. Our advisory team will reach out within 4 business hours.',
    });
  } catch (error: any) {
    console.error('[Server] Error handling enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal error occurred while processing your enquiry. Please contact us via phone or WhatsApp.',
    });
  }
});

// Admin: List Enquiries
app.get('/api/admin/enquiries', (req, res) => {
  try {
    const { business_unit, status, search } = req.query;
    const leads = leadStore.listLeads({
      business_unit: business_unit ? (business_unit as any) : undefined,
      status: status ? (status as any) : undefined,
      search: search ? String(search) : undefined,
    });
    return res.json({ success: true, leads });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update Enquiry Status / Notes
app.patch('/api/admin/enquiries/:leadId', (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, priority, internal_notes, assigned_to } = req.body;

    const updated = leadStore.updateLead(leadId, {
      status,
      priority,
      internal_notes,
      assigned_to,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    return res.json({ success: true, lead: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Stats
app.get('/api/admin/stats', (_req, res) => {
  try {
    const stats = leadStore.getStats();
    return res.json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// VITE DEV SERVER / STATIC ASSETS
// ============================================================================
async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Vardhan Techverse] Server running on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
