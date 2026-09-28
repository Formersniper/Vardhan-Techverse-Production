import crypto from 'crypto';
import { 
  Lead, 
  BusinessUnit, 
  EnquiryType, 
  LeadStatus, 
  LeadPriority, 
  CreateEnquiryInput 
} from '../types/contracts.ts';

const COMPANY_ID = process.env.DEFAULT_COMPANY_ID || '00000000-0000-0000-0000-000000000001';

class LeadStore {
  private leads: Map<string, Lead> = new Map();
  private leadCounter: number = 1000;

  constructor() {
    this.seedInitialData();
  }

  private mapEnquiryToBusinessUnit(type: EnquiryType): BusinessUnit {
    switch (type) {
      case 'REAL_ESTATE':
      case 'DEVELOPER_PARTNERSHIP':
        return 'REALTY';
      case 'AUTOMATION':
        return 'AUTOMATION';
      case 'TECHNOLOGY':
        return 'GROWTHFORGE';
      case 'OTHER':
      default:
        return 'CORPORATE';
    }
  }

  private seedInitialData() {
    // Seed a few verified baseline records to demonstrate classification, status workflows, and time-zone rendering
    const seeds: Array<Partial<Lead>> = [
      {
        name: 'Vikramaditya Singhania',
        email: 'v.singhania@apexholding.in',
        phone: '+91 98110 45231',
        enquiry_type: 'REAL_ESTATE',
        business_unit: 'REALTY',
        message: 'Looking for a 4 BHK duplex penthouse on Golf Course Road or Camellias vicinity. Budget is 15-20 Cr. Prefer immediate site visit.',
        source: 'website',
        page_source: '/real-estate',
        status: 'QUALIFIED',
        priority: 'HIGH',
        metadata: {
          budget_bracket: '15-25 Cr',
          preferred_location: 'Golf Course Road / Sector 42',
          timeline: 'Immediate (30 days)'
        },
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        name: 'Rohan Mehra',
        email: 'rohan@finscale.tech',
        phone: '+91 99201 88472',
        enquiry_type: 'AUTOMATION',
        business_unit: 'AUTOMATION',
        message: 'We receive ~1,500 inbound leads/month for our wealth advisory app. We need AI WhatsApp qualification and immediate calendar booking before leads get cold.',
        source: 'website',
        page_source: '/automation',
        status: 'NEW',
        priority: 'URGENT',
        metadata: {
          monthly_lead_volume: '1,000 - 2,500',
          current_crm: 'HubSpot',
          primary_channel: 'WhatsApp Business API'
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        name: 'Brigadier S.K. Nambiar (Retd.)',
        email: 'sk.nambiar@estateventures.com',
        phone: '+91 97170 33819',
        enquiry_type: 'DEVELOPER_PARTNERSHIP',
        business_unit: 'REALTY',
        message: 'Representing a boutique plotted residential development near Southern Peripheral Road (SPR). Looking for exclusive brokerage advisory and high-intent buyer syndication.',
        source: 'website',
        page_source: '/contact',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        metadata: {
          developer_firm: 'Boutique Lands Gurugram',
          project_type: 'Luxury Plotted Colony'
        },
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        name: 'Dr. Ananya Roy',
        email: 'ananya.roy@healthbridge.ai',
        phone: '+91 98450 11984',
        enquiry_type: 'TECHNOLOGY',
        business_unit: 'GROWTHFORGE',
        message: 'Interested in evaluating GrowthForge buyer intelligence infrastructure and custom conversational agent orchestration for specialized vertical integration.',
        source: 'website',
        page_source: '/growthforge',
        status: 'NEW',
        priority: 'MEDIUM',
        metadata: {
          tech_stack: 'Python / Vector DB',
          interest_area: 'Voice & Intelligence Agents'
        },
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ];

    seeds.forEach(s => {
      this.leadCounter++;
      const id = crypto.randomUUID();
      const leadId = crypto.randomUUID();
      const now = s.created_at || new Date().toISOString();
      const lead: Lead = {
        id,
        lead_id: leadId,
        company_id: COMPANY_ID,
        customer_id: null,
        lead_number: `LEAD-2026-${String(this.leadCounter).padStart(5, '0')}`,
        business_unit: s.business_unit || 'CORPORATE',
        enquiry_type: s.enquiry_type || 'OTHER',
        name: s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        message: s.message || '',
        source: s.source || 'website',
        page_source: s.page_source || '/contact',
        status: s.status || 'NEW',
        priority: s.priority || 'MEDIUM',
        assigned_to: null,
        internal_notes: s.internal_notes || null,
        metadata: s.metadata || {},
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      this.leads.set(lead.lead_id, lead);
    });
  }

  public createLead(input: CreateEnquiryInput): Lead {
    this.leadCounter++;
    const id = crypto.randomUUID();
    const leadId = crypto.randomUUID();
    const now = new Date().toISOString();
    const businessUnit = this.mapEnquiryToBusinessUnit(input.enquiry_type);

    const lead: Lead = {
      id,
      lead_id: leadId,
      company_id: COMPANY_ID,
      customer_id: null,
      lead_number: `LEAD-2026-${String(this.leadCounter).padStart(5, '0')}`,
      business_unit: businessUnit,
      enquiry_type: input.enquiry_type,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      message: input.message.trim(),
      source: 'website',
      page_source: input.page_source || '/contact',
      status: 'NEW',
      priority: input.enquiry_type === 'AUTOMATION' || input.enquiry_type === 'REAL_ESTATE' ? 'HIGH' : 'MEDIUM',
      assigned_to: null,
      internal_notes: null,
      metadata: input.metadata || {},
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    this.leads.set(leadId, lead);
    return lead;
  }

  public listLeads(filter?: {
    business_unit?: BusinessUnit;
    status?: LeadStatus;
    search?: string;
  }): Lead[] {
    let result = Array.from(this.leads.values()).filter(l => !l.deleted_at);

    if (filter?.business_unit) {
      result = result.filter(l => l.business_unit === filter.business_unit);
    }

    if (filter?.status) {
      result = result.filter(l => l.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.lead_number.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getLeadById(leadId: string): Lead | undefined {
    return this.leads.get(leadId);
  }

  public updateLead(
    leadId: string, 
    updates: {
      status?: LeadStatus;
      priority?: LeadPriority;
      internal_notes?: string;
      assigned_to?: string | null;
    }
  ): Lead | null {
    const existing = this.leads.get(leadId);
    if (!existing) return null;

    const updated: Lead = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.leads.set(leadId, updated);
    return updated;
  }

  public getStats() {
    const all = Array.from(this.leads.values()).filter(l => !l.deleted_at);
    return {
      total: all.length,
      new: all.filter(l => l.status === 'NEW').length,
      contacted: all.filter(l => l.status === 'CONTACTED').length,
      qualified: all.filter(l => l.status === 'QUALIFIED').length,
      by_unit: {
        REALTY: all.filter(l => l.business_unit === 'REALTY').length,
        AUTOMATION: all.filter(l => l.business_unit === 'AUTOMATION').length,
        GROWTHFORGE: all.filter(l => l.business_unit === 'GROWTHFORGE').length,
        CORPORATE: all.filter(l => l.business_unit === 'CORPORATE').length,
      }
    };
  }
}

export const leadStore = new LeadStore();
