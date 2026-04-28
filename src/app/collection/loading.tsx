export default function CollectionLoading() {
  return (
    <div role="status" aria-label="Loading collection" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <section className="max-w-3xl space-y-3">
        <div className="h-5 w-40 rounded-full bg-orange-100" />
        <div className="h-10 w-3/4 rounded-3xl bg-orange-100" />
        <div className="h-6 w-full rounded-2xl bg-orange-100" />
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 rounded-[2rem] bg-orange-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-[2rem] bg-orange-100" />
        <div className="h-64 rounded-[2rem] bg-orange-100" />
      </div>
    </div>
  );
}
