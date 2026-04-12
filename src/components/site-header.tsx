import Link from "next/link";

const links = [
  { href: "/onboarding", label: "Taste quiz" },
  { href: "/plans", label: "Plans" },
  { href: "/box", label: "Monthly box" },
  { href: "/collection", label: "Collection" },
  { href: "/community", label: "Community" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-orange-100/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-xl shadow-lg shadow-orange-200/70">
            🎲
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-stone-950">CrateMatch</div>
            <div className="text-xs uppercase tracking-[0.24em] text-stone-500">Personal board game curation</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-stone-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-orange-600">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
