"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Something went sideways</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">We couldn’t load this CrateMatch view.</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">Try again to recover. Every error state in the MVP includes a clear next action.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
