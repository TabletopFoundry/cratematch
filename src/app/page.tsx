import Link from "next/link";

import { GameCover } from "@/components/game-cover";
import { getLandingPageSnapshot } from "@/lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const { featuredMatch, testimonials, faq, plans, howItWorks, stats } = getLandingPageSnapshot();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">
            Personalized board game subscription
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl">
            A warm, premium crate matched to your shelf — not someone else’s.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            CrateMatch blends taste onboarding, collection intelligence, and content-based curation to reveal one monthly board game that actually fits your table.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/onboarding" className="rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-stone-950/15">
              Start taste quiz
            </Link>
            <Link href="/plans" className="rounded-full border border-orange-200 bg-white px-6 py-3 text-sm font-medium text-stone-700">
              View subscription tiers
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-orange-100 bg-white/90 px-5 py-4 shadow-sm">
                <div className="text-2xl font-semibold text-stone-950">{stat.value}</div>
                <div className="mt-1 text-sm text-stone-600 capitalize">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-6 shadow-[0_32px_90px_-55px_rgba(154,52,18,0.55)]">
          {featuredMatch ? (
            <div className="grid gap-6 sm:grid-cols-[1fr_1.05fr]">
              <GameCover game={featuredMatch.game} />
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">This month’s match</p>
                  <h2 className="mt-2 text-3xl font-semibold text-stone-950">{featuredMatch.game.title}</h2>
                  <p className="mt-2 text-sm text-stone-600">{featuredMatch.game.description}</p>
                </div>
                <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50/60 p-4">
                  <div className="text-sm font-semibold text-stone-950">Why this game?</div>
                  <ul className="mt-3 space-y-2 text-sm text-stone-600">
                    {featuredMatch.reasons.slice(0, 3).map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span className="mt-0.5 text-orange-500">✦</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {featuredMatch.game.themes.map((theme) => (
                    <span key={theme} className="rounded-full border border-orange-200 px-3 py-1">{theme}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-orange-200 bg-orange-50/60 px-4 py-12 text-center text-sm text-stone-600">
              We’re preparing the first featured reveal. Check back after onboarding finishes.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">Three steps from taste to unboxing</h2>
          </div>
          <Link href="/box" className="text-sm font-medium text-orange-600">
            See the monthly box preview →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <div key={item.step} className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">{item.step}</div>
              <h3 className="mt-3 text-xl font-semibold text-stone-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Pricing tiers</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950">Choose the crate rhythm that fits your shelf</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white ${plan.accent}`}>
                {plan.name}
              </div>
              <div className="mt-4 text-3xl font-semibold text-stone-950">{plan.price}<span className="text-sm font-medium text-stone-500"> / month</span></div>
              <p className="mt-3 text-sm text-stone-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-stone-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-0.5 text-orange-500">✦</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Subscriber love</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950">Mock testimonials from the first cozy wave of crates</h2>
          <div className="mt-6 grid gap-4">
            {testimonials.length ? testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
                <p className="text-base leading-8 text-stone-700">“{testimonial.quote}”</p>
                <div className="mt-4 text-sm font-semibold text-stone-950">{testimonial.name}</div>
                <div className="text-sm text-stone-500">{testimonial.location}</div>
              </div>
            )) : (
              <div className="rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/60 p-6 text-sm text-stone-600">
                Social proof is still loading in — the product gracefully falls back to a warm placeholder state.
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950">Questions before your first box?</h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <div key={item.question} className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold text-stone-950">{item.question}</div>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
