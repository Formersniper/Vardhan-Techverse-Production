import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-extrabold text-brand-navy-950 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-3">Page Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">
          The requested page could not be located on the corporate portal.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-brand-navy-950 text-white rounded-md text-sm font-medium hover:bg-brand-blue-600 transition-colors"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
