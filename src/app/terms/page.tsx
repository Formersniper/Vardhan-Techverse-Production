'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import { Scale, FileCheck2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const terms = content.TERMS_OF_USE || DEFAULT_SITE_CONTENT.TERMS_OF_USE;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/terms" />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            Corporate Legal Terms
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-2">
            Terms of Use
          </h1>

          <p className="text-xs text-slate-500">
            Last Updated: {terms.last_updated || 'January 2026'} | Vardhan Techverse Private Limited
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-8 text-slate-700">
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              1. Informational Nature &amp; Terms
            </h2>
            <p className="whitespace-pre-wrap">{terms.content}</p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              2. Real Estate Advisory &amp; Property Availability
            </h2>
            <p>
              Real estate advisory services, property pricing, project layouts, and developer availability are subject to change by respective developers. Submitting an enquiry does not guarantee property allotment or locked pricing until formal agreement execution.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              3. Intellectual Property &amp; Brand Rights
            </h2>
            <p>
              All corporate logos, trade names, text, graphics, GrowthForge architecture concepts, and visual brand assets displayed on this website are the intellectual property of Vardhan Techverse Private Limited. Unauthorized duplication or redistribution is strictly prohibited.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              4. Jurisdiction
            </h2>
            <p>
              Vardhan Techverse Private Limited shall not be liable for any indirect or consequential loss arising from reliance on website information. Any disputes shall be subject to the exclusive jurisdiction of competent courts in Gurugram / Haryana, India.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
