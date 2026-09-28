import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '../common/Logo';
import { trackEvent, AnalyticsEventName } from '../../services/analytics';
import { Menu, X, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ label: string; path: string; ctaEvent: AnalyticsEventName }> = [
    { label: 'Real Estate', path: '/real-estate', ctaEvent: 'real_estate_cta_clicked' },
    { label: 'Automation', path: '/automation', ctaEvent: 'automation_cta_clicked' },
    { label: 'GrowthForge', path: '/growthforge', ctaEvent: 'growthforge_cta_clicked' },
    { label: 'Contact', path: '/contact', ctaEvent: 'contact_started' },
  ];

  const handleNavClick = (path: string, eventName?: AnalyticsEventName) => {
    if (eventName) {
      trackEvent(eventName);
    }
    trackEvent('page_view', { target_path: path });
    if (onNavigate) {
      onNavigate(path);
    }
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Brand Logo */}
          <Link
            href="/"
            onClick={() => handleNavClick('/')}
            className="cursor-pointer flex items-center py-2 group"
          >
            <Logo size="md" className="group-hover:opacity-95 transition-opacity" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => handleNavClick(item.path, item.ctaEvent)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    active
                      ? 'text-blue-700 bg-blue-50/80'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/admin"
              onClick={() => handleNavClick('/admin')}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 flex items-center gap-1 transition-colors"
              title="Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => handleNavClick('/contact', 'contact_started')}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 transition-colors shadow-xs active:scale-[0.98]"
            >
              <span>Enquire Now</span>
              <ArrowUpRight className="w-4 h-4 opacity-75" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-2">
            <Link
              href="/"
              onClick={() => handleNavClick('/')}
              className={`text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                isActive('/') ? 'text-blue-700 bg-blue-50' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleNavClick(item.path, item.ctaEvent)}
                className={`text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                  isActive(item.path) ? 'text-blue-700 bg-blue-50' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/contact"
                onClick={() => handleNavClick('/contact', 'contact_started')}
                className="w-full text-center px-4 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                Enquire Now
              </Link>

              <Link
                href="/admin"
                onClick={() => handleNavClick('/admin')}
                className="w-full text-center px-4 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Internal Admin Portal</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
