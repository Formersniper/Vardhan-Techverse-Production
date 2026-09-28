'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { formatToKolkataTime } from '@/lib/date';
import { getSiteContent, updateSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import { getCompanyBrandConfig, CompanyBrandContent, MASTER_DEFAULT_LOGO_URL } from '@/lib/brand';
import { uploadAndActivateLogo, restoreDefaultLogo } from '@/lib/logoUpload';
import { fetchAdminEnquiries, updateAdminEnquiry } from '@/api/client';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  LogOut,
  X,
  CheckCircle2,
  Edit3,
  FileText,
  Save,
  Globe,
  Layout,
  Database,
  Image as ImageIcon,
  UploadCloud,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

interface LeadRow {
  lead_id: string;
  lead_number: string;
  company_id: string;
  business_unit: 'REALTY' | 'AUTOMATION' | 'GROWTHFORGE' | 'CORPORATE';
  enquiry_type: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  page_source: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export default function AdminPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ user: { email: string; role: string } } | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'content' | 'brand'>('leads');

  // Lead State
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [mutating, setMutating] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Content Management State
  const [siteContent, setSiteContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeContentKey, setActiveContentKey] = useState<string>('COMPANY_PROFILE');
  const [contentDraft, setContentDraft] = useState<string>('');
  const [savingContent, setSavingContent] = useState(false);

  // Brand Identity State
  const [brandConfig, setBrandConfig] = useState<CompanyBrandContent>({
    logo_url: MASTER_DEFAULT_LOGO_URL,
    is_custom: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vt_admin_session');
      if (!stored) {
        router.push('/admin/login');
        return;
      }
      try {
        setSession(JSON.parse(stored));
      } catch {
        router.push('/admin/login');
        return;
      }
    }
    loadLeads();
    loadContent();
    loadBrandConfig();
  }, [router]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminEnquiries({
        status: statusFilter as any || undefined,
        business_unit: buFilter as any || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setLeads(res.leads || []);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    setContentLoading(true);
    try {
      const data = await getSiteContent();
      if (data) {
        setSiteContent(data);
        if (data[activeContentKey]) {
          setContentDraft(JSON.stringify(data[activeContentKey], null, 2));
        }
      }
    } catch (err) {
      console.error('Failed to load site content:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const loadBrandConfig = async () => {
    try {
      const cfg = await getCompanyBrandConfig();
      if (cfg) {
        setBrandConfig(cfg);
      }
    } catch (err) {
      console.error('Failed to load brand config:', err);
    }
  };

  useEffect(() => {
    if (siteContent[activeContentKey]) {
      setContentDraft(JSON.stringify(siteContent[activeContentKey], null, 2));
    }
  }, [activeContentKey, siteContent]);

  const handleSelectLead = (lead: LeadRow) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditPriority(lead.priority);
    setEditNotes(lead.internal_notes || '');
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    setMutating(true);
    try {
      const res = await updateAdminEnquiry(selectedLead.lead_id, {
        status: editStatus as any,
        priority: editPriority,
        internal_notes: editNotes,
      });
      if (res.success) {
        setNotification(`Lead ${selectedLead.lead_number} updated successfully.`);
        setSelectedLead(null);
        loadLeads();
      } else {
        alert(res.message || 'Failed to update lead');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating lead');
    } finally {
      setMutating(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedLead) return;
    if (!confirm(`Are you sure you want to soft-delete lead ${selectedLead.lead_number}?`)) return;

    setMutating(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedLead.lead_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SOFT_DELETE',
          reason: 'Archived via admin portal',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Lead ${selectedLead.lead_number} soft-deleted.`);
        setSelectedLead(null);
        loadLeads();
      } else {
        alert(data.message || 'Failed to delete lead');
      }
    } catch (err) {
      alert('Error soft-deleting lead');
    } finally {
      setMutating(false);
    }
  };

  const handleSaveContentKey = async () => {
    try {
      const parsedValue = JSON.parse(contentDraft);
      setSavingContent(true);
      const res = await updateSiteContent(activeContentKey, parsedValue, true);
      if (res && res.success) {
        setNotification(`Site content key '${activeContentKey}' updated and published successfully.`);
        setSiteContent((prev) => ({ ...prev, [activeContentKey]: parsedValue }));
      } else {
        alert(res.message || 'Failed to save content key');
      }
    } catch (err: any) {
      alert(`JSON Syntax Error: ${err.message || 'Invalid JSON format'}`);
    } finally {
      setSavingContent(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    setUploadingLogo(true);
    try {
      const res = await uploadAndActivateLogo(selectedFile);
      if (res.success) {
        setNotification('New corporate logo uploaded and activated successfully across the website.');
        setSelectedFile(null);
        setLogoPreview(null);
        await loadBrandConfig();
      } else {
        alert(res.message || 'Failed to upload logo.');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing logo upload.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRestoreDefaultLogo = async () => {
    if (!confirm('Are you sure you want to restore the Master Default Logo (/brand/vardhan-techverse-logo.jpg)?')) return;
    setUploadingLogo(true);
    try {
      const res = await restoreDefaultLogo();
      if (res.success) {
        setNotification('Master Default Logo restored successfully.');
        setSelectedFile(null);
        setLogoPreview(null);
        await loadBrandConfig();
      } else {
        alert(res.message || 'Failed to restore default logo.');
      }
    } catch (err: any) {
      alert(err.message || 'Error restoring default logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vt_admin_session');
    }
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-3.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="sm" customSrc={brandConfig.logo_url} />
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-300">Admin Operations Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>{session?.user.email || 'Authenticated Staff'}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-900 text-blue-300 rounded">
              {session?.user.role || 'ADMIN'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-8 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('leads')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'leads'
              ? 'border-blue-500 text-blue-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Lead Operations Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'content'
              ? 'border-blue-500 text-blue-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Site Content Management</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'brand'
              ? 'border-blue-500 text-blue-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Brand Identity &amp; Logo</span>
        </button>
      </div>

      {/* Main Operations Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {notification && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: LEAD OPERATIONS */}
        {activeTab === 'leads' && (
          <div>
            {/* Filter & Control Bar */}
            <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search lead number, name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={buFilter}
                  onChange={(e) => setBuFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Business Units</option>
                  <option value="REALTY">REALTY</option>
                  <option value="AUTOMATION">AUTOMATION</option>
                  <option value="GROWTHFORGE">GROWTHFORGE</option>
                  <option value="CORPORATE">CORPORATE</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="LOST">LOST</option>
                  <option value="SPAM">SPAM</option>
                </select>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={loadLeads}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Lead Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Lead Number</th>
                      <th className="py-3.5 px-4">Name &amp; Contact</th>
                      <th className="py-3.5 px-4">Classification</th>
                      <th className="py-3.5 px-4">Business Unit</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Logged Time (IST)</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          Loading lead pipeline...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No leads match the specified criteria.
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.lead_id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                            {lead.lead_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{lead.name}</div>
                            <div className="text-[11px] text-slate-400">{lead.email} | {lead.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-300">
                            {lead.enquiry_type}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-950 border border-slate-800 text-blue-300">
                              {lead.business_unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              lead.status === 'NEW' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                              lead.status === 'QUALIFIED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              lead.status === 'CONTACTED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-400">
                            {lead.priority}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {formatToKolkataTime(lead.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleSelectLead(lead)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 font-semibold transition-colors text-xs inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Review</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SITE CONTENT MANAGEMENT */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Keys Sidebar */}
            <div className="lg:col-span-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-400" />
                <span>Controlled Content Keys</span>
              </h3>

              {[
                { key: 'COMPANY_PROFILE', label: 'Company Operating Info' },
                { key: 'COMPANY_POSITIONING', label: 'Homepage Positioning' },
                { key: 'REALTY_CAPABILITY', label: 'Realty Capability Text' },
                { key: 'AUTOMATION_CAPABILITY', label: 'Automation Capability Text' },
                { key: 'GROWTHFORGE_CAPABILITY', label: 'GrowthForge Capability Text' },
                { key: 'GOVERNANCE_POLICY', label: 'Corporate / Governance Policy' },
                { key: 'PRIVACY_POLICY', label: 'Privacy Policy Text' },
                { key: 'TERMS_OF_USE', label: 'Terms of Use Text' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveContentKey(item.key)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeContentKey === item.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">{item.key}</span>
                </button>
              ))}
            </div>

            {/* Content Value JSON Editor */}
            <div className="lg:col-span-8 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Edit Content: <span className="font-mono text-blue-400">{activeContentKey}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Edits save directly to Supabase with automatic append-only audit tracking.
                    </p>
                  </div>
                  <button
                    onClick={loadContent}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload</span>
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Structured Payload (JSON)
                  </label>
                  <textarea
                    rows={16}
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={handleSaveContentKey}
                  disabled={savingContent}
                  className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors text-xs shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingContent ? 'Publishing...' : 'Save & Publish Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRAND IDENTITY & LOGO */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Logo Status & Preview */}
            <div className="lg:col-span-5 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <span>Active Corporate Logo</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Current logo displayed across website Navbar, Footer, and Corporate headers.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {brandConfig.is_custom ? (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Custom Corporate Logo Active</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-950 border border-blue-800 text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Master Default Logo Active</span>
                  </span>
                )}
              </div>

              {/* Active Preview Frame */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[160px]">
                <img
                  src={brandConfig.logo_url}
                  alt="Active Corporate Logo"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>

              <div className="text-xs text-slate-400 space-y-2 pt-4 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Master Asset:</span>
                  <span className="font-mono text-slate-300">/brand/vardhan-techverse-logo.jpg</span>
                </div>
                {brandConfig.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Modified:</span>
                    <span className="text-slate-300">{formatToKolkataTime(brandConfig.updated_at)}</span>
                  </div>
                )}
              </div>

              {/* Restore Default Button */}
              {brandConfig.is_custom && (
                <div className="pt-2">
                  <button
                    onClick={handleRestoreDefaultLogo}
                    disabled={uploadingLogo}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-900/80 hover:text-amber-200 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore Master Default Logo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upload & Replace Logo Controls */}
            <div className="lg:col-span-7 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Upload &amp; Replace Corporate Logo
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Upload a new corporate logo image to update the live website logo dynamically.
                </p>

                {/* Validation Info Box */}
                <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <span>Allowed File Standards:</span>
                  </div>
                  <ul className="list-disc pl-5 text-slate-400 space-y-1 text-[11px]">
                    <li>Supported formats: <strong>JPG, JPEG, PNG, WebP</strong></li>
                    <li>Maximum file size: <strong>5 MB</strong></li>
                    <li>Automatic security check: Declared MIME type and binary magic signatures verified.</li>
                    <li>SVG, HTML, scripts, and executable uploads are strictly forbidden.</li>
                  </ul>
                </div>

                {/* File Picker */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Select Corporate Logo File
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800"
                  />
                </div>

                {/* Selected File Preview */}
                {logoPreview && (
                  <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-blue-900/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-blue-300 mb-1">Preview Selection:</div>
                      <div className="text-[11px] text-slate-400 font-mono">{selectedFile?.name} ({(selectedFile?.size! / 1024).toFixed(1)} KB)</div>
                    </div>
                    <img src={logoPreview} alt="Selection Preview" className="h-12 w-auto object-contain bg-slate-900 p-1 rounded border border-slate-800" />
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setLogoPreview(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Clear Selection
                  </button>
                )}

                <button
                  onClick={handleUploadLogo}
                  disabled={!selectedFile || uploadingLogo}
                  className={`px-6 py-3 rounded-xl font-bold text-white text-xs shadow-md flex items-center gap-2 transition-colors ${
                    !selectedFile || uploadingLogo
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadingLogo ? 'Validating & Uploading...' : 'Upload & Activate Logo'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono font-bold text-blue-400 mb-1">
                  {selectedLead.lead_number}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {selectedLead.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-medium text-slate-200">{selectedLead.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone Number</span>
                <span className="font-medium text-slate-200">{selectedLead.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Business Unit</span>
                <span className="font-bold text-blue-400">{selectedLead.business_unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Source Page</span>
                <span className="font-medium text-slate-200">{selectedLead.page_source}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Client Enquiry Message
              </label>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                {selectedLead.message}
              </div>
            </div>

            {/* Operational Mutations */}
            <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Update Lead Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="LOST">LOST</option>
                    <option value="SPAM">SPAM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Update Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Internal Operational Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record operator follow-up details..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handleSoftDelete}
                  disabled={mutating}
                  className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Soft Delete Lead</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdateLead}
                    disabled={mutating}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
                  >
                    {mutating ? 'Saving...' : 'Save Mutation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
