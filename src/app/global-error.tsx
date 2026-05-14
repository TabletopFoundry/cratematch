"use client";

import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.85),transparent_38%),linear-gradient(180deg,#fff7ed_0%,#fffdfb_24%,#fff_100%)] text-stone-900">
        <title>CrateMatch error</title>
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="w-full rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Something went sideways</p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">CrateMatch hit a root-level error.</h1>
            <p className="mt-4 text-sm leading-7 text-stone-600">Try again to recover the full app shell. If the issue continues, restart the app and reload the page.</p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
