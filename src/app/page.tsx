'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import {
  Building2,
  Cpu,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const profile = content.COMPANY_PROFILE || DEFAULT_SITE_CONTENT.COMPANY_PROFILE;
  const positioning = content.COMPANY_POSITIONING || DEFAULT_SITE_CONTENT.COMPANY_POSITIONING;
  const realty = content.REALTY_CAPABILITY || DEFAULT_SITE_CONTENT.REALTY_CAPABILITY;
  const automation = content.AUTOMATION_CAPABILITY || DEFAULT_SITE_CONTENT.AUTOMATION_CAPABILITY;
  const growthforge = content.GROWTHFORGE_CAPABILITY || DEFAULT_SITE_CONTENT.GROWTHFORGE_CAPABILITY;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto text-center">
            {/* Primary Corporate Logo Display */}
            <div className="mb-8 flex justify-center">
              <Logo size="xl" className="max-w-full" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Technology-Enabled Real Estate &amp; Business Automation
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6">
              {positioning.hero_title}
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-10">
              {positioning.hero_subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/real-estate"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-slate-950 hover:bg-blue-600 shadow-sm transition-colors text-sm sm:text-base"
              >
                <Building2 className="w-5 h-5 opacity-80" />
                <span>Real Estate Advisory</span>
              </Link>

              <Link
                href="/automation"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-sm sm:text-base"
              >
                <Cpu className="w-5 h-5 text-blue-600" />
                <span>Sales Automation</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-sm sm:text-base"
              >
                <span>Talk to Us</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Three Connected Capabilities Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Capabilities
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Three Connected Pillars under One Parent
            </h3>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              Each capability operates independently while sharing a unified intelligence and operational architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: REALTY */}
            <div className="flex flex-col rounded-2xl border border-slate-200 p-8 bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-lg mb-6">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                Pillar 01 — REALTY
              </div>
              <h4 className="text-xl font-bold text-slate-950 mb-3">
                {realty.title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">
                {realty.subtitle}
              </p>
              <Link
                href="/real-estate"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 group"
              >
                <span>Residential &amp; Commercial Advisory</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Pillar 2: AUTOMATION */}
            <div className="flex flex-col rounded-2xl border border-slate-200 p-8 bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                Pillar 02 — AUTOMATION
              </div>
              <h4 className="text-xl font-bold text-slate-950 mb-3">
                {automation.title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">
                {automation.subtitle}
              </p>
              <Link
                href="/automation"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 group"
              >
                <span>Explore Sales Automation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Pillar 3: GROWTHFORGE */}
            <div className="flex flex-col rounded-2xl border border-slate-200 p-8 bg-white hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-lg mb-6 border border-slate-200">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                Pillar 03 — GROWTHFORGE
              </div>
              <h4 className="text-xl font-bold text-slate-950 mb-3">
                {growthforge.title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">
                {growthforge.subtitle}
              </p>
              <Link
                href="/growthforge"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 group"
              >
                <span>Discover GrowthForge</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
                Process
              </h2>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                How We Work
              </h3>
              <p className="mt-4 text-slate-600 text-sm sm:text-base">
                A structured four-step methodology ensuring clarity, precision, and alignment across real estate and automation engagements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-blue-600 mb-3">01</div>
                <h4 className="text-lg font-bold text-slate-950 mb-2">Understand</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Understand the business objective, market dynamics, property requirements, or sales bottleneck.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-blue-600 mb-3">02</div>
                <h4 className="text-lg font-bold text-slate-950 mb-2">Build</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Design the appropriate advisory approach, property shortlist, or sales automation architecture.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-blue-600 mb-3">03</div>
                <h4 className="text-lg font-bold text-slate-950 mb-2">Automate</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Connect workflows, lead capture, buyer intelligence, and team execution seamlessly.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-blue-600 mb-3">04</div>
                <h4 className="text-lg font-bold text-slate-950 mb-2">Improve</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Use operational feedback and buyer insights to continuously refine outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Estate + Technology Synergy */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
                Real Estate + Technology
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
                Where Real Estate Advisory Meets Modern Technology
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                High-value residential and commercial property transactions require structure, speed, and intelligence. By applying modern lead orchestration and buyer intelligence to active growth corridors, Vardhan delivers structured clarity for buyers, commercial clients, and partners.
              </p>
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Structured Qualification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Residential &amp; Commercial Advisory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Transparent Processes</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3 min-w-[220px]">
              <Link
                href="/contact"
                className="w-full text-center px-6 py-3.5 rounded-xl font-semibold text-slate-950 bg-white hover:bg-blue-50 transition-colors text-sm shadow-sm"
              >
                Start a Conversation
              </Link>
              <Link
                href="/real-estate"
                className="w-full text-center px-6 py-3.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-sm"
              >
                Explore Real Estate Advisory
              </Link>
            </div>
          </div>
        </section>

        {/* Final Conversion CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-center bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-4">
              Have a Requirement in Real Estate, Business Automation, or Technology?
            </h3>
            <p className="text-slate-600 text-sm sm:text-base mb-8">
              Reach out to our advisory and technology team to discuss your objectives.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md text-base"
            >
              <span>Start a Conversation</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
