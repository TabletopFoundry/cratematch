export function SiteFooter() {
  return (
    <footer className="border-t border-orange-100 bg-white/85">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-10 text-sm text-stone-500 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-semibold text-stone-900">CrateMatch MVP</div>
          <p>Personalized board game subscription demo with SQLite persistence and content-based matching.</p>
        </div>
        <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-stone-700">
          Cutoff reminder: changes lock on the 20th at 11:59 PM local time.
        </div>
      </div>
    </footer>
  );
}
