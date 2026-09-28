'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import {
  Zap,
  Database,
  BrainCircuit,
  Binary,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function GrowthForgePage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const growthforge = content.GROWTHFORGE_CAPABILITY || DEFAULT_SITE_CONTENT.GROWTHFORGE_CAPABILITY;

  const capabilities = [
    {
      title: 'Buyer Intelligence',
      description: 'Understanding buyer signals, micro-market preference correlations, budget sensitivity, and decision timelines.',
      icon: BrainCircuit,
    },
    {
      title: 'Lead Enrichment Layer',
      description: 'Appending contextual metadata to incoming enquiries before sales operator assignment.',
      icon: Database,
    },
    {
      title: 'Predictive Lead Scoring',
      description: 'Algorithmically prioritizing high-intent buyers to maximize sales team bandwidth.',
      icon: Binary,
    },
    {
      title: 'AI Agent Infrastructure',
      description: 'Internal LLM-powered prompt orchestration and automated structured response formatting.',
      icon: Zap,
    },
    {
      title: 'Workflow Intelligence',
      description: 'Multi-stage state transition rules ensuring auditability, role enforcement, and company-isolation compliance.',
      icon: Layers,
    },
    {
      title: 'Sales Automation Infrastructure',
      description: 'High-throughput transactional API integrations, rate limiting, and immutable event logging.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/growthforge" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Technology &amp; Intelligence Layer
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6">
              {growthforge.title}
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              {growthforge.subtitle}
            </p>

            <div className="flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-slate-950 hover:bg-blue-600 transition-colors shadow-sm text-sm sm:text-base"
              >
                <span>Explore Technology Capabilities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Intelligence Capabilities
            </h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Engineered as a modular architecture supporting Vardhan's real estate and business automation units.
            </p>
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
            Interested in GrowthForge Technology or Custom Solutions?
          </h3>
          <p className="text-slate-600 text-sm sm:text-base mb-8">
            Connect with our engineering team to discuss intelligence infrastructure, custom integrations, or advisory partnerships.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm text-base"
          >
            <span>Contact Technology Team</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
