export default function OnboardingLoading() {
  return (
    <div role="status" aria-label="Loading onboarding" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5 rounded-[2rem] bg-orange-100 p-6">
          <div className="h-5 w-40 rounded-full bg-orange-200/60" />
          <div className="h-12 w-3/4 rounded-3xl bg-orange-200/60" />
          <div className="h-6 w-full rounded-2xl bg-orange-200/60" />
          <div className="h-32 rounded-[1.75rem] bg-orange-200/60" />
          <div className="h-28 rounded-[1.75rem] bg-orange-200/60" />
        </div>
        <div className="space-y-5">
          <div className="h-10 w-48 rounded-full bg-orange-100" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-44 rounded-[2rem] bg-orange-100" />
            ))}
          </div>
          <div className="h-12 w-full rounded-full bg-orange-100" />
        </div>
      </section>
    </div>
  );
}
