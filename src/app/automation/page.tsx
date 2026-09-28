'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import {
  Cpu,
  MessageSquare,
  Workflow,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Filter,
  CalendarCheck,
} from 'lucide-react';

export default function AutomationPage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const automation = content.AUTOMATION_CAPABILITY || DEFAULT_SITE_CONTENT.AUTOMATION_CAPABILITY;

  const capabilities = [
    {
      title: 'Lead Capture Systems',
      description: 'Unified ingestion from website forms, digital ads, and landing pages directly into structured backend database tables.',
      icon: Filter,
    },
    {
      title: 'Lead Qualification Workflows',
      description: 'Rule-based and intelligent automated qualification based on buyer budget, timeline, location, and requirement clarity.',
      icon: CheckCircle2,
    },
    {
      title: 'AI WhatsApp Sales Automation',
      description: 'Instant response triggers, interactive questionnaire flows, and automated appointment scheduling via WhatsApp API.',
      icon: MessageSquare,
    },
    {
      title: 'CRM Orchestration',
      description: 'Connecting lead sources with CRM platforms, maintaining sync across status changes, lead events, and operator notes.',
      icon: Workflow,
    },
    {
      title: 'Follow-up Automation',
      description: 'Drip messaging, reminder notifications, and re-engagement workflows ensuring zero lead leakage.',
      icon: CalendarCheck,
    },
    {
      title: 'Reporting & Operational Intelligence',
      description: 'Immutable lead audit logs, conversion velocity tracking, and manager performance dashboards.',
      icon: BarChart3,
    },
  ];

  const flowSteps = [
    { label: 'LEAD', desc: 'Inbound enquiry' },
    { label: 'CAPTURE', desc: 'Sanitized ingestion' },
    { label: 'QUALIFY', desc: 'Budget & intent check' },
    { label: 'FOLLOW-UP', desc: 'Instant WhatsApp' },
    { label: 'APPOINTMENT', desc: 'Site visit / Meeting' },
    { label: 'SALES', desc: 'Closed transaction' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/automation" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              AI Lead-to-Sales Automation
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6">
              {automation.title}
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              {automation.subtitle}
            </p>

            <div className="flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-slate-950 hover:bg-blue-600 transition-colors shadow-sm text-sm sm:text-base"
              >
                <span>Discuss an Automation Requirement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Conceptual Pipeline Flow */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Architecture
            </h2>
            <h3 className="text-2xl font-extrabold text-slate-950">
              The Sales Automation Pipeline Flow
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {flowSteps.map((step, idx) => (
              <div key={idx} className="relative bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-extrabold text-blue-600 tracking-wider mb-1">
                  0{idx + 1}. {step.label}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Modular Automation Capabilities
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((cap, idx) => {
              const IconComp = cap.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-950 mb-2">
                    {cap.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto bg-slate-50 border-t border-slate-200">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mb-4">
            Ready to Automate Your Lead-to-Sales Process?
          </h3>
          <p className="text-slate-600 text-sm sm:text-base mb-8">
            Let us review your current lead ingestion channels and build a structured automation plan.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm text-base"
          >
            <span>Schedule Automation Discussion</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
