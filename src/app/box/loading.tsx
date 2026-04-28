export default function BoxLoading() {
  return (
    <div role="status" aria-label="Loading monthly box" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-5">
          <div className="h-8 w-48 rounded-full bg-orange-100" />
          <div className="h-12 w-3/4 rounded-3xl bg-orange-100" />
          <div className="h-6 w-full rounded-2xl bg-orange-100" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-[1.5rem] bg-orange-100" />
            ))}
          </div>
          <div className="aspect-[4/3] rounded-[2rem] bg-orange-100" />
        </div>
        <div className="space-y-6">
          <div className="h-72 rounded-[2rem] bg-orange-100" />
          <div className="h-48 rounded-[1.75rem] bg-orange-100" />
        </div>
      </section>
    </div>
  );
}
