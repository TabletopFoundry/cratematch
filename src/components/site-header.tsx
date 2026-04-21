"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const links = [
  { href: "/onboarding", label: "Taste quiz" },
  { href: "/plans", label: "Plans" },
  { href: "/box", label: "Monthly box" },
  { href: "/collection", label: "Collection" },
  { href: "/feedback", label: "Feedback" },
  { href: "/community", label: "Community" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // R1: Mobile drawer is closed via onClick handlers on each nav link below.

  // A1: Focus trap + Escape handler for mobile nav drawer
  const handleDrawerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    []
  );

  // Move focus into drawer when opened
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstLink = drawerRef.current.querySelector<HTMLElement>("a[href]");
      firstLink?.focus();
    }
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-orange-100/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-xl shadow-lg shadow-orange-200/70">
            🎲
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-stone-950">CrateMatch</div>
            <div className="text-xs uppercase tracking-[0.24em] text-stone-500">Personal board game curation</div>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-5 text-sm font-medium text-stone-600 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded px-1 py-0.5 ${active ? "text-orange-600 font-semibold border-b-2 border-orange-500" : "hover:text-orange-600"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-white text-stone-700 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav
          ref={drawerRef}
          aria-label="Mobile navigation"
          onKeyDown={handleDrawerKeyDown}
          className="border-t border-orange-100 bg-white/95 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${active ? "bg-orange-50 text-orange-600 font-semibold" : "text-stone-700 hover:bg-orange-50 hover:text-orange-600"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
