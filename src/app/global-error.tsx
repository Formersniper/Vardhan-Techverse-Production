'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Something went wrong</h2>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-brand-navy-950 text-white rounded text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
