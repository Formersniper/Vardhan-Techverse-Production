'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/forms/ContactForm';
import { getSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content';
import { Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [content, setContent] = useState<Record<string, any>>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setContent(data);
    });
  }, []);

  const profile = content.COMPANY_PROFILE || DEFAULT_SITE_CONTENT.COMPANY_PROFILE;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar currentPath="/contact" />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Direct Advisory &amp; Inquiries
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Let's Start a Conversation
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Tell us what you are looking to achieve and the appropriate Vardhan team will take it forward.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-950 mb-4">
                Corporate Advisory Office
              </h2>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">Location &amp; Operating Markets</span>
                    <span>{profile.operating_location || 'Gurugram, Haryana, India (Active Focus Market)'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">Operating Hours</span>
                    <span>{profile.operating_hours || 'Monday – Saturday: 9:30 AM – 6:30 PM IST'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-slate-900">Enquiry Confirmation Reference</span>
                    <span>Every submission automatically generates a unique tracking reference number (LEAD-YYYY-NNNNN) for follow-up.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 p-6 rounded-2xl border border-blue-100 text-xs sm:text-sm text-blue-950 leading-relaxed">
              <span className="font-bold block mb-1">Privacy Protection Notice</span>
              Your contact details are processed securely and strictly utilized to address your enquiry. We never share personal information with unauthorized third parties.
            </div>
          </div>

          {/* Form Container */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <ContactForm pageSource="/contact" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
