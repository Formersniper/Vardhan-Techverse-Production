import React, { useState, useEffect } from 'react';
import { EnquiryType } from '../../types/contracts.ts';
import { submitEnquiry } from '../../api/client.ts';
import { trackEvent, AnalyticsEventName } from '../../services/analytics.ts';
import { Building2, Cpu, Network, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface ContactFormProps {
  initialType?: EnquiryType;
  pageSource?: string;
  onSuccess?: (leadNumber: string) => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialType = 'REAL_ESTATE',
  pageSource = '/contact',
  onSuccess,
}) => {
  const [enquiryType, setEnquiryType] = useState<EnquiryType>(initialType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Adaptive category metadata
  const [propertyLocality, setPropertyLocality] = useState('Golf Course Road');
  const [budgetBracket, setBudgetBracket] = useState('₹5 Cr – ₹10 Cr');
  const [leadVolume, setLeadVolume] = useState('500 – 2,000 / month');
  const [crmPlatform, setCrmPlatform] = useState('HubSpot / Salesforce / None');
  const [partnerType, setPartnerType] = useState('Real Estate Developer');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successLead, setSuccessLead] = useState<{ leadNumber: string; businessUnit: string } | null>(null);

  useEffect(() => {
    if (initialType) {
      setEnquiryType(initialType);
    }
  }, [initialType]);

  const handleTypeSelect = (type: EnquiryType) => {
    setEnquiryType(type);
    trackEvent('enquiry_type_selected', { type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side quick check
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid business or personal email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('Please enter a valid phone number so our team can reach you.');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setErrorMsg('Please provide a brief note describing your requirements.');
      return;
    }

    setLoading(true);

    // Assemble adaptive metadata
    const metadata: Record<string, any> = {};
    if (enquiryType === 'REAL_ESTATE') {
      metadata.preferred_locality = propertyLocality;
      metadata.budget_bracket = budgetBracket;
    } else if (enquiryType === 'AUTOMATION') {
      metadata.monthly_inbound_volume = leadVolume;
      metadata.current_crm_stack = crmPlatform;
    } else if (enquiryType === 'DEVELOPER_PARTNERSHIP') {
      metadata.partner_category = partnerType;
    }

    try {
      const res = await submitEnquiry({
        name,
        email,
        phone,
        enquiry_type: enquiryType,
        message,
        page_source: pageSource,
        metadata,
        website_url_check: honeypot,
      });

      // Track analytics conversion
      let eventName: AnalyticsEventName = 'contact_started';
      if (enquiryType === 'REAL_ESTATE') eventName = 'real_estate_enquiry_submitted';
      if (enquiryType === 'AUTOMATION') eventName = 'automation_enquiry_submitted';
      if (enquiryType === 'DEVELOPER_PARTNERSHIP') eventName = 'developer_enquiry_submitted';
      if (enquiryType === 'TECHNOLOGY') eventName = 'technology_enquiry_submitted';
      trackEvent(eventName, { lead_number: res.lead_number || '' });

      setSuccessLead({
        leadNumber: res.lead_number || 'LEAD-CONFIRMED',
        businessUnit: (res as any).business_unit || 'CORPORATE',
      });

      if (onSuccess && res.lead_number) {
        onSuccess(res.lead_number);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to submit enquiry at this moment. Please call us directly.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setSuccessLead(null);
    setErrorMsg(null);
  };

  if (successLead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 shadow-sm text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
          Enquiry Registered
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Thank you, {name.split(' ')[0] || 'Valued Client'}
        </h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Your enquiry has been classified under <strong className="text-slate-900">{successLead.businessUnit}</strong> and assigned a unique tracking reference.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto mb-8">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tracking Reference</div>
          <div className="text-xl font-mono font-bold text-slate-900">{successLead.leadNumber}</div>
          <div className="text-xs text-slate-500 mt-2">
            An advisory specialist will review your request and get in touch within 4 business hours.
          </div>
        </div>

        <button
          onClick={resetForm}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Submit Another Enquiry →
        </button>
      </div>
    );
  }

  const categoryOptions = [
    {
      type: 'REAL_ESTATE' as EnquiryType,
      label: 'Real Estate',
      sublabel: 'Gurugram Advisory & Brokerage',
      icon: Building2,
    },
    {
      type: 'AUTOMATION' as EnquiryType,
      label: 'AI Automation',
      sublabel: 'Lead-to-Sales Systems',
      icon: Cpu,
    },
    {
      type: 'DEVELOPER_PARTNERSHIP' as EnquiryType,
      label: 'Developer / Partner',
      sublabel: 'Channel & Project Tie-ups',
      icon: Network,
    },
    {
      type: 'TECHNOLOGY' as EnquiryType,
      label: 'Technology / Other',
      sublabel: 'GrowthForge & Corporate',
      icon: Sparkles,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Anti-spam honeypot - invisible to real users */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website_url_check">Leave empty</label>
          <input
            id="website_url_check"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {/* Step 1: Classification Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">
            What can we help you with? <span className="text-blue-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = enquiryType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleTypeSelect(opt.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.sublabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Adaptive Classification Fields */}
        {enquiryType === 'REAL_ESTATE' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Gurugram Corridor
              </label>
              <select
                value={propertyLocality}
                onChange={(e) => setPropertyLocality(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="Golf Course Road">Golf Course Road (Luxury High-Rise)</option>
                <option value="Golf Course Extension">Golf Course Extension Road</option>
                <option value="Dwarka Expressway">Dwarka Expressway Corridor</option>
                <option value="Southern Peripheral Road (SPR)">Southern Peripheral Road (SPR)</option>
                <option value="Sector 54/42 DLF Phase 5">DLF Phase 5 / Camellias / Magnolias Belt</option>
                <option value="Boutique Plotted Development">Boutique Plotted Colony</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Investment Range
              </label>
              <select
                value={budgetBracket}
                onChange={(e) => setBudgetBracket(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="₹3 Cr – ₹5 Cr">₹3 Cr – ₹5 Cr</option>
                <option value="₹5 Cr – ₹10 Cr">₹5 Cr – ₹10 Cr</option>
                <option value="₹10 Cr – ₹20 Cr">₹10 Cr – ₹20 Cr</option>
                <option value="₹20 Cr+">₹20 Cr+ (Ultra-Luxury)</option>
              </select>
            </div>
          </div>
        )}

        {enquiryType === 'AUTOMATION' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estimated Monthly Inbound Leads
              </label>
              <select
                value={leadVolume}
                onChange={(e) => setLeadVolume(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="100 – 500 / month">100 – 500 / month</option>
                <option value="500 – 2,000 / month">500 – 2,000 / month</option>
                <option value="2,000 – 5,000 / month">2,000 – 5,000 / month</option>
                <option value="5,000+ / month">5,000+ / month (Enterprise scale)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Sales / CRM Stack
              </label>
              <select
                value={crmPlatform}
                onChange={(e) => setCrmPlatform(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="HubSpot">HubSpot</option>
                <option value="Salesforce">Salesforce</option>
                <option value="Zoho CRM">Zoho CRM</option>
                <option value="LeadSquared">LeadSquared</option>
                <option value="Spreadsheets / Manual">Spreadsheets / Manual WhatsApp</option>
                <option value="Custom Internal Database">Custom Internal Database</option>
              </select>
            </div>
          </div>
        )}

        {enquiryType === 'DEVELOPER_PARTNERSHIP' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-150">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Organization / Partnership Profile
            </label>
            <select
              value={partnerType}
              onChange={(e) => setPartnerType(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="Real Estate Developer">Real Estate Developer (Gurugram Project)</option>
              <option value="Channel Partner / Associate Broker">Channel Partner / Associate Brokerage</option>
              <option value="Architectural / Project Consultancy">Architectural / Land Advisory</option>
              <option value="Financial Institution / Fund">Institutional Real Estate Fund</option>
            </select>
          </div>
        )}

        {/* Contact Information Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_name" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Full Name <span className="text-blue-600">*</span>
            </label>
            <input
              id="contact_name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="contact_phone" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Phone Number <span className="text-blue-600">*</span>
            </label>
            <input
              id="contact_phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98110 12345"
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact_email" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Email Address <span className="text-blue-600">*</span>
          </label>
          <input
            id="contact_email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rahul@company.com"
            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label htmlFor="contact_message" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Requirement Overview <span className="text-blue-600">*</span>
          </label>
          <textarea
            id="contact_message"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about the property criteria or sales automation challenge..."
            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
          />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-slate-900 hover:bg-blue-600 transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Registering Enquiry...</span>
            </>
          ) : (
            <>
              <span>Submit Inbound Enquiry</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Strict confidentiality guaranteed. We never sell, broker, or transmit customer contact information to third parties.
        </p>
      </form>
    </div>
  );
};
