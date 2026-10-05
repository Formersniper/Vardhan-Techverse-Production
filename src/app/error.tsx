'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans text-center">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Something went wrong</h2>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}