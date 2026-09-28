import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://vardhantechverse.com'),
  title: 'Vardhan Techverse | Technology-enabled Real Estate & Business Automation',
  description:
    'Premium Real Estate Advisory & Brokerage in Gurugram, AI-powered Lead-to-Sales Systems, and GrowthForge Technology Intelligence.',
  icons: {
    icon: '/favicon.ico',
    apple: '/brand/icon-192.png',
  },
  openGraph: {
    title: 'Vardhan Techverse | Technology-enabled Real Estate & Business Automation',
    description:
      'Premium Real Estate Advisory in Gurugram, AI-powered Lead-to-Sales Systems, and GrowthForge Technology Layer.',
    url: 'https://vardhantechverse.com',
    siteName: 'Vardhan Techverse Private Limited',
    images: [
      {
        url: '/brand/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vardhan Techverse Private Limited',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-brand-navy-950 antialiased">
        {children}
      </body>
    </html>
  );
}
