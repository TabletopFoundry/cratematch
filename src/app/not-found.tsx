import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-orange-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Page not found</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">That crate slipped off the shelf.</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">Head back home to continue exploring plans, taste onboarding, and this month’s match.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          Return home
        </Link>
      </div>
    </div>
  );
}
