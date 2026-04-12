export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <div className="h-10 w-48 rounded-full bg-orange-100" />
      <div className="h-16 w-3/4 rounded-3xl bg-orange-100" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 rounded-[2rem] bg-orange-100" />
        ))}
      </div>
      <div className="h-80 rounded-[2rem] bg-orange-100" />
    </div>
  );
}
