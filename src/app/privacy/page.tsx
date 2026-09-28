'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const privacy = content.PRIVACY_POLICY || DEFAULT_SITE_CONTENT.PRIVACY_POLICY;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/privacy" />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Corporate Policy
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-2">
            Privacy Policy
          </h1>

          <p className="text-xs text-slate-500">
            Last Updated: {privacy.last_updated || 'January 2026'} | Vardhan Techverse Private Limited
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-8 text-slate-700">
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              1. Information Collection &amp; Policy Details
            </h2>
            <p className="whitespace-pre-wrap">{privacy.content}</p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              2. Purpose of Collection &amp; Processing
            </h2>
            <p className="mb-2">
              We process your personal information exclusively for legitimate corporate purposes, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Responding to your specific real estate advisory or business automation enquiry.</li>
              <li>Assigning your request to qualified internal sales operators or advisory consultants.</li>
              <li>Generating unique enquiry reference tracking numbers (LEAD-YYYY-NNNNN).</li>
              <li>Ensuring system security, anti-spam protection, and service stability.</li>
            </ul>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              3. Data Security &amp; Retention
            </h2>
            <p>
              We implement administrative and technical security measures, including encrypted database storage, Row Level Security (RLS) policies, and role-based access controls. Information is retained only as needed to fulfill your enquiry and maintain internal records.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              4. Contact Mechanism
            </h2>
            <p>
              For privacy-related questions or data access requests, please submit an inquiry via our{' '}
              <Link href="/contact" className="text-blue-600 font-semibold hover:underline">
                Contact Page
              </Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
