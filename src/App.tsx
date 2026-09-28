import React, { useState, useEffect } from 'react';
import HomePage from './app/page';
import RealEstatePage from './app/real-estate/page';
import AutomationPage from './app/automation/page';
import GrowthForgePage from './app/growthforge/page';
import ContactPage from './app/contact/page';
import PrivacyPage from './app/privacy/page';
import TermsPage from './app/terms/page';
import AdminLoginPage from './app/admin/login/page';
import AdminPortalPage from './app/admin/page';

export default function App() {
  const [path, setPath] = useState('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPath(window.location.pathname || '/');

      const handlePopState = () => {
        setPath(window.location.pathname || '/');
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  if (path === '/real-estate') return <RealEstatePage />;
  if (path === '/automation') return <AutomationPage />;
  if (path === '/growthforge') return <GrowthForgePage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/terms') return <TermsPage />;
  if (path === '/admin/login') return <AdminLoginPage />;
  if (path === '/admin') return <AdminPortalPage />;

  return <HomePage />;
}
