'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import {
  Building2,
  Search,
  MapPin,
  Compass,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function RealEstatePage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const realty = content.REALTY_CAPABILITY || DEFAULT_SITE_CONTENT.REALTY_CAPABILITY;

  const services = [
    {
      title: 'Residential Property Search & Discovery',
      description: 'Systematic search for apartments, luxury homes, and villas based on budget, layout, timeline, and lifestyle requirements.',
      icon: Search,
    },
    {
      title: 'Commercial Advisory & Office Spaces',
      description: 'Requirement mapping for commercial office spaces, retail assets, and corporate real estate needs across active markets.',
      icon: Building,
    },
    {
      title: 'Property Shortlisting & Evaluation',
      description: 'Objective comparative filtering highlighting layout efficiency, price trends, floor rise factors, and developer credibility.',
      icon: FileCheck,
    },
    {
      title: 'Site Visit & Property Tours',
      description: 'Seamless coordination for property walkthroughs, sample apartment tours, and developer gallery meetings.',
      icon: MapPin,
    },
    {
      title: 'Developer Project Discovery',
      description: 'Insights into ongoing, newly launched, and upcoming developments by reputed Tier-1 developers.',
      icon: Building2,
    },
    {
      title: 'Transaction Support',
      description: 'End-to-end guidance during allotment procedures, payment schedule understanding, documentation review, and handover.',
      icon: ShieldCheck,
    },
  ];

  const focusCorridors = [
    'Golf Course Road & Extension',
    'Southern Peripheral Road (SPR)',
    'Dwarka Expressway (DXP)',
    'New Gurugram Growth Corridors',
    'Central Business Districts',
    'Key National Capital Region Markets',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/real-estate" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Residential &amp; Commercial Real Estate Advisory &amp; Brokerage
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6">
              {realty.title}
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              {realty.subtitle}
            </p>

            <div className="flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-slate-950 hover:bg-blue-600 transition-colors shadow-sm text-sm sm:text-base"
              >
                <span>Discuss Your Property Requirement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Dual Focus: Residential + Commercial */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold mb-4">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-2">
                Residential Advisory
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Client-focused advisory for home buyers and investors seeking premium luxury apartments, independent floors, and residential developments across active growth corridors.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-4">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-2">
                Commercial Advisory
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tailored commercial property search, office space requirement mapping, and asset advisory for corporate occupiers, businesses, and commercial investors.
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Services
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Advisory &amp; Brokerage Services
            </h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Structured assistance at every stage of your residential or commercial real estate acquisition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const IconComp = service.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-950 mb-2">
                    {service.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Focus Corridors */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
          <div className="max-w-5xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight mb-4">
              Active Growth Corridors &amp; Markets
            </h3>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-8">
              We track developments across key growth corridors, with market coverage evolving according to client requirements and business opportunities.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {focusCorridors.map((market, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{market}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mb-4">
            Looking for Residential or Commercial Property?
          </h3>
          <p className="text-slate-600 text-sm sm:text-base mb-8">
            Tell us your requirement, location preference, and budget, and our real estate team will guide your options.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm text-base"
          >
            <span>Start Advisory Conversation</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
