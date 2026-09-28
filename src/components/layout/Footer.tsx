import React from 'react';
import Link from 'next/link';
import { Logo } from '../common/Logo';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center">
              <Link href="/">
                <Logo size="md" />
              </Link>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Vardhan Techverse Private Limited is a technology-enabled corporate business combining residential and commercial real estate advisory &amp; brokerage, AI sales automation systems, and internal intelligence infrastructure.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Registered Corporate Entity</span>
            </div>
          </div>

          {/* Nav Column 1: Capabilities */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Capabilities
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/real-estate" className="hover:text-white transition-colors">
                  Real Estate Advisory &amp; Brokerage
                </Link>
              </li>
              <li>
                <Link href="/automation" className="hover:text-white transition-colors">
                  AI Lead-to-Sales Automation
                </Link>
              </li>
              <li>
                <Link href="/growthforge" className="hover:text-white transition-colors">
                  GrowthForge Intelligence Layer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Enquire Now</span>
                  <ArrowUpRight className="w-3 h-3 text-blue-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 2: Legal & Admin */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Corporate &amp; Governance
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Internal Staff Portal</span>
                  <ShieldCheck className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <div>
            &copy; 2026 Vardhan Techverse Private Limited. All rights reserved.
          </div>
          <div>
            Active Focus in Gurugram &amp; NCR | Evolving Market Coverage
          </div>
        </div>
      </div>
    </footer>
  );
};
